import { NextRequest, NextResponse } from "next/server";
import { devSlots } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDbAvailable()) {
    if (!id.startsWith("dev-booking::")) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    const slotId = id.split("::")[1] ?? "dev-slot-1";
    const slot = devSlots.find((s) => s.id === slotId) ?? devSlots[0];
    return NextResponse.json({
      id,
      reservationNo: `DN-DEV-${id.split("::")[2]?.slice(-4) ?? "0000"}`,
      status: "CONFIRMED",
      amount: slot?.price ?? 3000,
      discountAmount: 0,
      slot: slot ?? null,
    });
  }

  try {
    const db = getAdminClient();
    const { data: booking, error } = await db.from("bookings")
      .select(
        "id, reservation_no, status, amount, discount_amount, created_at, " +
        "slot:slots(id, start_at, duration_min, price, capacity, studio:studios(name, address)), " +
        "payments(id, method, status, amount, provider_txn_id), " +
        "customer:customers(id, phone, email, last_name, first_name)"
      )
      .eq("id", id)
      .single();

    if (error || !booking) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

    return NextResponse.json({
      id: (booking as any).id,
      reservationNo: (booking as any).reservation_no,
      status: (booking as any).status,
      amount: (booking as any).amount,
      discountAmount: (booking as any).discount_amount,
      createdAt: (booking as any).created_at,
      slot: (booking as any).slot ? {
        id: (booking as any).slot.id,
        startAt: (booking as any).slot.start_at,
        durationMin: (booking as any).slot.duration_min,
        price: (booking as any).slot.price,
        capacity: (booking as any).slot.capacity,
        studio: (booking as any).slot.studio,
      } : null,
      payment: (booking as any).payments?.[0] ?? null,
      customer: (booking as any).customer ? {
        id: (booking as any).customer.id,
        phone: (booking as any).customer.phone,
        email: (booking as any).customer.email,
        lastName: (booking as any).customer.last_name,
        firstName: (booking as any).customer.first_name,
      } : null,
    });
  } catch (err) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
