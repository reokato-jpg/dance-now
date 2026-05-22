import { NextRequest, NextResponse } from "next/server";
import { devSlots } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDbAvailable()) {
    const slot = devSlots.find((s) => s.id === id);
    if (!slot) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json(slot);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const slot = await prisma.slot.findUnique({
      where: { id },
      include: {
        studio: true,
        _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
      },
    });
    if (!slot) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json({
      id: slot.id,
      studioId: slot.studioId,
      studioName: slot.studio.name,
      studioAddress: slot.studio.address,
      startAt: slot.startAt.toISOString(),
      durationMin: slot.durationMin,
      capacity: slot.capacity,
      bookedCount: slot._count.bookings,
      price: slot.price,
    });
  } catch (err) {
    console.error("Slot detail error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
