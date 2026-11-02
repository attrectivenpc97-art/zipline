import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";

const gone = () => new NextResponse(
  `<!doctype html><meta name=viewport content="width=device-width"><body style="font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0a0a0a;color:#ededed"><div style="text-align:center"><h1 style="font-weight:500">Link expired</h1><p style="opacity:.6">This file self-destructed.</p></div>`,
  { status: 404, headers: { "content-type": "text/html" } });

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const f = await db.file.findUnique({ where: { id: params.id } });
  if (!f) return gone();
  if (Date.now() > f.expiresAt.getTime() || (f.maxViews && f.downloadCount >= f.maxViews)) {
    await del(f.url).catch(() => {}); await db.file.delete({ where: { id: f.id } }); return gone();
  }
  await db.file.update({ where: { id: f.id }, data: { downloadCount: { increment: 1 } } });
  return NextResponse.redirect(`${f.url}?download=1`, 302);
}
