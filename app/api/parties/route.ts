import { createParty } from "@/lib/store";
import { errorJson, parseMemberInput } from "@/lib/validate";

export async function POST(req: Request) {
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
