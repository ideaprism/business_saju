import Link from "next/link";
import type { Metadata } from "next";
import Disclaimer from "@/components/Disclaimer";
import PartyDashboard from "@/components/PartyDashboard";
import { buildPartyView } from "@/lib/engine";
import { getPartyByShareSlug } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const party = await getPartyByShareSlug(slug);
  if (!party) return { title: "파티업 — 원정대를 찾을 수 없어요" };
  return {
    title: `${party.name} — 파티업 원정대 도감`,
    description: `${party.members.length}명의 원정대. 클래스와 시너지를 구경해보세요.`,
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const party = await getPartyByShareSlug(slug);

  if (!party) {
    return (
      <main>
        <div className="panel" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: 10 }}>🗺️ 원정대를 찾을 수 없어요</h1>
          <p className="muted">해산되었거나 주소가 잘못되었을 수 있어요.</p>
        </div>
      </main>
    );
  }

  const { sheets, synergies, analysis } = buildPartyView(party);

  return (
    <main>
      <div className="hero" style={{ paddingBottom: 16 }}>
        <div className="pixel" style={{ fontSize: 14, color: "var(--gold)", marginBottom: 8 }}>
          📖 원정대 도감 · 공개 열람본
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
        <p className="small muted">구성원의 생년월일은 공개되지 않아요.</p>
      </div>

      <PartyDashboard sheets={sheets} synergies={synergies} analysis={analysis} />

      <div className="panel" style={{ textAlign: "center" }}>
        <h2 style={{ justifyContent: "center" }}>우리 팀도 궁금하다면</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          생년월일만으로 우리 팀의 클래스와 시너지를 확인해보세요.
        </p>
        <Link href="/" className="btn" style={{ textDecoration: "none", display: "inline-block" }}>
          ⚔️ 내 원정대 만들기
        </Link>
      </div>

      <Disclaimer />
    </main>
  );
}
