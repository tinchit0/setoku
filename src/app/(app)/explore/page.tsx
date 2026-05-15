import Link from "next/link";
import { ensureReady } from "@/lib/db";

type PuzzleRow = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: number | null;
  creator_username: string | null;
};

export default async function ExplorePage() {
  const db = await ensureReady();
  const result = await db.execute(`
    SELECT
      p.id,
      p.title,
      p.description,
      p.created_at,
      p.updated_at,
      p.user_id,
      u.username AS creator_username
    FROM puzzle p
    LEFT JOIN user u ON u.id = p.user_id
    ORDER BY p.updated_at DESC
  `);

  const puzzles = result.rows as unknown as PuzzleRow[];

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>// explore</h1>
        <Link href="/build" className="button-link primary">
          + New puzzle
        </Link>
      </div>
      {puzzles.length === 0 ? (
        <p className="page-empty">No puzzles yet. <Link href="/build">Create the first one!</Link></p>
      ) : (
        <div className="puzzle-grid">
          {puzzles.map((p) => (
            <div key={p.id} className="puzzle-card">
              <div className="puzzle-card-title">{p.title || "Untitled"}</div>
              <div className="puzzle-card-meta">
                <span>{p.creator_username ?? "unknown"}</span>
                <span>{new Date(p.updated_at).toLocaleDateString()}</span>
              </div>
              {p.description && (
                <p className="puzzle-card-desc">{p.description}</p>
              )}
              <div className="puzzle-card-actions">
                <Link href={`/play/${p.id}`} className="button-link">
                  ▶ Play
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
