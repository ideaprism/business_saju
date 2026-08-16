"use client";

import { useEffect, useState } from "react";
import { rememberParty } from "@/lib/recent";

/**
 * 파티 페이지에 들어오면 브라우저에 기록하고(2),
 * 주소를 잃어버리면 복구할 수 없다는 사실을 알린다(3).
 */
export default function PartyBookmark({
  partyId,
  partyName,
}: {
  partyId: string;
  partyName: string;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    rememberParty({ id: partyId, name: partyName });
    setUrl(`${window.location.origin}/party/${partyId}`);
  }, [partyId, partyName]);

  return (
    <div className="bookmark-bar">
      <div className="bookmark-head">🔖 이 주소를 저장해두세요</div>
      <p className="small muted" style={{ marginBottom: 10 }}>
        로그인이 없어서 <b>이 주소가 파티로 돌아오는 유일한 열쇠</b>예요. 카톡으로
        나에게 보내두거나 즐겨찾기 해두시면 안전합니다.
      </p>
      <div className="copy-box">
        <input value={url} readOnly onFocus={(e) => e.currentTarget.select()} />
        <button
          className="btn btn-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "복사 완료!" : "🔗 복사"}
        </button>
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>
        ✅ 이 브라우저에는 자동으로 기록해뒀어요 — 첫 화면의 <b>내 원정대</b>에서 다시
        열 수 있습니다. (다른 기기에서는 위 주소가 필요해요)
      </p>
    </div>
  );
}
