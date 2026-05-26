import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  if (!isDbAvailable()) {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) });
    return NextResponse.json({
      dailySales: days.map((d) => ({ day: d.getDate(), sales: 0 })),
      paymentSplit: [
        { name: "PayPay", value: 0, amount: 0, color: "#FF0033" },
        { name: "カード", value: 0, amount: 0, color: "#6B46C1" },
      ],
      summary: { totalSales: 0, totalSalesGrowth: null, bookings: 0, avgPrice: 0, avgPriceGrowth: null },
    });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const prevMonthStart = startOfMonth(subMonths(monthStart, 1));
    const prevMonthEnd = endOfMonth(prevMonthStart);

    const [bookings, prevBookings] = await Promise.all([
      prisma.booking.findMany({
        where: { createdAt: { gte: monthStart, lte: monthEnd }, status: "CONFIRMED" },
        select: {
          amount: true,
          discountAmount: true,
          createdAt: true,
          payment: { select: { method: true } },
        },
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd }, status: "CONFIRMED" },
        select: { amount: true, discountAmount: true },
      }),
    ]);

    // Daily sales
    const dayMap = new Map<number, number>();
    const payMap = new Map<string, number>();
    let totalSales = 0;
    for (const b of bookings) {
      const net = b.amount - b.discountAmount;
      const day = new Date(b.createdAt).getDate();
      dayMap.set(day, (dayMap.get(day) ?? 0) + net);
      totalSales += net;
      const method = b.payment?.method ?? "STRIPE";
      payMap.set(method, (payMap.get(method) ?? 0) + net);
    }

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dailySales = days.map((d) => ({ day: d.getDate(), sales: dayMap.get(d.getDate()) ?? 0 }));

    // Payment split
    const paypayAmount = payMap.get("PAYPAY") ?? 0;
    const stripeAmount = payMap.get("STRIPE") ?? 0;
    const payTotal = paypayAmount + stripeAmount;
    const paymentSplit = [
      { name: "PayPay", value: payTotal > 0 ? Math.round((paypayAmount / payTotal) * 100) : 0, amount: paypayAmount, color: "#FF0033" },
      { name: "カード", value: payTotal > 0 ? Math.round((stripeAmount / payTotal) * 100) : 0, amount: stripeAmount, color: "#6B46C1" },
    ];

    // Summary
    const prevTotalSales = prevBookings.reduce((s, b) => s + b.amount - b.discountAmount, 0);
    const totalSalesGrowth =
      prevTotalSales > 0 ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 100) : null;
    const avgPrice = bookings.length > 0 ? Math.round(totalSales / bookings.length) : 0;
    const prevAvgPrice =
      prevBookings.length > 0
        ? Math.round(prevBookings.reduce((s, b) => s + b.amount - b.discountAmount, 0) / prevBookings.length)
        : 0;
    const avgPriceGrowth = prevAvgPrice > 0 ? avgPrice - prevAvgPrice : null;

    return NextResponse.json({
      dailySales,
      paymentSplit,
      summary: {
        totalSales,
        totalSalesGrowth,
        bookings: bookings.length,
        avgPrice,
        avgPriceGrowth,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}
