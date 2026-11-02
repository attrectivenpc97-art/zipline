import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { startSession, newToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { action, email, password } = await req.json();
  if (action === "logout") { cookies().delete("session"); return NextResponse.json({ ok: true }); }
  if (!email || !password || password.length < 8)
    return NextResponse.json({ error: "Email and 8+ char password required" }, { status: 400 });
  let user = await db.user.findUnique({ where: { email } });
  if (action === "register") {
    if (user) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    user = await db.user.create({ data: { email, password: await bcrypt.hash(password, 12), apiToken: newToken() } });
  } else if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await startSession(user.id);
  return NextResponse.json({ ok: true });
}
