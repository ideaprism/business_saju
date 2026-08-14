"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberFields from "./MemberFields";

export default function CreatePartyForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyName: fd.get("partyName"),
          leader: {
            name: fd.get("name"),
            birthDate: fd.get("birthDate"),
            calendarType: fd.get("calendarType"),
            mbti: fd.get("mbti"),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "파티 생성에 실패했어요.");
      router.push(`/party/${data.partyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "파티 생성에 실패했어요.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="error">{error}</div>}
      <div className="field">
        <label>파티 이름</label>
        <input name="partyName" placeholder="예: 사이드프로젝트 원정대" required maxLength={30} />
      </div>
      <MemberFields nameLabel="내 이름 (파티 리더)" />
      <button className="btn" disabled={loading}>
        {loading ? "파티 결성 중..." : "⚔️ 파티 결성하기"}
      </button>
    </form>
  );
}
