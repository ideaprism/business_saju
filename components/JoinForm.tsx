"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberFields from "./MemberFields";

export default function JoinForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/invites/${token}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          birthDate: fd.get("birthDate"),
          calendarType: fd.get("calendarType"),
          mbti: fd.get("mbti"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "합류에 실패했어요.");
      router.push(`/party/${data.partyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "합류에 실패했어요.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="error">{error}</div>}
      <MemberFields nameLabel="내 이름" />
      <button className="btn" disabled={loading}>
        {loading ? "합류 중..." : "🏕️ 원정대 합류하기"}
      </button>
    </form>
  );
}
