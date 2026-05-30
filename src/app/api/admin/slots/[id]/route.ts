import { NextRequest, NextResponse } from "next/server";
import { devSlots } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    const db = getAdminClient();

    const { count: hasBookings } = await db.from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("slot_id", id)
      .neq("status", "CANCELLED");

    if ((hasBookings ?? 0) > 0) {
      return NextResponse.json({ error: "予約があるスロットは削除できません" }, { status: 400 });
    }

    const { error } = await db.from("slots").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin slot DELETE error:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
