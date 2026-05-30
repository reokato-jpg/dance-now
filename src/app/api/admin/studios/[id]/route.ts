import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { devStudios } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, address, capacity, openAt, closeAt, pricePerHour } = body;

  if (!name?.trim() || !address?.trim() || !capacity) {
    return NextResponse.json({ error: "必須項目が未入力です" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    const idx = devStudios.findIndex((s) => s.id === id);
    if (idx === -1) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    devStudios[idx] = {
      ...devStudios[idx],
      name: name.trim(),
      address: address.trim(),
      capacity: Number(capacity),
      pricePerHour: Number(pricePerHour) || devStudios[idx].pricePerHour,
      openAt: openAt || "10:00",
      closeAt: closeAt || "22:00",
    };
    return NextResponse.json(devStudios[idx]);
  }

  try {
    const db = getAdminClient();
    const { data: studio, error } = await db.from("studios")
      .update({
        name: name.trim(),
        address: address.trim(),
        capacity: Number(capacity),
        price_per_hour: Number(pricePerHour) || 3000,
        open_at: openAt || "10:00",
        close_at: closeAt || "22:00",
      })
      .eq("id", id)
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
      createdAt: studio.created_at,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!isDbAvailable()) {
    const idx = devStudios.findIndex((s) => s.id === id);
    if (idx !== -1) devStudios.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }

  try {
    const db = getAdminClient();
    const now = new Date().toISOString();

    const { count: futureCount } = await db.from("slots")
      .select("*", { count: "exact", head: true })
      .eq("studio_id", id)
      .gte("start_at", now);

    if ((futureCount ?? 0) > 0) {
      return NextResponse.json(
        { error: `今後のスロットが${futureCount}件あるため削除できません` },
        { status: 409 }
      );
    }

    const { error } = await db.from("studios").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "削除失敗" }, { status: 500 });
  }
}
