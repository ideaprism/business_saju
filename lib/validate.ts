import { validBirthDate, calcPillars } from "./saju";
import type { MemberInput } from "./store";

const MBTI_RE = /^[EI][NS][TF][JP]$/;

export function parseMemberInput(body: unknown): MemberInput {
  const b = body as Record<string, unknown>;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const birthDate = typeof b?.birthDate === "string" ? b.birthDate : "";
  const calendarType = b?.calendarType === "lunar" ? "lunar" : "solar";
  const mbtiRaw =
    typeof b?.mbti === "string" ? b.mbti.trim().toUpperCase() : "";

  if (!name) throw new Error("이름을 입력해주세요.");
  if (!validBirthDate(birthDate))
    throw new Error("생년월일이 올바르지 않아요. (1920~2025년, YYYY-MM-DD)");
  if (mbtiRaw && !MBTI_RE.test(mbtiRaw))
    throw new Error("MBTI 형식이 올바르지 않아요. (예: ENFP)");

  // 실제 만세력 계산이 되는 날짜인지 검증 (음력 30일 없는 달 등)
  try {
    calcPillars(birthDate, calendarType);
  } catch {
    throw new Error("달력에 없는 날짜예요. 날짜와 양력/음력 선택을 확인해주세요.");
  }

  return { name, birthDate, calendarType, mbti: mbtiRaw || undefined };
}

export function errorJson(e: unknown, status = 400) {
  const message = e instanceof Error ? e.message : "요청을 처리하지 못했어요.";
  return Response.json({ error: message }, { status });
}
