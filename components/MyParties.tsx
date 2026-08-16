"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { forgetParty, loadRecentParties, type RecentParty } from "@/lib/recent";

/** 이 브라우저에서 만들거나 합류한 파티 목록 (첫 화면) */
export default function MyParties() {
  const [parties, setParties] = useState<RecentParty[] | null>(null);

  // localStorage는 서버에 없으므로 마운트 후에 읽는다
  useEffect(() => setParties(loadRecentParties()), []);

  if (!parties || parties.length === 0) return null;

  return (
    <div className="panel">
      <h2>내 원정대</h2>
      <p className="muted small" style={{ marginBottom: 12 }}>
        이 브라우저에서 만들거나 합류한 파티예요.
      </p>
      {parties.map((p) => (
        <div className="recent-row" key={p.id}>
          <Link href={`/party/${p.id}`} className="recent-link">
            🏕️ {p.name}
          </Link>
          <button
            className="btn btn-ghost btn-sm"
            title="목록에서 지우기 (파티는 삭제되지 않아요)"
            onClick={() => {
              forgetParty(p.id);
              setParties(loadRecentParties());
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
