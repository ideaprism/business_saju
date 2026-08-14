import { addMember } from "@/lib/store";
import { errorJson, parseMemberInput } from "@/lib/validate";

type Ctx = { params: Promise<{ partyId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { partyId } = await params;
  try {
    const input = parseMemberInput(await req.json());
    const party = await addMember(partyId, input);
    return Response.json(
      { partyId: party.id, memberCount: party.members.length },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Error && e.message === "PARTY_NOT_FOUND")
      return errorJson(new Error("파티를 찾을 수 없어요."), 404);
    if (e instanceof Error && e.message === "PARTY_FULL")
      return errorJson(new Error("파티 정원(8명)이 가득 찼어요."), 409);
    return errorJson(e);
  }
}
