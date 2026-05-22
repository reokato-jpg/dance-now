import { NextRequest, NextResponse } from "next/server";
import { devSlots } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDbAvailable()) {
    const idx = devSlots.findIndex((s) => s.id === id);
    if (idx === -1) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    devSlots.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const hasBookings = await prisma.booking.count({
      where: { slotId: id, status: { not: "CANCELLED" } },
    });
    if (hasBookings > 0) {
      return NextResponse.json({ error: "予約があるスロットは削除できません" }, { status: 400 });
    }
    await prisma.slot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin slot DELETE error:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
