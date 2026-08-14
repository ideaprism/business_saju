import { addMember, getPartyByInviteToken } from "@/lib/store";
import { errorJson, parseMemberInput } from "@/lib/validate";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { token } = await params;
  const party = await getPartyByInviteToken(token);
  if (!party) return errorJson(new Error("초대장을 찾을 수 없어요."), 404);
  try {
    const input = parseMemberInput(await req.json());
    await addMember(party.id, input);
    return Response.json({ partyId: party.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "PARTY_FULL")
      return errorJson(new Error("파티 정원(8명)이 가득 찼어요."), 409);
    return errorJson(e);
  }
}
