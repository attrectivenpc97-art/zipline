import { NextResponse } from "next/server";
import { head, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { currentUser, usedBytes, newFileId, TTLS } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const files = await db.file.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    files: files.map((f) => ({ id: f.id, name: f.name, size: f.size, createdAt: f.createdAt, expiresAt: f.expiresAt, downloadCount: f.downloadCount, maxViews: f.maxViews })),
    used: await usedBytes(user.id), quota: Number(user.quota), apiToken: user.apiToken,
  });
}

// Register a finished direct upload. Size is read from Blob, never trusted from the client.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { url, name, ttl, maxViews } = await req.json();
  if (!TTLS[ttl]) return NextResponse.json({ error: "Bad ttl" }, { status: 400 });
  const meta = await head(url);
  if ((await usedBytes(user.id)) + meta.size > Number(user.quota)) {
    await del(url); return NextResponse.json({ error: "Quota exceeded" }, { status: 413 });
  }
  const f = await db.file.create({ data: {
    id: newFileId(), name, url, pathname: meta.pathname, size: meta.size, mime: meta.contentType,
    userId: user.id, expiresAt: new Date(Date.now() + TTLS[ttl]), maxViews: maxViews || null } });
  return NextResponse.json({ id: f.id });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const f = await db.file.findFirst({ where: { id, userId: user.id } });
  if (f) { await del(f.url); await db.file.delete({ where: { id } }); }
  return NextResponse.json({ ok: true });
}
