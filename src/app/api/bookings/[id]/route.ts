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
    if (!id.startsWith("dev-booking::")) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    const slotId = id.split("::")[1] ?? "dev-slot-1";
    const slot = devSlots.find((s) => s.id === slotId) ?? devSlots[0];
    return NextResponse.json({
      id,
      reservationNo: `DN-DEV-${id.split("::")[2]?.slice(-4) ?? "0000"}`,
      status: "CONFIRMED",
      amount: slot?.price ?? 3000,
      discountAmount: 0,
      slot: slot ?? null,
    });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        slot: { include: { studio: true } },
        payment: true,
        customer: true,
      },
    });

    if (!booking) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (err) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
