"use client";

import { useState } from "react";

export default function ReportSection({
  partyId,
  initialReport,
  memberCount,
}: {
  partyId: string;
  initialReport: { text: string; createdAt: string } | null;
  memberCount: number;
}) {
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parties/${partyId}/report`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "리포트 생성에 실패했어요.");
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "리포트 생성에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>도감 리포트 · AI 종합 진단</h2>
      {report ? (
        <>
          <div className="panel-inner" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {report.text}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>
            {new Date(report.createdAt).toLocaleString("ko-KR")} 생성 · 멤버 구성이 바뀌면 다시 생성할 수 있어요.
          </p>
        </>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 14 }}>
            파티 {memberCount}명의 클래스·스탯·시너지를 통째로 읽고, 이 파티만을 위한
            종합 전략 리포트를 AI가 작성합니다.
          </p>
          {error && <div className="error">{error}</div>}
          <button className="btn" onClick={generate} disabled={loading || memberCount < 2}>
            {loading ? "🔮 도감을 작성하는 중... (최대 1분)" : "🔮 파티 도감 리포트 생성"}
          </button>
          {memberCount < 2 && (
            <p className="small muted" style={{ marginTop: 8 }}>
              파티원이 2명 이상 모이면 생성할 수 있어요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
