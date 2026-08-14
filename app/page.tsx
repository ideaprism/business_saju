import CreatePartyForm from "@/components/CreatePartyForm";
import Disclaimer from "@/components/Disclaimer";

export default function Home() {
  return (
    <main>
      <div className="hero">
        <div className="pixel" style={{ fontSize: 15, color: "var(--gold)", marginBottom: 8 }}>
          ⚔️ PARTY UP ⚔️
        </div>
        <h1>우리 팀, 원정대로 진단해보기</h1>
        <p>
          팀원들의 생년월일만 있으면 됩니다. 사주 오행을 게임 문법으로 번역해서 —
          각자의 <b>클래스</b>와 <b>스탯</b>, 팀원끼리의 <b>시너지 버프</b>, 그리고 우리 파티에
          <b> 비어 있는 포지션</b>까지 보여드려요.
        </p>
        <p className="small">출생 시간은 안 물어봐요. MBTI를 넣으면 전투 스타일 보정이 붙습니다.</p>
      </div>

      <div className="panel">
        <h2>파티 결성</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          리더가 먼저 등록하면 초대 링크가 생겨요. 팀원들은 링크에서 각자 자기 생일을 입력합니다.
        </p>
        <CreatePartyForm />
      </div>

      <div className="panel">
        <h2>이렇게 나와요</h2>
        <div className="panel-inner small" style={{ lineHeight: 2 }}>
          🛡️ <b>캐릭터 시트</b> — 일간(日干)으로 정해지는 클래스 10종과 오행 스탯 오각형
          <br />
          ⚡ <b>페어 시너지</b> — 두 사람씩 전부 짝지어 버프/단련 관계와 협업 팁 제공
          <br />
          🏕️ <b>파티 진단</b> — 팀 전체 기운 밸런스, 파티 유형, 빈 포지션 모집 공고
        </div>
      </div>

      <Disclaimer />
    </main>
  );
}
