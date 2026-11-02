import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { currentUser, usedBytes, newFileId, TTLS } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const ttl = (form.get("ttl") as string) || "24h";
  if (!file || !TTLS[ttl]) return NextResponse.json({ error: "file + valid ttl required" }, { status: 400 });
  if ((await usedBytes(user.id)) + file.size > Number(user.quota)) return NextResponse.json({ error: "Quota exceeded" }, { status: 413 });
  const blob = await put(file.name, file, { access: "public", addRandomSuffix: true });
  const id = newFileId();
  await db.file.create({ data: { id, name: file.name, url: blob.url, pathname: blob.pathname, size: file.size,
    mime: file.type || "application/octet-stream", userId: user.id, expiresAt: new Date(Date.now() + TTLS[ttl]) } });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  return NextResponse.json({ url: `${base}/dl/${id}`, print: `${base}/print/${id}` });
}
