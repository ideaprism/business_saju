import { ImageResponse } from "next/og";
import { buildPartyView } from "@/lib/engine";
import { getPartyByShareSlug } from "@/lib/store";
import { ELEMENT_META } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "파티업 원정대 도감";

const FONT_CDN = "https://cdn.jsdelivr.net/npm/galmuri@2.40.3/dist";

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

async function loadFonts() {
  if (!fontCache) {
    const [regular, bold] = await Promise.all([
      fetch(`${FONT_CDN}/Galmuri11.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${FONT_CDN}/Galmuri11-Bold.ttf`).then((r) => r.arrayBuffer()),
    ]);
    fontCache = { regular, bold };
  }
  return fontCache;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const party = await getPartyByShareSlug(slug);
  const { regular, bold } = await loadFonts();
  const view = party ? buildPartyView(party) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0b1020 0%, #1a2350 60%, #251a45 100%)",
          color: "#e6e9f5",
          fontFamily: "Galmuri",
          padding: 60,
        }}
      >
        <div style={{ fontSize: 30, color: "#f5c542", marginBottom: 18 }}>
          ⚔️ PARTY UP · 원정대 도감
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {party ? party.name : "원정대를 찾을 수 없어요"}
        </div>
        {view?.analysis && (
          <div style={{ fontSize: 34, color: "#f5c542", marginBottom: 34 }}>
            {`${view.analysis.partyTypeName} · 평균 케미 ${view.analysis.avgScore}점`}
          </div>
        )}
        {view && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 14,
              maxWidth: 1000,
            }}
          >
            {view.sheets.slice(0, 8).map((s) => (
              <div
                key={s.memberId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#151d3b",
                  border: `3px solid ${ELEMENT_META[s.dayElement].color}`,
                  borderRadius: 16,
                  padding: "12px 22px",
                  fontSize: 26,
                }}
              >
                <span>{s.classEmoji}</span>
                <span>{`${s.name} · ${s.className}`}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 22, color: "#8f9ac4", marginTop: 40 }}>
          생년월일만으로 보는 우리 팀 클래스 · 스탯 · 시너지
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Galmuri", data: regular, weight: 400 },
        { name: "Galmuri", data: bold, weight: 700 },
      ],
    }
  );
}
