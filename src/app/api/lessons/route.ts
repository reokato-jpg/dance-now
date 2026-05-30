import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { devSlots } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    const db = getAdminClient();

    let query = db.from("slots")
      .select("id, studio_id, start_at, duration_min, capacity, price, studio:studios(name, address), bookings(status)")
      .gte("start_at", startOfDay(date).toISOString())
      .lte("start_at", endOfDay(date).toISOString())
      .order("start_at", { ascending: true });

    if (studioId) query = query.eq("studio_id", studioId);

    const { data: slots, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      (slots ?? []).map((s: any) => ({
        id: s.id,
        studioId: s.studio_id,
        studioName: s.studio?.name ?? "",
        studioAddress: s.studio?.address ?? "",
        startAt: s.start_at,
        durationMin: s.duration_min,
        capacity: s.capacity,
        bookedCount: (s.bookings ?? []).filter((b: any) => b.status !== "CANCELLED").length,
        price: s.price,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
