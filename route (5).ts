import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, newToken } from "@/lib/auth";
export async function POST() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apiToken = newToken();
  await db.user.update({ where: { id: u.id }, data: { apiToken } });
  return NextResponse.json({ apiToken });
}
