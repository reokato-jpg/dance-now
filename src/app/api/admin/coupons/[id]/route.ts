import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { devCoupons } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  if (!isDbAvailable()) {
    const idx = devCoupons.findIndex((c) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (typeof body.isActive === "boolean") devCoupons[idx].isActive = body.isActive;
    return NextResponse.json(devCoupons[idx]);
  }

  try {
    const db = getAdminClient();
    const { data: coupon, error } = await db.from("coupons")
      .update({ is_active: body.isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

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
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  if (!isDbAvailable()) {
    const idx = devCoupons.findIndex((c) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    devCoupons.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }

  try {
    const db = getAdminClient();
    const { error } = await db.from("coupons").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "削除失敗" }, { status: 500 });
  }
}
