import { NextRequest, NextResponse } from "next/server";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

function isEmailAvailable() {
  const key = process.env.RESEND_API_KEY ?? "";
  return key !== "" && !key.includes("placeholder");
}

export async function POST(req: NextRequest) {
  const {
    customerId, lessonId, reservationNo, amount, discountAmount,
    couponCode, paymentMethod, paymentIntentId, merchantPaymentId,
  } = await req.json();

  if (!customerId || !lessonId || !reservationNo) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    const bookingId = `dev-booking::${lessonId}::${Date.now()}`;
    return NextResponse.json({ bookingId, reservationNo });
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    const booking = await prisma.$transaction(async (tx) => {
      let couponId: string | undefined;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (coupon) {
          await tx.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
          couponId = coupon.id;
        }
      }

      const newBooking = await tx.booking.create({
        data: {
          reservationNo,
          customerId,
          lessonId,
          status: "CONFIRMED",
          amount,
          discountAmount: discountAmount || 0,
          ...(couponId ? { couponId } : {}),
        },
      });

      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          method: paymentMethod,
          providerTxnId: paymentIntentId || merchantPaymentId || null,
          amount: amount - (discountAmount || 0),
          status: "COMPLETED",
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalBookings: { increment: 1 },
          totalSpent: { increment: amount - (discountAmount || 0) },
          lastBookedAt: new Date(),
        },
      });

      return newBooking;
    });

    if (isEmailAvailable()) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { instructor: true, studio: true },
      });
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer?.email && lesson) {
        resend.emails.send({
          from: process.env.EMAIL_FROM || "noreply@dance-now.jp",
          to: customer.email,
          subject: `DANCE NOW - ${lesson.title} 予約確定`,
          html: `<p>${customer.lastName} ${customer.firstName} 様</p><p>予約番号: ${reservationNo}</p>`,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ bookingId: booking.id, reservationNo });
  } catch (err) {
    console.error("Booking create error:", err);
    return NextResponse.json({ error: "予約の作成に失敗しました" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const type = searchParams.get("type") || "upcoming";

  if (!customerId) {
    return NextResponse.json({ error: "顧客IDが必要です" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    return NextResponse.json([]);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const bookings = await prisma.booking.findMany({
      where: {
        customerId,
        ...(type === "upcoming"
          ? { status: "CONFIRMED", lesson: { startAt: { gte: now } } }
          : { OR: [{ status: "ATTENDED" }, { status: "CANCELLED" }, { lesson: { startAt: { lt: now } } }] }
        ),
      },
      include: {
        lesson: { include: { instructor: true, studio: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    console.error("Bookings fetch error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
