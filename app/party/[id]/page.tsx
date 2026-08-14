import CopyInvite from "@/components/CopyInvite";
import Disclaimer from "@/components/Disclaimer";
import PartyDashboard from "@/components/PartyDashboard";
import ReportSection from "@/components/ReportSection";
import ShareCard from "@/components/ShareCard";
import { buildPartyView } from "@/lib/engine";
import { getParty, MAX_MEMBERS } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const party = await getParty(id);

  if (!party) {
    return (
      <main>
        <div className="panel" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: 10 }}>🗺️ 파티를 찾을 수 없어요</h1>
          <p className="muted">해산되었거나 주소가 잘못되었을 수 있어요.</p>
        </div>
      </main>
    );
  }

  const { sheets, synergies, analysis, report } = buildPartyView(party);

  return (
    <main>
      <div className="hero" style={{ paddingBottom: 16 }}>
        <div className="pixel" style={{ fontSize: 14, color: "var(--gold)", marginBottom: 8 }}>
          🏕️ 원정대 캠프
        </div>
        <h1>{party.name}</h1>
        {analysis && (
          <p>
            <span className="pixel" style={{ color: "var(--gold)" }}>
              {analysis.partyTypeName}
            </span>
            {" · "}파티원 {sheets.length}명 · 평균 케미 {analysis.avgScore}점
          </p>
        )}
      </div>

      {/* 초대 */}
      {sheets.length < MAX_MEMBERS && (
        <div className="panel">
          <h2>파티원 모집 중 ({sheets.length}/{MAX_MEMBERS})</h2>
          <p className="muted" style={{ marginBottom: 10 }}>
            이 링크를 팀원에게 보내세요. 각자 자기 생일을 입력하면 지도에 합류합니다.
          </p>
          <CopyInvite token={party.inviteToken} />
        </div>
      )}

      <PartyDashboard
        sheets={sheets}
        synergies={synergies}
        analysis={analysis}
        partyId={party.id}
      />

      {/* AI 리포트 */}
      <ReportSection partyId={party.id} initialReport={report} memberCount={sheets.length} />

      {/* 공유 카드 */}
      {analysis && <ShareCard slug={party.shareSlug} />}

      {!analysis && (
        <div className="panel" style={{ textAlign: "center" }}>
          <p className="muted">
            파티원이 2명 이상 모이면 시너지 분석이 시작됩니다. 초대 링크를 공유해보세요!
          </p>
        </div>
      )}

      <Disclaimer />
    </main>
  );
}
