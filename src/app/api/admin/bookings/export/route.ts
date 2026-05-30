import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}


export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    const csv = "予約番号,スタジオ,日時,金額,支払方法,ステータス,顧客電話番号\n";
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings_${format(new Date(), "yyyyMMdd")}.csv"`,
      },
    });
  }

  try {
    const db = getAdminClient();
    const { data: bookings, error } = await db.from("bookings")
      .select(
        "reservation_no, status, amount, discount_amount, " +
        "slot:slots(start_at, studio:studios(name)), " +
        "payments(method), " +
        "customer:customers(phone)"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const header = ["予約番号", "スタジオ", "日時", "金額", "支払方法", "ステータス", "顧客電話番号"];
    const rows = (bookings ?? []).map((b: any) => [
      b.reservation_no,
      b.slot?.studio?.name ? `Studio ${b.slot.studio.name}` : "",
      b.slot?.start_at ? format(new Date(b.slot.start_at), "yyyy/MM/dd HH:mm") : "",
      b.amount - b.discount_amount,
      b.payments?.[0]?.method || "",
      b.status,
      b.customer?.phone || "",
    ]);

    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings_${format(new Date(), "yyyyMMdd")}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "エクスポートに失敗しました" }, { status: 500 });
  }
}
