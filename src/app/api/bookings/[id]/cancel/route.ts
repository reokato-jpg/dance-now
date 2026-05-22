import { NextRequest, NextResponse } from "next/server";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
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
    const { prisma } = await import("@/lib/prisma");
    const { stripe } = await import("@/lib/stripe-server");

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true, payment: true },
    });

    if (!booking) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
    if (booking.status !== "CONFIRMED") return NextResponse.json({ error: "キャンセルできない予約です" }, { status: 400 });

    const now = new Date();
    const slotDate = new Date(booking.slot.startAt);
    const hoursUntil = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundRate = 0;
    if (hoursUntil > 24) refundRate = 100;
    else if (hoursUntil > 0) refundRate = 50;

    const paidAmount = booking.amount - booking.discountAmount;
    const refundAmount = Math.floor(paidAmount * refundRate / 100);

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });

      if (refundAmount > 0 && booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: refundRate === 100 ? "REFUNDED" : "PARTIALLY_REFUNDED",
            refundAmount,
          },
        });

        if (booking.payment.method === "STRIPE" && booking.payment.providerTxnId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment.providerTxnId);
          const charge = paymentIntent.latest_charge as string;
          if (charge) {
            await stripe.refunds.create({ charge, amount: refundAmount });
          }
        }
      }

      await tx.customer.update({
        where: { id: booking.customerId },
        data: { totalBookings: { decrement: 1 }, totalSpent: { decrement: paidAmount } },
      });
    });

    return NextResponse.json({ success: true, refundAmount, refundRate });
  } catch (err) {
    console.error("Cancel error:", err);
    return NextResponse.json({ error: "キャンセルに失敗しました" }, { status: 500 });
  }
}
