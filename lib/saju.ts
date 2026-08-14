import { Solar, Lunar } from "lunar-javascript";
import type { CalendarType, Element, Pillars, PillarInfo } from "./types";

export const GAN_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

export const ZHI_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

export const GAN_ELEMENT: Record<string, Element> = {
  甲: "목", 乙: "목", 丙: "화", 丁: "화", 戊: "토",
  己: "토", 庚: "금", 辛: "금", 壬: "수", 癸: "수",
};

// 지지 본기 오행
export const ZHI_ELEMENT: Record<string, Element> = {
  子: "수", 丑: "토", 寅: "목", 卯: "목", 辰: "토", 巳: "화",
  午: "화", 未: "토", 申: "금", 酉: "금", 戌: "토", 亥: "수",
};

// 상생: A가 B를 생함 (목생화, 화생토, 토생금, 금생수, 수생목)
export const GENERATES: Record<Element, Element> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};

// 상극: A가 B를 극함 (목극토, 토극수, 수극화, 화극금, 금극목)
export const CONTROLS: Record<Element, Element> = {
  목: "토", 토: "수", 수: "화", 화: "금", 금: "목",
};

// 천간합 5종 (일간 기준)
export const GAN_HE: [string, string][] = [
  ["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"],
];

export function isGanHe(a: string, b: string): boolean {
  return GAN_HE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

// 천간 음양 (甲丙戊庚壬 = 양)
const YANG_GAN = new Set(["甲", "丙", "戊", "庚", "壬"]);

export type Sipseong =
  | "비견" | "겁재" | "식신" | "상관" | "편재"
  | "정재" | "편관" | "정관" | "편인" | "정인";

/**
 * 십성: selfGan(나의 일간) 기준으로 otherGan(상대 일간)이 어떤 별인지.
 * 같은 음양 → 편(偏) 계열, 다른 음양 → 정(正) 계열.
 */
export function calcSipseong(selfGan: string, otherGan: string): Sipseong {
  const selfEl = GAN_ELEMENT[selfGan];
  const otherEl = GAN_ELEMENT[otherGan];
  const samePolarity = YANG_GAN.has(selfGan) === YANG_GAN.has(otherGan);

  if (selfEl === otherEl) return samePolarity ? "비견" : "겁재";
  if (GENERATES[selfEl] === otherEl) return samePolarity ? "식신" : "상관";
  if (CONTROLS[selfEl] === otherEl) return samePolarity ? "편재" : "정재";
  if (CONTROLS[otherEl] === selfEl) return samePolarity ? "편관" : "정관";
  return samePolarity ? "편인" : "정인"; // otherEl generates selfEl
}

function toPillarInfo(gan: string, zhi: string): PillarInfo {
  return {
    gan,
    zhi,
    ganKo: GAN_KO[gan],
    zhiKo: ZHI_KO[zhi],
    ganElement: GAN_ELEMENT[gan],
    zhiElement: ZHI_ELEMENT[zhi],
  };
}

/**
 * 생년월일 → 년주·월주·일주 (시주 미사용).
 * 월주는 절기(節氣) 기준, 년주는 입춘 기준 — lunar-javascript EightChar가 처리.
 * 음력 입력은 평달 기준(윤달 미지원, MVP 허용 오차).
 */
export function calcPillars(birthDate: string, calendarType: CalendarType): Pillars {
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) throw new Error("INVALID_DATE");

  let lunar;
  if (calendarType === "lunar") {
    lunar = Lunar.fromYmd(y, m, d);
  } else {
    lunar = Solar.fromYmd(y, m, d).getLunar();
  }
  const ec = lunar.getEightChar();

  return {
    year: toPillarInfo(ec.getYearGan(), ec.getYearZhi()),
    month: toPillarInfo(ec.getMonthGan(), ec.getMonthZhi()),
    day: toPillarInfo(ec.getDayGan(), ec.getDayZhi()),
    dayGan: ec.getDayGan(),
  };
}

/** 3주 6글자의 오행 분포 (0~6) */
export function countElements(p: Pillars): Record<Element, number> {
  const counts: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const pillar of [p.year, p.month, p.day]) {
    counts[pillar.ganElement]++;
    counts[pillar.zhiElement]++;
  }
  return counts;
}

export function validBirthDate(birthDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (y < 1920 || y > 2025) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  return true;
}
