import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { amount, reservationNo, lessonTitle, customerId } = await req.json();

  const merchantPaymentId = `DN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const appEnv = process.env.NEXT_PUBLIC_PAYPAY_ENV === "production" ? "" : "stg-";
  const baseUrl = `https://${appEnv}api.paypay.ne.jp`;

  try {
    // In production: call PayPay for Business API
    // POST /v2/codes to create a QR payment
    const mockQrUrl = `https://qr.paypay.ne.jp/mock/${merchantPaymentId}`;
    const mockDeepLink = `paypay://payment?id=${merchantPaymentId}`;

    return NextResponse.json({
      merchantPaymentId,
      qrUrl: mockQrUrl,
      deepLink: mockDeepLink,
    });
  } catch (err) {
    console.error("PayPay create error:", err);
    return NextResponse.json({ error: "PayPay QRの生成に失敗しました" }, { status: 500 });
  }
}
