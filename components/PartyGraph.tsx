import type { CharacterSheet, PairSynergy, SynergyType } from "@/lib/types";
import { ELEMENT_META } from "@/lib/content";

const EDGE_COLOR: Record<SynergyType, string> = {
  "운명의 콤보": "#ffd700",
  "서포트 버프": "#4ade80",
  "쌍둥이 시너지": "#60a5fa",
  "단련 관계": "#f87171",
  중립: "#4a5580",
};

/** 시너지 네트워크 그래프 (서버 렌더 SVG) */
export default function PartyGraph({
  sheets,
  synergies,
}: {
  sheets: CharacterSheet[];
  synergies: PairSynergy[];
}) {
  const W = 420;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2 - 8;
  const r = Math.min(W, H) / 2 - 58;

  const pos = new Map<string, [number, number]>();
  sheets.forEach((s, i) => {
    const angle = (Math.PI * 2 * i) / sheets.length - Math.PI / 2;
    pos.set(s.memberId, [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ maxWidth: 520, display: "block", margin: "0 auto" }}>
        {synergies.map((syn) => {
          const a = pos.get(syn.aId);
          const b = pos.get(syn.bId);
          if (!a || !b) return null;
          const width = 1 + Math.max(0, (syn.score - 50) / 14);
          return (
            <g key={`${syn.aId}-${syn.bId}`}>
              <line
                x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
                stroke={EDGE_COLOR[syn.type]}
                strokeWidth={width}
                strokeDasharray={syn.type === "단련 관계" ? "5,4" : undefined}
                opacity={0.85}
              />
              <text
                x={(a[0] + b[0]) / 2}
                y={(a[1] + b[1]) / 2 - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#8f9ac4"
              >
                {syn.score}
              </text>
            </g>
          );
        })}
        {sheets.map((s) => {
          const p = pos.get(s.memberId)!;
          const color = ELEMENT_META[s.dayElement].color;
          return (
            <g key={s.memberId}>
              <circle cx={p[0]} cy={p[1]} r={22} fill="#151d3b" stroke={color} strokeWidth={2.5} />
              <text x={p[0]} y={p[1] + 1} textAnchor="middle" dominantBaseline="middle" fontSize={15}>
                {s.classEmoji}
              </text>
              <text x={p[0]} y={p[1] + 36} textAnchor="middle" fontSize={12} fill="#e6e9f5">
                {s.name}
              </text>
              <text x={p[0]} y={p[1] + 50} textAnchor="middle" fontSize={10} fill="#8f9ac4">
                {ELEMENT_META[s.dayElement].emoji} {s.dayElement}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="small muted" style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ color: "#ffd700" }}>━ 운명의 콤보</span>{" · "}
        <span style={{ color: "#4ade80" }}>━ 서포트 버프</span>{" · "}
        <span style={{ color: "#60a5fa" }}>━ 쌍둥이</span>{" · "}
        <span style={{ color: "#f87171" }}>┅ 단련</span>{" · "}
        <span style={{ color: "#8f9ac4" }}>━ 중립</span>
      </div>
    </div>
  );
}
