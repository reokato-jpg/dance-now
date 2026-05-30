import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const DEV_COUPONS: Record<string, { discountType: "PERCENT" | "FIXED"; discountValue: number }> = {
  DANCE10: { discountType: "PERCENT", discountValue: 10 },
  FRIEND500: { discountType: "FIXED", discountValue: 500 },
  BIRTHDAY1000: { discountType: "FIXED", discountValue: 1000 },
};

export async function POST(req: NextRequest) {
  const { code, lessonPrice } = await req.json();

  if (!code) return NextResponse.json({ error: "コードを入力してください" }, { status: 400 });

  if (!isDbAvailable()) {
    const devCoupon = DEV_COUPONS[code.toUpperCase()];
    if (!devCoupon) return NextResponse.json({ error: "このクーポンは存在しません" }, { status: 404 });
    const discountAmount = devCoupon.discountType === "PERCENT"
      ? Math.floor(lessonPrice * devCoupon.discountValue / 100)
      : Math.min(devCoupon.discountValue, lessonPrice);
    return NextResponse.json({
      coupon: {
        code: code.toUpperCase(),
        discountType: devCoupon.discountType,
        discountValue: devCoupon.discountValue,
        discountAmount,
      },
    });
  }

  try {
    const db = getAdminClient();
    const { data: coupon, error } = await db.from("coupons")
      .select("code, discount_type, discount_value, is_active, valid_until, usage_limit, usage_count")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !coupon) return NextResponse.json({ error: "このクーポンは存在しません" }, { status: 404 });

    const c = coupon as any;
    if (!c.is_active) return NextResponse.json({ error: "このクーポンは無効です" }, { status: 400 });
    if (c.valid_until && new Date(c.valid_until) < new Date()) {
      return NextResponse.json({ error: "このクーポンは期限切れです" }, { status: 400 });
    }
    if (c.usage_limit && c.usage_count >= c.usage_limit) {
      return NextResponse.json({ error: "このクーポンは使用上限に達しました" }, { status: 400 });
    }

    const discountAmount = c.discount_type === "PERCENT"
      ? Math.floor(lessonPrice * c.discount_value / 100)
      : Math.min(c.discount_value, lessonPrice);

    return NextResponse.json({
      coupon: {
        code: c.code,
        discountType: c.discount_type,
        discountValue: c.discount_value,
        discountAmount,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "バリデーションに失敗しました" }, { status: 500 });
  }
}
