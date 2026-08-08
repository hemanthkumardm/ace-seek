import { NextRequest, NextResponse } from "next/server";
import { destroySessionToken } from "@/lib/user-store";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("ace_seek_session")?.value;
  if (token) {
    destroySessionToken(token);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("ace_seek_session");
  return res;
}
