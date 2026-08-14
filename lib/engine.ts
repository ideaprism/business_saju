import type {
  CharacterSheet,
  Element,
  Member,
  PairSynergy,
  Party,
  PartyAnalysis,
  PartyView,
  SynergyType,
} from "./types";
import {
  calcPillars,
  calcSipseong,
  countElements,
  CONTROLS,
  GENERATES,
  isGanHe,
} from "./saju";
import {
  CLASSES,
  CONTROL_TEXTS,
  ELEMENTS,
  GAN_HE_TEXTS,
  GENERATE_TEXTS,
  mbtiStyle,
  PARTY_TYPES,
  RECRUIT_TEXTS,
  SIPSEONG_ROLES,
  TWIN_TEXTS,
  TYPE_TIPS,
} from "./content";

function sipseongRole(selfGan: string, otherGan: string) {
  const s = calcSipseong(selfGan, otherGan);
  return { sipseong: s, ...SIPSEONG_ROLES[s] };
}

export function buildSheet(member: Member): CharacterSheet {
  const pillars = calcPillars(member.birthDate, member.calendarType);
  const cls = CLASSES[pillars.dayGan];
  const stats = countElements(pillars);
  const strongElement = ELEMENTS.reduce((a, b) => (stats[b] > stats[a] ? b : a));
  const weakElements = ELEMENTS.filter((e) => stats[e] === 0);

  return {
    memberId: member.id,
    name: member.name,
    mbti: member.mbti,
    mbtiStyle: member.mbti ? mbtiStyle(member.mbti) : undefined,
    pillars,
    className: cls.name,
    classEmoji: cls.emoji,
    classTagline: cls.tagline,
    classDesc: cls.desc,
    dayElement: pillars.day.ganElement,
    stats,
    strongElement,
    weakElements,
  };
}

function grade(score: number): PairSynergy["grade"] {
  if (score >= 90) return "SSS";
  if (score >= 80) return "S";
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  return "C";
}

function mbtiAdjust(a?: string, b?: string): { adjust: number; note?: string } {
  if (!a || !b) return { adjust: 0 };
  const A = a.toUpperCase();
  const B = b.toUpperCase();
  let adjust = 0;
  const notes: string[] = [];
  if (A[0] !== B[0]) {
    adjust += 3;
    notes.push("외향·내향 조합이라 에너지 균형이 좋아요");
  }
  if (A[1] === B[1]) {
    adjust += 4;
    notes.push("정보를 받아들이는 방식(N/S)이 같아 말이 잘 통해요");
  }
  if (A[2] !== B[2]) {
    adjust += 3;
    notes.push("판단 렌즈(T/F)가 달라 서로의 사각지대를 메워줘요");
  }
  if (A[3] === B[3]) {
    adjust += 4;
    notes.push("일하는 리듬(J/P)이 같아 마감 스트레스가 적어요");
  }
  const note =
    notes.length > 0
      ? `전투 스타일(MBTI) 보정 +${adjust} — ${notes.join(" · ")}`
      : "전투 스타일이 많이 달라 보정은 없지만, 서로의 방식을 낯설어할 수 있어요.";
  return { adjust, note };
}

export function buildSynergy(a: CharacterSheet, b: CharacterSheet): PairSynergy {
  const ea = a.dayElement;
  const eb = b.dayElement;
  const ganA = a.pillars.dayGan;
  const ganB = b.pillars.dayGan;

  let score = 60;
  let type: SynergyType = "중립";
  let headline = "다른 길을 걷는 두 모험가";
  let detail =
    "생·극·합이 얽히지 않은 담백한 관계입니다. 부딪힐 일도 적지만, 케미는 만들어가기 나름이에요.";
  let direction: string | undefined;

  if (isGanHe(ganA, ganB)) {
    // 천간합 — 운명의 콤보
    score += 20;
    type = "운명의 콤보";
    const key = ["甲己", "乙庚", "丙辛", "丁壬", "戊癸"].find(
      (k) => k.includes(ganA) && k.includes(ganB)
    )!;
    headline = GAN_HE_TEXTS[key].headline;
    detail = GAN_HE_TEXTS[key].detail;
  } else if (ea === eb) {
    score += 10;
    type = "쌍둥이 시너지";
    headline = TWIN_TEXTS[ea].headline;
    detail = TWIN_TEXTS[ea].detail;
  } else if (GENERATES[ea] === eb || GENERATES[eb] === ea) {
    // 상생 — 서포트 버프 (양방향 평균: (15+12)/2 ≈ 13)
    score += 13;
    type = "서포트 버프";
    const giver = GENERATES[ea] === eb ? a : b;
    const receiver = giver === a ? b : a;
    const key = `${giver.dayElement}${receiver.dayElement}`;
    headline = GENERATE_TEXTS[key].headline;
    detail = GENERATE_TEXTS[key].detail;
    direction = `${giver.name} → ${receiver.name} 방향으로 버프가 흐릅니다. ${giver.name}님의 기운이 ${receiver.name}님을 밀어줘요.`;
  } else if (CONTROLS[ea] === eb || CONTROLS[eb] === ea) {
    score -= 8;
    type = "단련 관계";
    const controller = CONTROLS[ea] === eb ? a : b;
    const controlled = controller === a ? b : a;
    const key = `${controller.dayElement}${controlled.dayElement}`;
    headline = CONTROL_TEXTS[key].headline;
    detail = CONTROL_TEXTS[key].detail;
    direction = `${controller.name}님 쪽이 칼자루를 쥔 형태라, ${controlled.name}님이 긴장을 더 느낄 수 있어요.`;
  }

  const { adjust, note } = mbtiAdjust(a.mbti, b.mbti);
  score = Math.max(0, Math.min(100, score + adjust));

  const tips = TYPE_TIPS[type];

  return {
    aId: a.memberId,
    bId: b.memberId,
    aName: a.name,
    bName: b.name,
    score,
    grade: grade(score),
    type,
    typeEmoji: tips.emoji,
    headline,
    detail,
    tip: tips.tip,
    caution: tips.caution,
    direction,
    mbtiNote: a.mbti && b.mbti ? note : undefined,
    mbtiAdjust: adjust || undefined,
    roleAtoB: sipseongRole(ganA, ganB),
    roleBtoA: sipseongRole(ganB, ganA),
  };
}

export function buildAnalysis(
  sheets: CharacterSheet[],
  synergies: PairSynergy[]
): PartyAnalysis {
  const totals: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const s of sheets) {
    for (const e of ELEMENTS) totals[e] += s.stats[e];
  }
  const strongElement = ELEMENTS.reduce((a, b) => (totals[b] > totals[a] ? b : a));
  const weakElement = ELEMENTS.reduce((a, b) => (totals[b] < totals[a] ? b : a));
  const missingElements = ELEMENTS.filter((e) => totals[e] === 0);
  const partyType = PARTY_TYPES[strongElement];

  const sorted = [...synergies].sort((x, y) => y.score - x.score);
  const avgScore =
    synergies.length > 0
      ? Math.round(synergies.reduce((sum, s) => sum + s.score, 0) / synergies.length)
      : 0;

  return {
    elementTotals: totals,
    strongElement,
    weakElement,
    missingElements,
    partyTypeName: partyType.name,
    partyTypeDesc: partyType.desc,
    recruits: missingElements.map((e) => ({ element: e, ...RECRUIT_TEXTS[e] })),
    topPairs: sorted.slice(0, 3),
    avgScore,
  };
}

/** 멤버 구성 식별자 — 구성이 바뀌면 리포트가 무효화되도록 */
export function membersKey(party: Party): string {
  return party.members
    .map((m) => `${m.id}:${m.birthDate}:${m.calendarType}:${m.mbti ?? ""}`)
    .sort()
    .join("|");
}

export function buildPartyView(party: Party): PartyView {
  const sheets = party.members.map(buildSheet);
  const synergies: PairSynergy[] = [];
  for (let i = 0; i < sheets.length; i++) {
    for (let j = i + 1; j < sheets.length; j++) {
      synergies.push(buildSynergy(sheets[i], sheets[j]));
    }
  }
  synergies.sort((a, b) => b.score - a.score);
  const analysis = sheets.length >= 2 ? buildAnalysis(sheets, synergies) : null;
  const report =
    party.report && party.report.membersKey === membersKey(party)
      ? { text: party.report.text, createdAt: party.report.createdAt }
      : null;
  return { party, sheets, synergies, analysis, report };
}
