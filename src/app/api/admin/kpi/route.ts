import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}


export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, "MM/dd"), day: format(d, "E", { locale: ja }), sales: 0 };
    });
    return NextResponse.json({
      todaySales: 0, todaySalesGrowth: null, todayBookings: 0,
      cancelRate: 0, occupancy: 0, weeklyData, studioBreakdown: [], todaySlots: [],
    });
  }

  try {
    const db = getAdminClient();
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const weekAgoStart = startOfDay(subDays(now, 6)).toISOString();
    const lastWeekSameDayStart = startOfDay(subDays(now, 7)).toISOString();
    const lastWeekSameDayEnd = endOfDay(subDays(now, 7)).toISOString();

    const [
      { data: todayBookings },
      { data: lastWeekBookings },
      { data: last7DaysConfirmed },
      { data: last7DaysAll },
      { data: todaySlots },
    ] = await Promise.all([
      db.from("bookings")
        .select("amount, discount_amount")
        .gte("created_at", todayStart).lte("created_at", todayEnd)
        .eq("status", "CONFIRMED"),
      db.from("bookings")
        .select("amount, discount_amount")
        .gte("created_at", lastWeekSameDayStart).lte("created_at", lastWeekSameDayEnd)
        .eq("status", "CONFIRMED"),
      db.from("bookings")
        .select("amount, discount_amount, created_at")
        .gte("created_at", weekAgoStart).eq("status", "CONFIRMED"),
      db.from("bookings")
        .select("status, slot_id")
        .gte("created_at", weekAgoStart),
      db.from("slots")
        .select("id, studio_id, start_at, duration_min, price, capacity, studios(name), bookings(status)")
        .gte("start_at", todayStart).lte("start_at", todayEnd)
        .order("start_at"),
    ]);

    const todaySales = (todayBookings ?? []).reduce((s: number, b: any) => s + b.amount - b.discount_amount, 0);
    const lastWeekSales = (lastWeekBookings ?? []).reduce((s: number, b: any) => s + b.amount - b.discount_amount, 0);
    const todaySalesGrowth = lastWeekSales > 0 ? Math.round(((todaySales - lastWeekSales) / lastWeekSales) * 100) : null;

    // Weekly chart
    const weeklyMap = new Map<string, number>();
    for (const b of last7DaysConfirmed ?? []) {
      const key = format(new Date(b.created_at), "MM/dd");
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + b.amount - b.discount_amount);
    }
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      const key = format(d, "MM/dd");
      return { date: key, day: format(d, "E", { locale: ja }), sales: weeklyMap.get(key) ?? 0 };
    });

    // Cancel rate
    const all7 = last7DaysAll ?? [];
    const cancelRate = all7.length > 0
      ? Math.round((all7.filter((b: any) => b.status === "CANCELLED").length / all7.length) * 1000) / 10
      : 0;

    // Today's slots + occupancy
    const slotsArr = todaySlots ?? [];
    const totalCapacity = slotsArr.reduce((s: number, sl: any) => s + sl.capacity, 0);
    const totalBooked = slotsArr.reduce((s: number, sl: any) =>
      s + (sl.bookings ?? []).filter((b: any) => b.status !== "CANCELLED").length, 0);
    const occupancy = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    // Studio breakdown from last 7 days
    const studioBookingMap = new Map<string, number>();
    for (const b of all7.filter((b: any) => b.status !== "CANCELLED")) {
      studioBookingMap.set(b.slot_id, (studioBookingMap.get(b.slot_id) ?? 0) + 1);
    }
    let studioBreakdown: { name: string; pct: number }[] = [];
    if (studioBookingMap.size > 0) {
      const slotIds = Array.from(studioBookingMap.keys());
      const { data: slots } = await db.from("slots")
        .select("id, studio_id, studios(name)")
        .in("id", slotIds);
      const byStudio = new Map<string, { name: string; count: number }>();
      for (const sl of slots ?? []) {
        const studioName = (sl as any).studios?.name ?? "Studio";
        const cur = byStudio.get((sl as any).studio_id) ?? { name: studioName, count: 0 };
        cur.count += studioBookingMap.get(sl.id) ?? 0;
        byStudio.set((sl as any).studio_id, cur);
      }
      const total = Array.from(byStudio.values()).reduce((s, v) => s + v.count, 0);
      studioBreakdown = Array.from(byStudio.values())
        .map((v) => ({ name: v.name, pct: total > 0 ? Math.round((v.count / total) * 100) : 0 }))
        .sort((a, b) => b.pct - a.pct).slice(0, 5);
    }

    return NextResponse.json({
      todaySales, todaySalesGrowth,
      todayBookings: (todayBookings ?? []).length,
      cancelRate, occupancy, weeklyData, studioBreakdown,
      todaySlots: slotsArr.map((sl: any) => ({
        id: sl.id,
        studioName: sl.studios?.name ?? "",
        startAt: sl.start_at,
        durationMin: sl.duration_min,
        price: sl.price,
        capacity: sl.capacity,
        bookedCount: (sl.bookings ?? []).filter((b: any) => b.status !== "CANCELLED").length,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}
