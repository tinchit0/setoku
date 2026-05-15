import { notFound } from "next/navigation";
import { ensureReady } from "@/lib/db";
import BuilderClient from "../BuilderClient";
import type { Constraint } from "@/types/constraints";

export default async function BuildEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const db = await ensureReady();
  const result = await db.execute({ sql: "SELECT * FROM puzzle WHERE id = ?", args: [numId] });
  const row = result.rows[0];
  if (!row) notFound();

  const data = JSON.parse(row.data as string) as { constraints?: Constraint[] };

  return (
    <BuilderClient
      puzzleId={numId}
      initialTitle={row.title as string}
      initialConstraints={data.constraints ?? []}
    />
  );
}
