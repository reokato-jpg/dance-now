import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isEmailAvailable() {
  const key = process.env.RESEND_API_KEY ?? "";
  return key !== "" && !key.includes("placeholder");
}

export async function POST(req: NextRequest) {
  const {
    customerId, slotId, reservationNo, amount, discountAmount,
    couponCode, paymentMethod, paymentIntentId, merchantPaymentId,
  } = await req.json();

  if (!customerId || !slotId || !reservationNo) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    const bookingId = `dev-booking::${slotId}::${Date.now()}`;
    return NextResponse.json({ bookingId, reservationNo });
  }

  try {
    const db = getAdminClient();

    // 1. Handle coupon (read-then-increment; good enough for low-concurrency studio booking)
    let couponId: string | undefined;
    if (couponCode) {
      const { data: coupon } = await db.from("coupons")
        .select("id, usage_count")
        .eq("code", couponCode)
        .single();
      if (coupon) {
        await db.from("coupons")
          .update({ usage_count: ((coupon as any).usage_count ?? 0) + 1 })
          .eq("id", (coupon as any).id);
        couponId = (coupon as any).id;
      }
    }

    // 2. Create booking
    const { data: newBooking, error: bookingErr } = await db.from("bookings")
      .insert({
        reservation_no: reservationNo,
        customer_id: customerId,
        slot_id: slotId,
        status: "CONFIRMED",
        amount,
        discount_amount: discountAmount || 0,
        ...(couponId ? { coupon_id: couponId } : {}),
      })
      .select("id")
      .single();

    if (bookingErr) throw bookingErr;

    // 3. Create payment
    await db.from("payments").insert({
      booking_id: newBooking.id,
      method: paymentMethod,
      provider_txn_id: paymentIntentId || merchantPaymentId || null,
      amount: amount - (discountAmount || 0),
      status: "COMPLETED",
    });

    // 4. Update customer stats
    const { data: curCustomer } = await db.from("customers")
      .select("total_bookings, total_spent")
      .eq("id", customerId)
      .single();
    if (curCustomer) {
      await db.from("customers").update({
        total_bookings: ((curCustomer as any).total_bookings ?? 0) + 1,
        total_spent: ((curCustomer as any).total_spent ?? 0) + (amount - (discountAmount || 0)),
        last_booked_at: new Date().toISOString(),
      }).eq("id", customerId);
    }

    // 5. Send confirmation email
    if (isEmailAvailable()) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const [{ data: slot }, { data: customer }] = await Promise.all([
        db.from("slots").select("start_at, studio:studios(name)").eq("id", slotId).single(),
        db.from("customers").select("email, last_name, first_name").eq("id", customerId).single(),
      ]);
      if ((customer as any)?.email && slot) {
        resend.emails.send({
          from: process.env.EMAIL_FROM || "noreply@studio-rental.jp",
          to: (customer as any).email,
          subject: `STUDIO RENTAL - スタジオ${(slot as any).studio?.name} 予約確定`,
          html: `<p>${(customer as any).last_name} ${(customer as any).first_name} 様</p><p>予約番号: ${reservationNo}</p>`,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ bookingId: newBooking.id, reservationNo });
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
    const db = getAdminClient();
    const now = new Date().toISOString();

    const { data: bookings, error } = await db.from("bookings")
      .select(
        "id, reservation_no, status, amount, discount_amount, created_at, " +
        "slot:slots(id, start_at, duration_min, price, studio:studios(name, address)), " +
        "payments(method, status, amount)"
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter in JS (avoids complex PostgREST join filtering)
    const filtered = (bookings ?? []).filter((b: any) => {
      const slotStart = b.slot?.start_at;
      const isPast = !slotStart || new Date(slotStart) < new Date(now);
      if (type === "upcoming") {
        return b.status === "CONFIRMED" && !isPast;
      } else {
        return b.status !== "CONFIRMED" || isPast;
      }
    });

    return NextResponse.json(filtered.map((b: any) => ({
      id: b.id,
      reservationNo: b.reservation_no,
      status: b.status,
      amount: b.amount,
      discountAmount: b.discount_amount,
      createdAt: b.created_at,
      slot: b.slot ? {
        id: b.slot.id,
        startAt: b.slot.start_at,
        durationMin: b.slot.duration_min,
        price: b.slot.price,
        studio: b.slot.studio,
      } : null,
      payment: b.payments?.[0] ?? null,
    })));
  } catch (err) {
    console.error("Bookings fetch error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
