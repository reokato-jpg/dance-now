import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from "date-fns";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    const db = getAdminClient();
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const prevMonthStart = startOfMonth(subMonths(monthStart, 1));
    const prevMonthEnd = endOfMonth(prevMonthStart);

    const [{ data: bookings }, { data: prevBookings }] = await Promise.all([
      db.from("bookings")
        .select("amount, discount_amount, created_at, payments(method)")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString())
        .eq("status", "CONFIRMED"),
      db.from("bookings")
        .select("amount, discount_amount")
        .gte("created_at", prevMonthStart.toISOString())
        .lte("created_at", prevMonthEnd.toISOString())
        .eq("status", "CONFIRMED"),
    ]);

    const dayMap = new Map<number, number>();
    const payMap = new Map<string, number>();
    let totalSales = 0;

    for (const b of bookings ?? []) {
      const net = (b as any).amount - (b as any).discount_amount;
      const day = new Date((b as any).created_at).getDate();
      dayMap.set(day, (dayMap.get(day) ?? 0) + net);
      totalSales += net;
      // payments is an array (FK is on payments side)
      const method = ((b as any).payments as any[])?.[0]?.method ?? "STRIPE";
      payMap.set(method, (payMap.get(method) ?? 0) + net);
    }

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dailySales = days.map((d) => ({ day: d.getDate(), sales: dayMap.get(d.getDate()) ?? 0 }));

    const paypayAmount = payMap.get("PAYPAY") ?? 0;
    const stripeAmount = payMap.get("STRIPE") ?? 0;
    const payTotal = paypayAmount + stripeAmount;
    const paymentSplit = [
      { name: "PayPay", value: payTotal > 0 ? Math.round((paypayAmount / payTotal) * 100) : 0, amount: paypayAmount, color: "#FF0033" },
      { name: "カード", value: payTotal > 0 ? Math.round((stripeAmount / payTotal) * 100) : 0, amount: stripeAmount, color: "#6B46C1" },
    ];

    const prevArr = prevBookings ?? [];
    const prevTotalSales = prevArr.reduce((s: number, b: any) => s + b.amount - b.discount_amount, 0);
    const totalSalesGrowth = prevTotalSales > 0 ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 100) : null;
    const bookingCount = (bookings ?? []).length;
    const avgPrice = bookingCount > 0 ? Math.round(totalSales / bookingCount) : 0;
    const prevAvgPrice = prevArr.length > 0 ? Math.round(prevTotalSales / prevArr.length) : 0;
    const avgPriceGrowth = prevAvgPrice > 0 ? avgPrice - prevAvgPrice : null;

    return NextResponse.json({
      dailySales,
      paymentSplit,
      summary: { totalSales, totalSalesGrowth, bookings: bookingCount, avgPrice, avgPriceGrowth },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}
