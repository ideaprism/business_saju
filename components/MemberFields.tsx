export default function MemberFields({ nameLabel = "이름 (닉네임)" }: { nameLabel?: string }) {
  return (
    <>
      <div className="field">
        <label>{nameLabel}</label>
        <input name="name" placeholder="예: 김프로" required maxLength={20} />
      </div>
      <div className="row">
        <div className="field">
          <label>생년월일</label>
          <input name="birthDate" type="date" min="1920-01-01" max="2025-12-31" required />
        </div>
        <div className="field">
          <label>달력</label>
          <select name="calendarType" defaultValue="solar">
            <option value="solar">양력</option>
            <option value="lunar">음력 (평달)</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>MBTI (선택 — 전투 스타일 보정)</label>
        <input name="mbti" placeholder="예: ENFP" maxLength={4} pattern="[EIeiNSnsTFtfJPjp]{4}" />
      </div>
    </>
  );
}
