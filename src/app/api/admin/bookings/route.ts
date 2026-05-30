import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}


export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    return NextResponse.json({ bookings: [], stats: { total: 0, confirmed: 0, cancelled: 0, noShow: 0 } });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";

  try {
    const db = getAdminClient();

    // Build bookings query
    let query = db.from("bookings")
      .select(
        "id, reservation_no, status, amount, discount_amount, created_at, " +
        "slot:slots(id, start_at, duration_min, price, studio:studios(name, address)), " +
        "payments(method, status, amount, provider_txn_id), " +
        "customer:customers(id, phone, email, last_name, first_name)"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "ALL") query = query.eq("status", status);

    if (search) {
      // Check if search looks like a phone number
      if (/^[\d+]/.test(search)) {
        const { data: matchedCustomers } = await db.from("customers")
          .select("id")
          .ilike("phone", `%${search}%`);
        const ids = (matchedCustomers ?? []).map((c: any) => c.id);
        if (ids.length > 0) {
          query = query.or(`reservation_no.ilike.%${search}%,customer_id.in.(${ids.join(",")})`);
        } else {
          query = query.ilike("reservation_no", `%${search}%`);
        }
      } else {
        query = query.ilike("reservation_no", `%${search}%`);
      }
    }

    const { data: bookings, error: bookingsErr } = await query;
    if (bookingsErr) throw bookingsErr;

    // Stats counts
    const [
      { count: total },
      { count: confirmed },
      { count: cancelled },
      { count: noShow },
    ] = await Promise.all([
      db.from("bookings").select("*", { count: "exact", head: true }),
      db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "CONFIRMED"),
      db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "CANCELLED"),
      db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "NO_SHOW"),
    ]);

    return NextResponse.json({
      bookings: (bookings ?? []).map((b: any) => ({
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
          studio: b.slot.studio ? {
            name: b.slot.studio.name,
            address: b.slot.studio.address,
          } : null,
        } : null,
        payment: b.payments?.[0] ? {
          method: b.payments[0].method,
          status: b.payments[0].status,
          amount: b.payments[0].amount,
        } : null,
        customer: b.customer ? {
          id: b.customer.id,
          phone: b.customer.phone,
          email: b.customer.email,
          lastName: b.customer.last_name,
          firstName: b.customer.first_name,
        } : null,
      })),
      stats: {
        total: total ?? 0,
        confirmed: confirmed ?? 0,
        cancelled: cancelled ?? 0,
        noShow: noShow ?? 0,
      },
    });
  } catch (err) {
    console.error("Admin bookings error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
