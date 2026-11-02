import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { currentUser, usedBytes, MAX_FILE } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as HandleUploadBody;
  try {
    const res = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async () => {
        const free = Number(user.quota) - (await usedBytes(user.id));
        if (free <= 0) throw new Error("Storage quota exceeded");
        return { maximumSizeInBytes: Math.min(MAX_FILE, free), addRandomSuffix: true };
      },
      onUploadCompleted: async () => {}, // record is registered by /api/files (works on localhost too)
    });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
