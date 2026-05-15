import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/session";
import { ensureReady } from "@/lib/db";
import { ProfileActions } from "./ProfileActions";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("setoku-session")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) redirect("/login");

  const db = await ensureReady();
  const result = await db.execute({
    sql: "SELECT id, title, description, created_at, updated_at FROM puzzle WHERE user_id = ? ORDER BY updated_at DESC",
    args: [user.id],
  });

  type PuzzleRow = { id: number; title: string; description: string; created_at: string; updated_at: string };
  const puzzles = result.rows as unknown as PuzzleRow[];

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>// {user.username}</h1>
        <Link href="/build" className="button-link primary">
          + New puzzle
        </Link>
      </div>
      {puzzles.length === 0 ? (
        <p className="page-empty">
          No puzzles yet. <Link href="/build">Create your first puzzle!</Link>
        </p>
      ) : (
        <div className="puzzle-list">
          {puzzles.map((p) => (
            <div key={p.id} className="puzzle-row">
              <div className="puzzle-row-info">
                <span className="puzzle-row-title">{p.title || "Untitled"}</span>
                <span className="puzzle-row-date">
                  {new Date(p.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="puzzle-row-actions">
                <Link href={`/play/${p.id}`} className="button-link">▶ Play</Link>
                <Link href={`/build/${p.id}`} className="button-link">✎ Edit</Link>
                <ProfileActions puzzleId={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
