import { notFound } from "next/navigation";
import { ensureReady } from "@/lib/db";
import PlayClient from "./PlayClient";
import type { Constraint } from "@/types/constraints";

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const db = await ensureReady();
  const result = await db.execute({ sql: "SELECT * FROM puzzle WHERE id = ?", args: [numId] });
  const row = result.rows[0];
  if (!row) notFound();

  const data = JSON.parse(row.data as string) as { constraints?: Constraint[] };

  return (
    <PlayClient
      puzzleId={numId}
      puzzleTitle={row.title as string}
      constraints={data.constraints ?? []}
    />
  );
}
