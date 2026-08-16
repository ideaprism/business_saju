import Link from "next/link";
import JoinForm from "@/components/JoinForm";
import Disclaimer from "@/components/Disclaimer";
import { getPartyByInviteToken, MAX_MEMBERS } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const party = await getPartyByInviteToken(token);

  if (!party) {
    return (
      <main>
        <div className="panel" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: 10 }}>🗺️ 초대장을 찾을 수 없어요</h1>
          <p className="muted">링크가 만료되었거나 파티가 해산되었을 수 있어요.</p>
        </div>
      </main>
    );
  }

  const full = party.members.length >= MAX_MEMBERS;

  return (
    <main>
      <div className="hero">
        <div className="pixel" style={{ fontSize: 14, color: "var(--gold)", marginBottom: 8 }}>
          📜 원정대 초대장
        </div>
        <h1>{party.name}</h1>
        <p>
          현재 {party.members.length}명이 모였어요 —{" "}
          {party.members.map((m) => m.name).join(", ")}
        </p>
        <p className="small">
          생일을 입력하면 내 클래스가 정해지고, 파티원들과의 시너지가 계산됩니다.
        </p>
      </div>

      <div className="panel">
        <h2>합류하기</h2>
        {full ? (
          <p className="muted">파티 정원({MAX_MEMBERS}명)이 가득 찼어요.</p>
        ) : (
          <JoinForm token={token} />
        )}
      </div>

      {/* 파티 주소를 잃어버린 사람도 이 초대 링크로 결과를 다시 볼 수 있게 */}
      <div className="panel" style={{ textAlign: "center" }}>
        <h2 style={{ justifyContent: "center" }}>이미 합류하셨나요?</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          다시 입력할 필요 없어요. 이 초대 링크로 언제든 파티 결과를 볼 수 있습니다.
        </p>
        <Link
          href={`/party/${party.id}`}
          className="btn btn-ghost"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          🏕️ 원정대 결과 보기
        </Link>
      </div>

      <Disclaimer />
    </main>
  );
}
