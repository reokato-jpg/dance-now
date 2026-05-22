import { NextRequest, NextResponse } from "next/server";

function isStripeAvailable() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key !== "" && !key.includes("placeholder");
}

export async function POST(req: NextRequest) {
  const { amount, customerId } = await req.json();

  if (!amount || amount < 50) {
    return NextResponse.json({ error: "無効な金額です" }, { status: 400 });
  }

  if (!isStripeAvailable()) {
    return NextResponse.json({ clientSecret: null, devMode: true });
  }

  try {
    const { stripe } = await import("@/lib/stripe-server");
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "jpy",
      metadata: { customerId: customerId || "" },
      payment_method_types: ["card"],
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe intent error:", err);
    return NextResponse.json({ error: "決済の初期化に失敗しました" }, { status: 500 });
  }
}
