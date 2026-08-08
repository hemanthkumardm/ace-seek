import { NextRequest, NextResponse } from "next/server";
import { getSessionData } from "@/lib/user-store";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("ace_seek_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = getSessionData(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session,
  });
}
