import { removeMember } from "@/lib/store";
import { errorJson } from "@/lib/validate";

type Ctx = { params: Promise<{ partyId: string; memberId: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { partyId, memberId } = await params;
  try {
    await removeMember(partyId, memberId);
    return Response.json({ deleted: true });
  } catch {
    return errorJson(new Error("파티를 찾을 수 없어요."), 404);
  }
}
