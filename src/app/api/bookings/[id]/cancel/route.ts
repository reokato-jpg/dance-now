import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDbAvailable()) {
    return NextResponse.json({ success: true, refundAmount: 0, refundRate: 0 });
  }

  try {
    const db = getAdminClient();

    // Fetch booking with slot and payment
    const { data: booking, error: fetchErr } = await db.from("bookings")
      .select("id, status, amount, discount_amount, customer_id, slot:slots(start_at), payments(id, method, provider_txn_id)")
      .eq("id", id)
      .single();

    if (fetchErr || !booking) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });

    const b = booking as any;
    if (b.status !== "CONFIRMED") return NextResponse.json({ error: "キャンセルできない予約です" }, { status: 400 });

    const slotStart = b.slot?.start_at ? new Date(b.slot.start_at) : null;
    const now = new Date();
    const hoursUntil = slotStart ? (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60) : -1;

    let refundRate = 0;
    if (hoursUntil > 24) refundRate = 100;
    else if (hoursUntil > 0) refundRate = 50;

    const paidAmount = b.amount - b.discount_amount;
    const refundAmount = Math.floor(paidAmount * refundRate / 100);

    // Update booking to CANCELLED
    const { error: cancelErr } = await db.from("bookings")
      .update({ status: "CANCELLED" })
      .eq("id", id);
    if (cancelErr) throw cancelErr;

    const payment = b.payments?.[0];

    // Update payment with refund info
    if (refundAmount > 0 && payment) {
      await db.from("payments").update({
        status: refundRate === 100 ? "REFUNDED" : "PARTIALLY_REFUNDED",
        refund_amount: refundAmount,
      }).eq("id", payment.id);

      // Stripe refund
      if (payment.method === "STRIPE" && payment.provider_txn_id) {
        try {
          const { stripe } = await import("@/lib/stripe-server");
          const paymentIntent = await stripe.paymentIntents.retrieve(payment.provider_txn_id);
          const charge = paymentIntent.latest_charge as string;
          if (charge) {
            await stripe.refunds.create({ charge, amount: refundAmount });
          }
        } catch (stripeErr) {
          console.error("Stripe refund error:", stripeErr);
          // Don't fail the cancel if Stripe refund fails — handle manually
        }
      }
    }

    // Update customer stats (decrement)
    const { data: customer } = await db.from("customers")
      .select("total_bookings, total_spent")
      .eq("id", b.customer_id)
      .single();
    if (customer) {
      await db.from("customers").update({
        total_bookings: Math.max(0, ((customer as any).total_bookings ?? 0) - 1),
        total_spent: Math.max(0, ((customer as any).total_spent ?? 0) - paidAmount),
      }).eq("id", b.customer_id);
    }

    return NextResponse.json({ success: true, refundAmount, refundRate });
  } catch (err) {
    console.error("Cancel error:", err);
    return NextResponse.json({ error: "キャンセルに失敗しました" }, { status: 500 });
  }
}
