import { NextRequest, NextResponse } from "next/server";
import { registerUser, createSessionToken, UserPlan } from "@/lib/user-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password, plan } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const validPlan: UserPlan = plan === "pro" ? "pro" : plan === "team" ? "team" : "free";
    const user = registerUser(email, name || "", password, validPlan);
    const token = createSessionToken(user);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        apiKey: user.apiKey,
      },
    });

    res.cookies.set("ace_seek_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
