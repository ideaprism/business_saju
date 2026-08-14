import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Pool } from "pg";
import { put, get, del } from "@vercel/blob";
import type { CalendarType, Member, Party, PartyReport } from "./types";

export const MAX_MEMBERS = 8;

// ─────────────────────────────────────────────────────────────
// 저장 백엔드 우선순위:
//   1) Redis (Upstash/Vercel KV REST 환경변수)
//   2) Vercel Blob (BLOB_READ_WRITE_TOKEN)
//   3) Postgres (Supabase 연동 — POSTGRES_URL)
//   4) 로컬 JSON 파일 (Vercel 서버리스에서는 /tmp — 인스턴스 한정 임시 저장)
// ─────────────────────────────────────────────────────────────

interface Backend {
  getParty(id: string): Promise<Party | null>;
  saveParty(party: Party): Promise<void>;
  deleteParty(party: Party): Promise<void>;
  findByInviteToken(token: string): Promise<Party | null>;
  findByShareSlug(slug: string): Promise<Party | null>;
}

// ── Redis (Upstash REST 프로토콜 — Vercel KV 호환) ──────────

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`REDIS_${res.status}`);
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

const redisBackend: Backend = {
  async getParty(id) {
    const raw = (await redis(["GET", `party:${id}`])) as string | null;
    return raw ? (JSON.parse(raw) as Party) : null;
  },
  async saveParty(party) {
    await redis(["SET", `party:${party.id}`, JSON.stringify(party)]);
    await redis(["SET", `invite:${party.inviteToken}`, party.id]);
    await redis(["SET", `slug:${party.shareSlug}`, party.id]);
  },
  async deleteParty(party) {
    await redis(["DEL", `party:${party.id}`, `invite:${party.inviteToken}`, `slug:${party.shareSlug}`]);
  },
  async findByInviteToken(token) {
    const id = (await redis(["GET", `invite:${token}`])) as string | null;
    return id ? this.getParty(id) : null;
  },
  async findByShareSlug(slug) {
    const id = (await redis(["GET", `slug:${slug}`])) as string | null;
    return id ? this.getParty(id) : null;
  },
};

// ── Vercel Blob 백엔드 (BLOB_READ_WRITE_TOKEN) ──────────────
// 단일 키 덮어쓰기 + get({ useCache: false })로 항상 최신 버전 읽기.
// invite/slug → partyId 매핑은 생성 후 불변이라 캐시 이슈가 없다.

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

async function blobRead(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return new Response(result.stream).text();
}

/**
 * Blob은 쓰기 직후 같은 경로를 읽어도 잠시 이전 내용(또는 없음)이 보이는
 * 전파 지연이 있다. 파티 생성 직후 대시보드로 이동하는 흐름에서 이 지연은
 * "파티를 찾을 수 없어요"로 나타나므로, 쓴 내용이 실제로 읽힐 때까지 확인한다.
 */
async function blobWrite(pathname: string, content: string): Promise<void> {
  await put(pathname, content, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  for (let i = 0; i < 10; i++) {
    if ((await blobRead(pathname)) === content) return;
    await new Promise((r) => setTimeout(r, 150 + i * 30));
  }
}

const blobBackend: Backend = {
  async getParty(id) {
    const raw = await blobRead(`party/${id}.json`);
    return raw ? (JSON.parse(raw) as Party) : null;
  },
  async saveParty(party) {
    await Promise.all([
      blobWrite(`party/${party.id}.json`, JSON.stringify(party)),
      blobWrite(`invite/${party.inviteToken}.json`, JSON.stringify({ partyId: party.id })),
      blobWrite(`slug/${party.shareSlug}.json`, JSON.stringify({ partyId: party.id })),
    ]);
  },
  async deleteParty(party) {
    await del([
      `party/${party.id}.json`,
      `invite/${party.inviteToken}.json`,
      `slug/${party.shareSlug}.json`,
    ]);
  },
  async findByInviteToken(token) {
    const raw = await blobRead(`invite/${token}.json`);
    if (!raw) return null;
    return this.getParty((JSON.parse(raw) as { partyId: string }).partyId);
  },
  async findByShareSlug(slug) {
    const raw = await blobRead(`slug/${slug}.json`);
    if (!raw) return null;
    return this.getParty((JSON.parse(raw) as { partyId: string }).partyId);
  },
};

// ── Postgres 백엔드 (Supabase 연동 — POSTGRES_URL) ──────────

const PG_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool: Pool | null = null;
let tableReady: Promise<void> | null = null;

function pg(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: PG_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = pg()
      .query(
        `CREATE TABLE IF NOT EXISTS party_up_parties (
           id TEXT PRIMARY KEY,
           invite_token TEXT UNIQUE NOT NULL,
           share_slug TEXT UNIQUE NOT NULL,
           data JSONB NOT NULL,
           updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
         )`
      )
      .then(() => undefined);
  }
  return tableReady;
}

async function pgFindOne(where: string, value: string): Promise<Party | null> {
  await ensureTable();
  const res = await pg().query(
    `SELECT data FROM party_up_parties WHERE ${where} = $1 LIMIT 1`,
    [value]
  );
  return res.rows.length ? (res.rows[0].data as Party) : null;
}

const pgBackend: Backend = {
  async getParty(id) {
    return pgFindOne("id", id);
  },
  async saveParty(party) {
    await ensureTable();
    await pg().query(
      `INSERT INTO party_up_parties (id, invite_token, share_slug, data, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE
         SET invite_token = $2, share_slug = $3, data = $4, updated_at = now()`,
      [party.id, party.inviteToken, party.shareSlug, JSON.stringify(party)]
    );
  },
  async deleteParty(party) {
    await ensureTable();
    await pg().query(`DELETE FROM party_up_parties WHERE id = $1`, [party.id]);
  },
  async findByInviteToken(token) {
    return pgFindOne("invite_token", token);
  },
  async findByShareSlug(slug) {
    return pgFindOne("share_slug", slug);
  },
};

// ── 파일 백엔드 (로컬 개발 / 외부 저장소 미설정 시 임시) ─────

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "party-up-data")
  : path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "parties.json");

function loadFile(): Record<string, Party> {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveFile(db: Record<string, Party>) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

const fileBackend: Backend = {
  async getParty(id) {
    return loadFile()[id] ?? null;
  },
  async saveParty(party) {
    const db = loadFile();
    db[party.id] = party;
    saveFile(db);
  },
  async deleteParty(party) {
    const db = loadFile();
    delete db[party.id];
    saveFile(db);
  },
  async findByInviteToken(token) {
    return Object.values(loadFile()).find((p) => p.inviteToken === token) ?? null;
  },
  async findByShareSlug(slug) {
    return Object.values(loadFile()).find((p) => p.shareSlug === slug) ?? null;
  },
};

const backend: Backend =
  REDIS_URL && REDIS_TOKEN
    ? redisBackend
    : BLOB_TOKEN
      ? blobBackend
      : PG_URL
        ? pgBackend
        : fileBackend;

export const storageMode: "redis" | "blob" | "postgres" | "file" =
  REDIS_URL && REDIS_TOKEN
    ? "redis"
    : BLOB_TOKEN
      ? "blob"
      : PG_URL
        ? "postgres"
        : "file";

// ─────────────────────────────────────────────────────────────
// 도메인 API
// ─────────────────────────────────────────────────────────────

function id(bytes = 8): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export interface MemberInput {
  name: string;
  birthDate: string;
  calendarType: CalendarType;
  mbti?: string;
}

function toMember(input: MemberInput): Member {
  return {
    id: id(6),
    name: input.name.trim().slice(0, 20),
    birthDate: input.birthDate,
    calendarType: input.calendarType === "lunar" ? "lunar" : "solar",
    mbti: input.mbti?.trim().toUpperCase() || undefined,
    createdAt: new Date().toISOString(),
  };
}

/** 구버전 데이터에 shareSlug가 없으면 채워넣는다 */
async function migrate(party: Party | null): Promise<Party | null> {
  if (party && !party.shareSlug) {
    party.shareSlug = id(8);
    await backend.saveParty(party);
  }
  return party;
}

export async function createParty(name: string, leader: MemberInput): Promise<Party> {
  const party: Party = {
    id: id(8),
    name: name.trim().slice(0, 30),
    inviteToken: id(12),
    shareSlug: id(8),
    createdAt: new Date().toISOString(),
    members: [toMember(leader)],
  };
  await backend.saveParty(party);
  return party;
}

export async function getParty(partyId: string): Promise<Party | null> {
  return migrate(await backend.getParty(partyId));
}

export async function getPartyByInviteToken(token: string): Promise<Party | null> {
  return migrate(await backend.findByInviteToken(token));
}

export async function getPartyByShareSlug(slug: string): Promise<Party | null> {
  return backend.findByShareSlug(slug);
}

export async function addMember(partyId: string, input: MemberInput): Promise<Party> {
  const party = await backend.getParty(partyId);
  if (!party) throw new Error("PARTY_NOT_FOUND");
  if (party.members.length >= MAX_MEMBERS) throw new Error("PARTY_FULL");
  party.members.push(toMember(input));
  await backend.saveParty(party);
  return party;
}

export async function removeMember(partyId: string, memberId: string): Promise<Party> {
  const party = await backend.getParty(partyId);
  if (!party) throw new Error("PARTY_NOT_FOUND");
  party.members = party.members.filter((m) => m.id !== memberId);
  await backend.saveParty(party);
  return party;
}

export async function saveReport(partyId: string, report: PartyReport): Promise<void> {
  const party = await backend.getParty(partyId);
  if (!party) throw new Error("PARTY_NOT_FOUND");
  party.report = report;
  await backend.saveParty(party);
}

export async function deleteParty(partyId: string): Promise<boolean> {
  const party = await backend.getParty(partyId);
  if (!party) return false;
  await backend.deleteParty(party);
  return true;
}
