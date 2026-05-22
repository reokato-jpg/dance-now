import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as any;
      await prisma.payment.updateMany({
        where: { providerTxnId: pi.id },
        data: { status: "COMPLETED" },
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as any;
      await prisma.payment.updateMany({
        where: { providerTxnId: pi.id },
        data: { status: "FAILED" },
      });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as any;
      const pi = charge.payment_intent;
      await prisma.payment.updateMany({
        where: { providerTxnId: pi },
        data: { status: "REFUNDED" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
