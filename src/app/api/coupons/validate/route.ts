import { NextRequest, NextResponse } from "next/server";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
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
    const { prisma } = await import("@/lib/prisma");
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) return NextResponse.json({ error: "このクーポンは存在しません" }, { status: 404 });
    if (!coupon.isActive) return NextResponse.json({ error: "このクーポンは無効です" }, { status: 400 });
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return NextResponse.json({ error: "このクーポンは期限切れです" }, { status: 400 });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "このクーポンは使用上限に達しました" }, { status: 400 });
    }

    const discountAmount = coupon.discountType === "PERCENT"
      ? Math.floor(lessonPrice * coupon.discountValue / 100)
      : Math.min(coupon.discountValue, lessonPrice);

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "バリデーションに失敗しました" }, { status: 500 });
  }
}
