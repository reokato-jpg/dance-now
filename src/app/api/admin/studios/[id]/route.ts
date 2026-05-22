import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { devStudios } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

function requireAdmin() {
  const cookieStore = cookies();
  const session = (cookieStore as any).get("admin_session");
  return session?.value === "authenticated";
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, address, capacity, openAt, closeAt } = body;

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
      openAt: openAt || "10:00",
      closeAt: closeAt || "22:00",
    };
    return NextResponse.json(devStudios[idx]);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const studio = await prisma.studio.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address.trim(),
        capacity: Number(capacity),
        openAt: openAt || "10:00",
        closeAt: closeAt || "22:00",
      },
    });
    return NextResponse.json(studio);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!isDbAvailable()) {
    const idx = devStudios.findIndex((s) => s.id === id);
    if (idx !== -1) devStudios.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    // Block delete if future lessons exist
    const futureCount = await prisma.lesson.count({
      where: { studioId: id, startAt: { gte: new Date() } },
    });
    if (futureCount > 0) {
      return NextResponse.json(
        { error: `今後のレッスンが${futureCount}件あるため削除できません` },
        { status: 409 }
      );
    }
    await prisma.studio.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "削除失敗" }, { status: 500 });
  }
}
