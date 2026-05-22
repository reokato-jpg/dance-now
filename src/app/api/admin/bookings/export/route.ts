import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        slot: { include: { studio: true } },
        payment: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const header = ["予約番号", "スタジオ", "日時", "金額", "支払方法", "ステータス", "顧客電話番号"];
    const rows = bookings.map((b) => [
      b.reservationNo,
      `Studio ${b.slot.studio.name}`,
      format(b.slot.startAt, "yyyy/MM/dd HH:mm"),
      b.amount - b.discountAmount,
      b.payment?.method || "",
      b.status,
      b.customer.phone,
    ]);

    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const bom = "﻿";

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings_${format(new Date(), "yyyyMMdd")}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "エクスポートに失敗しました" }, { status: 500 });
  }
}
