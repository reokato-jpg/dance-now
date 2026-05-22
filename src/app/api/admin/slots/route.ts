import { NextRequest, NextResponse } from "next/server";
import { devSlots, devStudios } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  if (!isDbAvailable()) {
    if (!dateStr) return NextResponse.json(devSlots);
    const day = new Date(dateStr);
    const filtered = devSlots.filter((s) => {
      const d = new Date(s.startAt);
      return d.toDateString() === day.toDateString();
    });
    return NextResponse.json(filtered);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const where = dateStr
      ? {
          startAt: {
            gte: new Date(new Date(dateStr).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(dateStr).setHours(23, 59, 59, 999)),
          },
        }
      : {};
    const slots = await prisma.slot.findMany({
      where,
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
    console.error("Admin slots GET error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { studioId, date, startHour, startMinute, durationMin, capacity, price } = await req.json();

  if (!studioId || !date || startHour == null || !durationMin || !capacity || !price) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    const studio = devStudios.find((s) => s.id === studioId);
    if (!studio) return NextResponse.json({ error: "スタジオが見つかりません" }, { status: 404 });

    const startAt = new Date(date);
    startAt.setHours(startHour, startMinute ?? 0, 0, 0);

    const newSlot = {
      id: `dev-slot-${Date.now()}`,
      studioId,
      studioName: studio.name,
      studioAddress: studio.address,
      startAt: startAt.toISOString(),
      durationMin: Number(durationMin),
      capacity: Number(capacity),
      bookedCount: 0,
      price: Number(price),
    };
    devSlots.push(newSlot);
    return NextResponse.json(newSlot, { status: 201 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const studio = await prisma.studio.findUnique({ where: { id: studioId } });
    if (!studio) return NextResponse.json({ error: "スタジオが見つかりません" }, { status: 404 });

    const startAt = new Date(date);
    startAt.setHours(startHour, startMinute ?? 0, 0, 0);

    const slot = await prisma.slot.create({
      data: { studioId, startAt, durationMin: Number(durationMin), capacity: Number(capacity), price: Number(price) },
      include: { studio: true },
    });

    return NextResponse.json({
      id: slot.id,
      studioId: slot.studioId,
      studioName: slot.studio.name,
      studioAddress: slot.studio.address,
      startAt: slot.startAt.toISOString(),
      durationMin: slot.durationMin,
      capacity: slot.capacity,
      bookedCount: 0,
      price: slot.price,
    }, { status: 201 });
  } catch (err) {
    console.error("Admin slots POST error:", err);
    return NextResponse.json({ error: "スロットの作成に失敗しました" }, { status: 500 });
  }
}
