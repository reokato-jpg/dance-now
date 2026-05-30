import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { devStudios } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}


export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    return NextResponse.json(devStudios);
  }

  try {
    const db = getAdminClient();

    const [{ data: studios }, { data: slotRows }] = await Promise.all([
      db.from("studios")
        .select("id, name, address, capacity, price_per_hour, open_at, close_at, created_at")
        .order("created_at", { ascending: true }),
      db.from("slots").select("studio_id"),
    ]);

    const slotCountMap = new Map<string, number>();
    for (const s of slotRows ?? []) {
      slotCountMap.set((s as any).studio_id, (slotCountMap.get((s as any).studio_id) ?? 0) + 1);
    }

    return NextResponse.json(
      (studios ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        capacity: s.capacity,
        pricePerHour: s.price_per_hour,
        openAt: s.open_at,
        closeAt: s.close_at,
        lessonCount: slotCountMap.get(s.id) ?? 0,
        createdAt: s.created_at,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, capacity, openAt, closeAt, pricePerHour } = body;

  if (!name?.trim() || !address?.trim() || !capacity) {
    return NextResponse.json({ error: "必須項目が未入力です" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    const newStudio = {
      id: `dev-studio-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      capacity: Number(capacity),
      pricePerHour: Number(pricePerHour) || 3000,
      openAt: openAt || "10:00",
      closeAt: closeAt || "22:00",
      lessonCount: 0,
      createdAt: new Date().toISOString(),
    };
    devStudios.push(newStudio);
    return NextResponse.json(newStudio, { status: 201 });
  }

  try {
    const db = getAdminClient();
    const { data: studio, error } = await db.from("studios")
      .insert({
        name: name.trim(),
        address: address.trim(),
        capacity: Number(capacity),
        price_per_hour: Number(pricePerHour) || 3000,
        open_at: openAt || "10:00",
        close_at: closeAt || "22:00",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: studio.id,
      name: studio.name,
      address: studio.address,
      capacity: studio.capacity,
      pricePerHour: studio.price_per_hour,
      openAt: studio.open_at,
      closeAt: studio.close_at,
      lessonCount: 0,
      createdAt: studio.created_at,
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "作成失敗" }, { status: 500 });
  }
}
