import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { devCoupons, DevCoupon } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    return NextResponse.json(devCoupons);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      coupons.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        validUntil: c.validUntil?.toISOString() ?? null,
        usageLimit: c.usageLimit,
        usageCount: c.usageCount,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
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
    const { prisma } = await import("@/lib/prisma");
    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        validUntil: validUntil ? new Date(validUntil) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
      },
    });
    return NextResponse.json({ ...coupon, createdAt: coupon.createdAt.toISOString() }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: "このコードは既に使われています" }, { status: 409 });
    console.error(err);
    return NextResponse.json({ error: "作成失敗" }, { status: 500 });
  }
}
