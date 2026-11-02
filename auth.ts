import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "./db";

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
export const newToken = () => "zp_" + randomBytes(24).toString("hex");
export const newFileId = () => randomBytes(6).toString("base64url");
export const MAX_FILE = 100 * 1024 * 1024; // per-file cap
export const TTLS: Record<string, number> = { "1h": 3600e3, "24h": 86400e3, "7d": 604800e3 };

export async function startSession(userId: string) {
  const jwt = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d").sign(key());
  cookies().set("session", jwt, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 604800 });
}

// Cookie session OR "Authorization: Bearer zp_..." API token
export async function currentUser() {
  const bearer = headers().get("authorization")?.replace("Bearer ", "");
  if (bearer?.startsWith("zp_")) return db.user.findUnique({ where: { apiToken: bearer } });
  const c = cookies().get("session")?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c, key());
    return db.user.findUnique({ where: { id: payload.uid as string } });
  } catch { return null; }
}

export async function usedBytes(userId: string) {
  const r = await db.file.aggregate({ where: { userId, expiresAt: { gt: new Date() } }, _sum: { size: true } });
  return r._sum.size ?? 0;
}
