import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminClient } from "@/lib/supabase-admin";
import { devSettings } from "@/lib/dev-stores";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    return NextResponse.json({ ...devSettings });
  }

  try {
    const db = getAdminClient();
    const { data, error } = await db.from("site_settings").select("key, value");
    if (error) throw error;

    const settings: Record<string, string> = { coupon_enabled: "true" };
    for (const row of data ?? []) settings[row.key] = row.value;
    return NextResponse.json(settings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await req.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: "key と value は必須です" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    devSettings[key] = String(value);
    return NextResponse.json({ key, value: String(value) });
  }

  try {
    const db = getAdminClient();
    const { error } = await db.from("site_settings").upsert(
      { key, value: String(value) },
      { onConflict: "key" }
    );
    if (error) throw error;
    return NextResponse.json({ key, value: String(value) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
