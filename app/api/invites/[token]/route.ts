import { getPartyByInviteToken, MAX_MEMBERS } from "@/lib/store";
import { errorJson } from "@/lib/validate";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const party = await getPartyByInviteToken(token);
  if (!party) return errorJson(new Error("초대장을 찾을 수 없어요."), 404);
  return Response.json({
    partyName: party.name,
    memberCount: party.members.length,
    maxMembers: MAX_MEMBERS,
    memberNames: party.members.map((m) => m.name),
  });
}
