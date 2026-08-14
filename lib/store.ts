import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { CalendarType, Member, Party, PartyReport } from "./types";

export const MAX_MEMBERS = 8;

// ─────────────────────────────────────────────────────────────
// 저장 백엔드: Upstash/Vercel KV(Redis REST) 환경변수가 있으면 Redis,
// 없으면 로컬 JSON 파일 (Vercel 서버리스에서는 /tmp — 인스턴스 한정 임시 저장).
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

// ── 파일 백엔드 (로컬 개발 / Redis 미설정 시 임시) ───────────

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

const backend: Backend = REDIS_URL && REDIS_TOKEN ? redisBackend : fileBackend;

export const storageMode: "redis" | "file" =
  REDIS_URL && REDIS_TOKEN ? "redis" : "file";

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
