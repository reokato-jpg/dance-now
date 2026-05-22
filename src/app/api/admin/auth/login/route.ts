import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dance-school.jp";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme123";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "認証情報が正しくありません" }, { status: 401 });
  }

  // Store interim state for TOTP verification
  const store = await cookies();
  store.set("admin_pre_auth", "1", { httpOnly: true, path: "/", maxAge: 300 });

  return NextResponse.json({ success: true, requireTotp: true });
}
