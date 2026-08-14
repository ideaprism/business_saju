import DeleteMemberButton from "./DeleteMemberButton";
import PartyGraph from "./PartyGraph";
import Radar from "./Radar";
import { ELEMENT_META, ELEMENTS } from "@/lib/content";
import type {
  CharacterSheet,
  PairSynergy,
  PartyAnalysis,
  PillarInfo,
} from "@/lib/types";

function pillarLabel(p: PillarInfo) {
  return `${p.ganKo}${p.zhiKo}(${p.gan}${p.zhi})`;
}

/**
 * 캐릭터 시트 + 파티 밸런스 + 시너지 지도 + 케미 랭킹.
 * partyId를 주면 멤버 삭제 버튼이 붙고(오너 뷰), 없으면 읽기 전용(공유 카드).
 */
export default function PartyDashboard({
  sheets,
  synergies,
  analysis,
  partyId,
}: {
  sheets: CharacterSheet[];
  synergies: PairSynergy[];
  analysis: PartyAnalysis | null;
  partyId?: string;
}) {
  const maxTotal = analysis
    ? Math.max(...ELEMENTS.map((e) => analysis.elementTotals[e]), 1)
    : 1;

  return (
    <>
      {/* 캐릭터 시트 */}
      <div className="panel">
        <h2>캐릭터 시트</h2>
        <div className="grid">
          {sheets.map((s) => (
            <div className="char-card" key={s.memberId}>
              {partyId && (
                <DeleteMemberButton partyId={partyId} memberId={s.memberId} name={s.name} />
              )}
              <div style={{ fontSize: 34 }}>{s.classEmoji}</div>
              <div className="class-line">
                {s.name} · {s.className}
              </div>
              <div className="tagline">{s.classTagline}</div>
              <div>
                <span className="badge badge-gold">
                  {ELEMENT_META[s.dayElement].emoji} {s.dayElement}의 기운
                </span>
                <span className="badge">일주 {pillarLabel(s.pillars.day)}</span>
                {s.mbtiStyle && (
                  <span className="badge">
                    🎮 {s.mbti} · {s.mbtiStyle.name}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
                <Radar stats={s.stats} />
              </div>
              <p className="small muted">{s.classDesc}</p>
              {s.weakElements.length > 0 && (
                <p className="small" style={{ marginTop: 8, color: "var(--muted)" }}>
                  부족한 기운:{" "}
                  {s.weakElements
                    .map((e) => `${ELEMENT_META[e].emoji} ${e}(${ELEMENT_META[e].stat})`)
                    .join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {analysis && (
        <>
          {/* 파티 밸런스 */}
          <div className="panel">
            <h2>파티 밸런스</h2>
            <div className="panel-inner" style={{ marginBottom: 14 }}>
              <p style={{ marginBottom: 4 }}>
                <b className="pixel" style={{ color: "var(--gold)" }}>
                  {analysis.partyTypeName}
                </b>
              </p>
              <p className="small muted">{analysis.partyTypeDesc}</p>
            </div>
            {ELEMENTS.map((e) => (
              <div className="stat-row" key={e}>
                <span className="stat-label">
                  {ELEMENT_META[e].emoji} {e} · {ELEMENT_META[e].stat}
                </span>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${(analysis.elementTotals[e] / maxTotal) * 100}%`,
                      background: ELEMENT_META[e].color,
                    }}
                  />
                </div>
                <span className="stat-num">{analysis.elementTotals[e]}</span>
              </div>
            ))}
            {analysis.recruits.map((r) => (
              <div className="recruit" key={r.element}>
                <div className="title">{r.title}</div>
                <div className="small muted">{r.desc}</div>
              </div>
            ))}
          </div>

          {/* 시너지 그래프 */}
          <div className="panel">
            <h2>시너지 지도</h2>
            <PartyGraph sheets={sheets} synergies={synergies} />
          </div>

          {/* 케미 랭킹 */}
          <div className="panel">
            <h2>케미 랭킹 · 전체 {synergies.length}쌍</h2>
            <p className="muted small" style={{ marginBottom: 12 }}>
              페어를 누르면 직업 상성과 협업 팁이 나와요.
            </p>
            {synergies.map((syn, i) => (
              <details className="pair" key={`${syn.aId}-${syn.bId}`} open={i === 0}>
                <summary>
                  <span className={`grade grade-${syn.grade}`}>{syn.grade}</span>
                  <span style={{ flex: 1 }}>
                    <b>
                      {syn.aName} × {syn.bName}
                    </b>
                    <span className="muted small" style={{ display: "block" }}>
                      {syn.typeEmoji} {syn.type} · {syn.headline}
                    </span>
                  </span>
                  <span className="pixel" style={{ color: "var(--gold)" }}>
                    {syn.score}
                  </span>
                </summary>
                <div className="body">
                  <p>{syn.detail}</p>
                  <div className="tipbox info">
                    {syn.roleAtoB.emoji} <b>{syn.aName}에게 {syn.bName}은(는)</b> — {syn.roleAtoB.sipseong} ·{" "}
                    <b>{syn.roleAtoB.title}</b>. {syn.roleAtoB.desc}
                  </div>
                  <div className="tipbox info">
                    {syn.roleBtoA.emoji} <b>{syn.bName}에게 {syn.aName}은(는)</b> — {syn.roleBtoA.sipseong} ·{" "}
                    <b>{syn.roleBtoA.title}</b>. {syn.roleBtoA.desc}
                  </div>
                  {syn.direction && <div className="tipbox info">🧭 {syn.direction}</div>}
                  <div className="tipbox">💡 <b>협업 팁</b> — {syn.tip}</div>
                  <div className="tipbox warn">⚠️ <b>주의</b> — {syn.caution}</div>
                  {syn.mbtiNote && <div className="tipbox info">🎮 {syn.mbtiNote}</div>}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </>
  );
}
