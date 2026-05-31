import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { devSettings } from "@/lib/dev-stores";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET() {
  if (!isDbAvailable()) {
    return NextResponse.json({
      couponEnabled: devSettings.coupon_enabled !== "false",
    });
  }

  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "coupon_enabled")
      .maybeSingle();

    if (error) throw error;

    const couponEnabled = data ? data.value !== "false" : true;
    return NextResponse.json({ couponEnabled });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ couponEnabled: true });
  }
}
