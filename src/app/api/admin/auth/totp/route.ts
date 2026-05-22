import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { totp } = await req.json();
  const store = await cookies();
  const preAuth = store.get("admin_pre_auth");

  if (!preAuth) {
    return NextResponse.json({ error: "ログインセッションが切れました" }, { status: 401 });
  }

  // In production: validate TOTP using otplib or speakeasy
  // For development, accept "000000"
  const isDev = process.env.NODE_ENV === "development";
  const isValid = isDev ? totp === "000000" : false; // TODO: implement TOTP validation

  if (!isValid) {
    return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 401 });
  }

  store.delete("admin_pre_auth");
  store.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return NextResponse.json({ success: true });
}
