"use client";

import { useState } from "react";

export default function ShareCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${slug}`
      : `/share/${slug}`;

  return (
    <div className="panel">
      <h2>공유 카드</h2>
      <p className="muted" style={{ marginBottom: 10 }}>
        파티 밖 사람에게 자랑할 수 있는 공개 페이지예요. <b>생년월일은 노출되지 않고</b>,
        초대 링크와 달리 멤버 추가·삭제도 할 수 없어요.
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
    </div>
  );
}
