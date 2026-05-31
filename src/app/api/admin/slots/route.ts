import { NextRequest, NextResponse } from "next/server";
import { devSlots, devStudios } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    const db = getAdminClient();
    let query = db.from("slots")
      .select("id, studio_id, start_at, duration_min, capacity, price, studio:studios(name, address), bookings(status)")
      .order("start_at", { ascending: true });

    if (dateStr) {
      const dayStart = new Date(dateStr);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateStr);
      dayEnd.setHours(23, 59, 59, 999);
      query = query.gte("start_at", dayStart.toISOString()).lte("start_at", dayEnd.toISOString());
    }

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
    const db = getAdminClient();

    const { data: studio, error: studioErr } = await db.from("studios")
      .select("id, name, address")
      .eq("id", studioId)
      .single();

    if (studioErr || !studio) return NextResponse.json({ error: "スタジオが見つかりません" }, { status: 404 });

    const startAt = new Date(date);
    startAt.setHours(Number(startHour), Number(startMinute ?? 0), 0, 0);

    const { data: slot, error } = await db.from("slots")
      .insert({
        id: crypto.randomUUID(),
        studio_id: studioId,
        start_at: startAt.toISOString(),
        duration_min: Number(durationMin),
        capacity: Number(capacity),
        price: Number(price),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: slot.id,
      studioId: slot.studio_id,
      studioName: (studio as any).name,
      studioAddress: (studio as any).address,
      startAt: slot.start_at,
      durationMin: slot.duration_min,
      capacity: slot.capacity,
      bookedCount: 0,
      price: slot.price,
    }, { status: 201 });
  } catch (err) {
    console.error("Admin slots POST error:", err);
    return NextResponse.json({ error: "スロットの作成に失敗しました" }, { status: 500 });
  }
}
