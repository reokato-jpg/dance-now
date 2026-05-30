import { NextRequest, NextResponse } from "next/server";
import { devSlots } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    const db = getAdminClient();
    const { data: slot, error } = await db.from("slots")
      .select("id, studio_id, start_at, duration_min, capacity, price, studio:studios(name, address), bookings(status)")
      .eq("id", id)
      .single();

    if (error || !slot) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

    return NextResponse.json({
      id: (slot as any).id,
      studioId: (slot as any).studio_id,
      studioName: (slot as any).studio?.name ?? "",
      studioAddress: (slot as any).studio?.address ?? "",
      startAt: (slot as any).start_at,
      durationMin: (slot as any).duration_min,
      capacity: (slot as any).capacity,
      bookedCount: ((slot as any).bookings ?? []).filter((b: any) => b.status !== "CANCELLED").length,
      price: (slot as any).price,
    });
  } catch (err) {
    console.error("Slot detail error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
