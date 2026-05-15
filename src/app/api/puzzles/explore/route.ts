import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  return NextResponse.json(result.rows);
}
