import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { devSlots } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const studioId = searchParams.get("studioId") || "";
  const date = dateStr ? new Date(dateStr) : new Date();

  if (!isDbAvailable()) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const filtered = devSlots.filter((s) => {
      const t = new Date(s.startAt);
      const inRange = t >= dayStart && t <= dayEnd;
      const matchStudio = !studioId || s.studioId === studioId;
      return inRange && matchStudio;
    });
    return NextResponse.json(filtered);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const slots = await prisma.slot.findMany({
      where: {
        startAt: { gte: startOfDay(date), lte: endOfDay(date) },
        ...(studioId ? { studioId } : {}),
      },
      include: {
        studio: true,
        _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json(
      slots.map((s) => ({
        id: s.id,
        studioId: s.studioId,
        studioName: s.studio.name,
        studioAddress: s.studio.address,
        startAt: s.startAt.toISOString(),
        durationMin: s.durationMin,
        capacity: s.capacity,
        bookedCount: s._count.bookings,
        price: s.price,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
