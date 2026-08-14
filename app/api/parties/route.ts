import { createParty, storageDurable } from "@/lib/store";
import { errorJson, parseMemberInput } from "@/lib/validate";

export async function POST(req: Request) {
  if (!storageDurable) {
    return errorJson(
      new Error(
        "저장소가 연결되지 않아 파티를 만들 수 없어요. 잠시 후 다시 시도해주세요. (운영자: Vercel 프로젝트에 Blob 또는 DB 연결 필요)"
      ),
      503
    );
  }
  try {
    const body = await req.json();
    const partyName =
      typeof body?.partyName === "string" ? body.partyName.trim() : "";
    if (!partyName) throw new Error("파티 이름을 입력해주세요.");
    const leader = parseMemberInput(body.leader);
    const party = await createParty(partyName, leader);
    return Response.json(
      { partyId: party.id, inviteToken: party.inviteToken },
      { status: 201 }
    );
  } catch (e) {
    return errorJson(e);
  }
}
