"use client";

/**
 * 로그인이 없는 서비스라 파티 URL이 유일한 열쇠다.
 * 최소한 같은 브라우저에서는 다시 찾아올 수 있도록 방문한 파티를 기록해둔다.
 */

const KEY = "partyup.recentParties";
const MAX = 20;

export interface RecentParty {
  id: string;
  name: string;
  savedAt: string;
}

export function loadRecentParties(): RecentParty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentParty[]) : [];
  } catch {
    return [];
  }
}

function save(list: RecentParty[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // 시크릿 모드 등 저장소를 못 쓰는 경우 — 기록만 못 할 뿐 서비스는 그대로 동작
  }
}

/** 방문한 파티를 목록 맨 앞으로 (중복 제거) */
export function rememberParty(party: { id: string; name: string }) {
  if (typeof window === "undefined") return;
  const list = loadRecentParties().filter((p) => p.id !== party.id);
  list.unshift({ ...party, savedAt: new Date().toISOString() });
  save(list);
}

export function forgetParty(id: string) {
  if (typeof window === "undefined") return;
  save(loadRecentParties().filter((p) => p.id !== id));
}
