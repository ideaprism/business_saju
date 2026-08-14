"use client";

import { useState } from "react";

export default function CopyInvite({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${token}`
      : `/join/${token}`;

  return (
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
  );
}
