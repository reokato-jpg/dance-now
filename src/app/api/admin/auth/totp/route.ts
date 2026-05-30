import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import { createSessionCookie } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  const { totp } = await req.json();
  const store = await cookies();
  const preAuth = store.get("admin_pre_auth");

  if (!preAuth) {
    return NextResponse.json({ error: "ログインセッションが切れました" }, { status: 401 });
  }

  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "TOTP未設定" }, { status: 500 });
  }

  const isValid = authenticator.verify({ token: totp, secret });
  if (!isValid) {
    return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 401 });
  }

  store.delete("admin_pre_auth");
  store.set("admin_session", await createSessionCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ success: true });
}
