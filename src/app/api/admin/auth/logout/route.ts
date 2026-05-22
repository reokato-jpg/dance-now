import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  store.delete("admin_session");
  store.delete("admin_pre_auth");
  return NextResponse.json({ success: true });
}
