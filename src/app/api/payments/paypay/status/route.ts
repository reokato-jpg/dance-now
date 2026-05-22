import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantPaymentId = searchParams.get("id");

  if (!merchantPaymentId) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  try {
    // In production: GET /v1/codes/payments/{merchantPaymentId}
    // Return CREATED | AUTHORIZED | COMPLETED | CANCELED | EXPIRED | FAILED
    return NextResponse.json({ status: "CREATED", merchantPaymentId });
  } catch (err) {
    return NextResponse.json({ error: "ステータス取得に失敗しました" }, { status: 500 });
  }
}
