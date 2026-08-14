import { buildPartyView } from "@/lib/engine";
import { deleteParty, getParty } from "@/lib/store";
import { errorJson } from "@/lib/validate";

type Ctx = { params: Promise<{ partyId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { partyId } = await params;
  const party = await getParty(partyId);
  if (!party) return errorJson(new Error("파티를 찾을 수 없어요."), 404);
  return Response.json(buildPartyView(party));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { partyId } = await params;
  const ok = await deleteParty(partyId);
  if (!ok) return errorJson(new Error("파티를 찾을 수 없어요."), 404);
  return Response.json({ deleted: true });
}
