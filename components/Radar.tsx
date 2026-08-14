import type { Element } from "@/lib/types";
import { ELEMENT_META, ELEMENTS } from "@/lib/content";

/** 오행 스탯 오각형 레이더 (서버 렌더 SVG) */
export default function Radar({ stats, size = 190 }: { stats: Record<Element, number>; size?: number }) {
  const cx = size / 2;
  const cy = size / 2 + 4;
  const r = size / 2 - 34;
  const maxVal = Math.max(3, ...ELEMENTS.map((e) => stats[e]));

  const point = (i: number, ratio: number): [number, number] => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [cx + Math.cos(angle) * r * ratio, cy + Math.sin(angle) * r * ratio];
  };

  const ring = (ratio: number) =>
    ELEMENTS.map((_, i) => point(i, ratio).join(",")).join(" ");

  const valuePoly = ELEMENTS.map((e, i) =>
    point(i, Math.max(stats[e] / maxVal, 0.06)).join(",")
  ).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="오행 스탯">
      {[1 / 3, 2 / 3, 1].map((ratio) => (
        <polygon key={ratio} points={ring(ratio)} fill="none" stroke="#2b3768" strokeWidth={1} />
      ))}
      {ELEMENTS.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#2b3768" strokeWidth={1} />;
      })}
      <polygon points={valuePoly} fill="#f5c54233" stroke="#f5c542" strokeWidth={2} />
      {ELEMENTS.map((e, i) => {
        const [x, y] = point(i, 1.24);
        return (
          <text
            key={e}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill="#8f9ac4"
          >
            {ELEMENT_META[e].emoji} {ELEMENT_META[e].stat} {stats[e]}
          </text>
        );
      })}
    </svg>
  );
}
