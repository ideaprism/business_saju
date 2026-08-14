"use client";

import { useRouter } from "next/navigation";

export default function DeleteMemberButton({
  partyId,
  memberId,
  name,
}: {
  partyId: string;
  memberId: string;
  name: string;
}) {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ position: "absolute", top: 12, right: 12 }}
      title={`${name} 내보내기`}
      onClick={async () => {
        if (!confirm(`${name}님을 파티에서 내보낼까요? 입력한 정보는 삭제됩니다.`)) return;
        await fetch(`/api/parties/${partyId}/members/${memberId}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      ✕
    </button>
  );
}
