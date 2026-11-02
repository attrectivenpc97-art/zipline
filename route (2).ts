import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dead = await db.file.findMany({ where: { expiresAt: { lte: new Date() } }, take: 500 });
  if (dead.length) {
    await del(dead.map((f) => f.url)).catch(() => {});
    await db.file.deleteMany({ where: { id: { in: dead.map((f) => f.id) } } });
  }
  return NextResponse.json({ purged: dead.length });
}
