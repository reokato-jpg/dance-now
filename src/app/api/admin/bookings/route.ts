import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        ...(status !== "ALL" ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { reservationNo: { contains: search, mode: "insensitive" } },
            { customer: { phone: { contains: search } } },
          ],
        } : {}),
      },
      include: {
        lesson: { include: { instructor: true, studio: true } },
        payment: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const stats = {
      total: await prisma.booking.count(),
      confirmed: await prisma.booking.count({ where: { status: "CONFIRMED" } }),
      cancelled: await prisma.booking.count({ where: { status: "CANCELLED" } }),
      noShow: await prisma.booking.count({ where: { status: "NO_SHOW" } }),
    };

    return NextResponse.json({ bookings, stats });
  } catch (err) {
    console.error("Admin bookings error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
