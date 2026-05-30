import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@dance-school.jp";
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || "changeme123";
  const hasTotpSecret = !!process.env.ADMIN_TOTP_SECRET;

  // Validate email
  if (email !== adminEmail) {
    return NextResponse.json({ error: "認証情報が正しくありません" }, { status: 401 });
  }

  // Validate password: bcrypt hash takes priority over plain-text fallback
  let passwordOk = false;
  if (adminPasswordHash) {
    passwordOk = await bcrypt.compare(password, adminPasswordHash);
  } else {
    passwordOk = password === adminPasswordPlain;
  }

  if (!passwordOk) {
    return NextResponse.json({ error: "認証情報が正しくありません" }, { status: 401 });
  }

  const store = await cookies();

  // If TOTP is configured, require 2FA step
  if (hasTotpSecret) {
    store.set("admin_pre_auth", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 300, // 5 minutes to enter TOTP
    });
    return NextResponse.json({ success: true, requireTotp: true });
  }

  // No TOTP configured — set session directly
  store.set("admin_session", await createSessionCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return NextResponse.json({ success: true, requireTotp: false });
}
