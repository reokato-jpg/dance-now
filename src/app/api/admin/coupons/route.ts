import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { devCoupons, DevCoupon } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}


export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    return NextResponse.json(devCoupons);
  }

  try {
    const db = getAdminClient();
    const { data: coupons, error } = await db.from("coupons")
      .select("id, code, discount_type, discount_value, valid_until, usage_limit, usage_count, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      (coupons ?? []).map((c: any) => ({
        id: c.id,
        code: c.code,
        discountType: c.discount_type,
        discountValue: c.discount_value,
        validUntil: c.valid_until ?? null,
        usageLimit: c.usage_limit,
        usageCount: c.usage_count,
        isActive: c.is_active,
        createdAt: c.created_at,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, discountType, discountValue, validUntil, usageLimit } = body;

  if (!code?.trim() || !discountType || !discountValue) {
    return NextResponse.json({ error: "必須項目が未入力です" }, { status: 400 });
  }
  if (!["PERCENT", "FIXED"].includes(discountType)) {
    return NextResponse.json({ error: "割引タイプが不正です" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    const existing = devCoupons.find((c) => c.code === code.trim().toUpperCase());
    if (existing) return NextResponse.json({ error: "このコードは既に使われています" }, { status: 409 });
    const newCoupon: DevCoupon = {
      id: `dev-coupon-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      validUntil: validUntil || null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    devCoupons.unshift(newCoupon);
    return NextResponse.json(newCoupon, { status: 201 });
  }

  try {
    const db = getAdminClient();
    const { data: coupon, error } = await db.from("coupons")
      .insert({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "このコードは既に使われています" }, { status: 409 });
      throw error;
    }

    return NextResponse.json({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      validUntil: coupon.valid_until ?? null,
      usageLimit: coupon.usage_limit,
      usageCount: coupon.usage_count,
      isActive: coupon.is_active,
      createdAt: coupon.created_at,
    }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "作成失敗" }, { status: 500 });
  }
}
