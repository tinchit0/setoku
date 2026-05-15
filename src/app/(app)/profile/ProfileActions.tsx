"use client";

import { useRouter } from "next/navigation";
import { api } from "@/api/client";

export function ProfileActions({ puzzleId }: { puzzleId: number }) {
  const router = useRouter();

  const onDelete = async () => {
    if (!confirm("Delete this puzzle?")) return;
    await api.remove(puzzleId);
    router.refresh();
  };

  return (
    <button className="danger" onClick={onDelete} style={{ fontSize: 11, padding: "4px 10px" }}>
      Delete
    </button>
  );
}
