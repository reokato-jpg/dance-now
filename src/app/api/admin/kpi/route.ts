import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ja } from "date-fns/locale";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, "MM/dd"), day: format(d, "E", { locale: ja }), sales: 0 };
    });
    return NextResponse.json({
      todaySales: 0,
      todaySalesGrowth: null,
      todayBookings: 0,
      cancelRate: 0,
      occupancy: 0,
      weeklyData,
      studioBreakdown: [],
      todaySlots: [],
    });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekAgoStart = startOfDay(subDays(now, 6));
    const lastWeekSameDayStart = startOfDay(subDays(now, 7));
    const lastWeekSameDayEnd = endOfDay(subDays(now, 7));

    const [todayBookings, lastWeekSameDayBookings, last7DaysBookings, last7DaysAll, todaySlots] =
      await Promise.all([
        // Today confirmed bookings
        prisma.booking.findMany({
          where: { createdAt: { gte: todayStart, lte: todayEnd }, status: "CONFIRMED" },
          select: { amount: true, discountAmount: true },
        }),
        // Same day last week confirmed bookings (for growth %)
        prisma.booking.findMany({
          where: { createdAt: { gte: lastWeekSameDayStart, lte: lastWeekSameDayEnd }, status: "CONFIRMED" },
          select: { amount: true, discountAmount: true },
        }),
        // Last 7 days confirmed bookings for weekly chart
        prisma.booking.findMany({
          where: { createdAt: { gte: weekAgoStart }, status: "CONFIRMED" },
          select: { amount: true, discountAmount: true, createdAt: true },
        }),
        // All bookings last 7 days for cancel rate
        prisma.booking.findMany({
          where: { createdAt: { gte: weekAgoStart } },
          select: { status: true, slotId: true },
        }),
        // Today's slots
        prisma.slot.findMany({
          where: { startAt: { gte: todayStart, lte: todayEnd } },
          include: {
            studio: true,
            _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
          },
          orderBy: { startAt: "asc" },
        }),
      ]);

    // Today's KPIs
    const todaySales = todayBookings.reduce((s, b) => s + b.amount - b.discountAmount, 0);
    const lastWeekSales = lastWeekSameDayBookings.reduce((s, b) => s + b.amount - b.discountAmount, 0);
    const todaySalesGrowth =
      lastWeekSales > 0 ? Math.round(((todaySales - lastWeekSales) / lastWeekSales) * 100) : null;

    // Weekly chart
    const weeklyMap = new Map<string, number>();
    for (const b of last7DaysBookings) {
      const key = format(new Date(b.createdAt), "MM/dd");
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + b.amount - b.discountAmount);
    }
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      const key = format(d, "MM/dd");
      return { date: key, day: format(d, "E", { locale: ja }), sales: weeklyMap.get(key) ?? 0 };
    });

    // Cancel rate this week
    const cancelRate =
      last7DaysAll.length > 0
        ? Math.round((last7DaysAll.filter((b) => b.status === "CANCELLED").length / last7DaysAll.length) * 1000) / 10
        : 0;

    // Occupancy from today's slots
    const totalCapacity = todaySlots.reduce((s, sl) => s + sl.capacity, 0);
    const totalBooked = todaySlots.reduce((s, sl) => s + sl._count.bookings, 0);
    const occupancy = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    // Studio breakdown from last 7 days
    const studioMap = new Map<string, number>();
    for (const b of last7DaysAll.filter((b) => b.status !== "CANCELLED")) {
      // We need to look up studio via slot — build a slot→studio map from todaySlots isn't complete
      // Use a simple count by slotId instead and we'll enrich with studio info
      studioMap.set(b.slotId, (studioMap.get(b.slotId) ?? 0) + 1);
    }
    // Enrich with studio info
    const slotIds = Array.from(studioMap.keys());
    let studioBreakdown: { name: string; pct: number }[] = [];
    if (slotIds.length > 0) {
      const slots = await prisma.slot.findMany({
        where: { id: { in: slotIds } },
        include: { studio: true },
      });
      const byStudio = new Map<string, { name: string; count: number }>();
      for (const sl of slots) {
        const cur = byStudio.get(sl.studioId) ?? { name: `Studio ${sl.studio.name}`, count: 0 };
        cur.count += studioMap.get(sl.id) ?? 0;
        byStudio.set(sl.studioId, cur);
      }
      const total = Array.from(byStudio.values()).reduce((s, v) => s + v.count, 0);
      studioBreakdown = Array.from(byStudio.values())
        .map((v) => ({ name: v.name, pct: total > 0 ? Math.round((v.count / total) * 100) : 0 }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);
    }

    return NextResponse.json({
      todaySales,
      todaySalesGrowth,
      todayBookings: todayBookings.length,
      cancelRate,
      occupancy,
      weeklyData,
      studioBreakdown,
      todaySlots: todaySlots.map((sl) => ({
        id: sl.id,
        studioName: sl.studio.name,
        startAt: sl.startAt.toISOString(),
        durationMin: sl.durationMin,
        price: sl.price,
        capacity: sl.capacity,
        bookedCount: sl._count.bookings,
      })),
    });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? `${err.message} | ${(err as NodeJS.ErrnoException).code}` : String(err);
    return NextResponse.json({ error: "取得失敗", detail: msg }, { status: 500 });
  }
}
