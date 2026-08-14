export type CalendarType = "solar" | "lunar";

export type Element = "목" | "화" | "토" | "금" | "수";

export interface Member {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  calendarType: CalendarType;
  mbti?: string;
  createdAt: string;
}

export interface PartyReport {
  text: string;
  membersKey: string; // 멤버 구성 해시 — 구성이 바뀌면 리포트 무효화
  createdAt: string;
}

export interface Party {
  id: string;
  name: string;
  inviteToken: string;
  shareSlug: string;
  createdAt: string;
  members: Member[];
  report?: PartyReport;
}

export interface Pillars {
  year: PillarInfo;
  month: PillarInfo;
  day: PillarInfo;
  dayGan: string; // 한자 일간 (甲...)
}

export interface PillarInfo {
  gan: string; // 한자
  zhi: string; // 한자
  ganKo: string;
  zhiKo: string;
  ganElement: Element;
  zhiElement: Element;
}

export interface CharacterSheet {
  memberId: string;
  name: string;
  mbti?: string;
  mbtiStyle?: { name: string; desc: string };
  pillars: Pillars;
  className: string;
  classEmoji: string;
  classTagline: string;
  classDesc: string;
  dayElement: Element;
  stats: Record<Element, number>; // 0~6
  strongElement: Element;
  weakElements: Element[]; // count 0
}

export type SynergyType =
  | "운명의 콤보"
  | "서포트 버프"
  | "쌍둥이 시너지"
  | "단련 관계"
  | "중립";

export interface PairSynergy {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  score: number; // 0~100
  grade: "SSS" | "S" | "A" | "B" | "C";
  type: SynergyType;
  typeEmoji: string;
  headline: string; // 관계 한 줄
  detail: string; // 관계 설명
  tip: string; // 협업 팁
  caution: string; // 주의점
  direction?: string; // 서포트 버프 방향 설명
  mbtiNote?: string;
  mbtiAdjust?: number;
  // 십성 직업 상성 (방향 있음)
  roleAtoB: SipseongRole; // A에게 B는 ○○
  roleBtoA: SipseongRole; // B에게 A는 ○○
}

export interface SipseongRole {
  sipseong: string; // 편관 등
  title: string; // 스파르타 감독 등
  emoji: string;
  desc: string;
}

export interface PartyAnalysis {
  elementTotals: Record<Element, number>;
  strongElement: Element;
  weakElement: Element;
  missingElements: Element[];
  partyTypeName: string;
  partyTypeDesc: string;
  recruits: { element: Element; title: string; desc: string }[];
  topPairs: PairSynergy[];
  avgScore: number;
}

export interface PartyView {
  party: Party;
  sheets: CharacterSheet[];
  synergies: PairSynergy[];
  analysis: PartyAnalysis | null; // 멤버 2명 미만이면 null
  report: { text: string; createdAt: string } | null; // 현재 멤버 구성과 일치하는 리포트만
}
