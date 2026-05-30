import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const db = getAdminClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as any;
      await db.from("payments")
        .update({ status: "COMPLETED" })
        .eq("provider_txn_id", pi.id);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as any;
      await db.from("payments")
        .update({ status: "FAILED" })
        .eq("provider_txn_id", pi.id);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as any;
      const pi = charge.payment_intent;
      await db.from("payments")
        .update({ status: "REFUNDED" })
        .eq("provider_txn_id", pi);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
