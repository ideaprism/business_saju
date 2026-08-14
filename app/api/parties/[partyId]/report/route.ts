import Anthropic from "@anthropic-ai/sdk";
import { buildPartyView, membersKey } from "@/lib/engine";
import { getParty, saveReport } from "@/lib/store";
import { errorJson } from "@/lib/validate";
import type { PartyView } from "@/lib/types";

export const maxDuration = 60;

type Ctx = { params: Promise<{ partyId: string }> };

function reportPrompt(view: PartyView): string {
  const { party, sheets, synergies, analysis } = view;
  const lines: string[] = [];
  lines.push(`파티명: ${party.name}`);
  lines.push(`\n[파티원 ${sheets.length}명]`);
  for (const s of sheets) {
    lines.push(
      `- ${s.name}: ${s.className}(일간 ${s.pillars.day.ganKo}, ${s.dayElement} 기운), ` +
        `스탯(추진${s.stats.목}/열정${s.stats.화}/안정${s.stats.토}/결단${s.stats.금}/통찰${s.stats.수})` +
        (s.mbti ? `, MBTI ${s.mbti}(${s.mbtiStyle?.name})` : "")
    );
  }
  if (analysis) {
    lines.push(`\n[파티 진단]`);
    lines.push(`- 파티 유형: ${analysis.partyTypeName} — ${analysis.partyTypeDesc}`);
    lines.push(
      `- 오행 합계: 목${analysis.elementTotals.목} 화${analysis.elementTotals.화} 토${analysis.elementTotals.토} 금${analysis.elementTotals.금} 수${analysis.elementTotals.수}`
    );
    if (analysis.missingElements.length)
      lines.push(`- 빈 포지션: ${analysis.missingElements.join(", ")}`);
    lines.push(`- 평균 케미: ${analysis.avgScore}점`);
  }
  lines.push(`\n[페어 시너지 (점수순)]`);
  for (const syn of synergies) {
    lines.push(
      `- ${syn.aName}×${syn.bName}: ${syn.score}점, ${syn.type}, ${syn.headline} / ` +
        `${syn.aName}에게 ${syn.bName}은 ${syn.roleAtoB.sipseong}(${syn.roleAtoB.title}), ` +
        `${syn.bName}에게 ${syn.aName}은 ${syn.roleBtoA.sipseong}(${syn.roleBtoA.title})`
    );
  }
  return lines.join("\n");
}

const SYSTEM = `너는 RPG 세계관의 "파티 도감 작가"다. 사주 오행을 게임 문법(클래스, 스탯, 버프)으로 번역한 팀빌딩 서비스의 종합 리포트를 쓴다.

원칙:
- 재미있는 팀빌딩 콘텐츠다. 채용·평가 언어를 쓰지 말고, 특정인을 깎아내리지 않는다. 약점은 반드시 성장 서사나 보완 조합으로 감싼다.
- 제공된 데이터(클래스, 스탯, 시너지, 십성)를 근거로 쓰되, 데이터에 없는 사실을 지어내지 않는다.
- 어미는 "~예요/해요"체. 게임 용어와 오행 비유를 섞되 과하지 않게.

출력 형식 (마크다운 기호 없이 순수 텍스트, 총 500~800자):
⚔️ [파티 한 줄 소개] — 이 파티를 한 문장으로
🗺️ [원정 전략] — 이 팀이 가장 강한 싸움의 방식, 역할 배치 제안 (2~3문장)
✨ [키 콤보] — 가장 주목할 페어 1~2개와 활용법 (2~3문장)
🧯 [파티의 불씨] — 조심할 관계나 빈 포지션과 대처법 (2~3문장)
🏆 [출정의 한마디] — 응원으로 마무리 (1문장)`;

export async function POST(_req: Request, { params }: Ctx) {
  const { partyId } = await params;
  const party = await getParty(partyId);
  if (!party) return errorJson(new Error("파티를 찾을 수 없어요."), 404);
  if (party.members.length < 2)
    return errorJson(new Error("파티원이 2명 이상이어야 리포트를 만들 수 있어요."));

  const key = membersKey(party);
  if (party.report && party.report.membersKey === key) {
    return Response.json({
      report: { text: party.report.text, createdAt: party.report.createdAt },
      cached: true,
    });
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return errorJson(
      new Error("AI 리포트 기능이 아직 설정되지 않았어요. (ANTHROPIC_API_KEY 필요)"),
      503
    );
  }

  const view = buildPartyView(party);
  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `다음 파티의 도감 리포트를 작성해줘.\n\n${reportPrompt(view)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return errorJson(new Error("리포트를 생성할 수 없는 요청이에요."), 422);
    }

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text) throw new Error("EMPTY_REPORT");

    const report = { text, membersKey: key, createdAt: new Date().toISOString() };
    await saveReport(partyId, report);
    return Response.json({
      report: { text, createdAt: report.createdAt },
      cached: false,
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return errorJson(new Error("AI 서버가 붐비고 있어요. 잠시 후 다시 시도해주세요."), 502);
    }
    return errorJson(new Error("리포트 생성에 실패했어요. 다시 시도해주세요."), 500);
  }
}
