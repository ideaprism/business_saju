import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "파티업 — 우리 팀 원정대 진단",
  description:
    "팀원들의 생년월일로 우리 팀을 RPG 원정대로 진단해보세요. 클래스, 스탯, 시너지 버프까지.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
