import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { devStudios } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbAvailable()) {
    return NextResponse.json(devStudios);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const studios = await prisma.studio.findMany({
      include: { _count: { select: { slots: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(
      studios.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        capacity: s.capacity,
        pricePerHour: s.pricePerHour,
        openAt: s.openAt,
        closeAt: s.closeAt,
        lessonCount: s._count.slots,
        createdAt: s.createdAt.toISOString(),
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
    const { prisma } = await import("@/lib/prisma");
    const studio = await prisma.studio.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        capacity: Number(capacity),
        pricePerHour: Number(pricePerHour) || 3000,
        openAt: openAt || "10:00",
        closeAt: closeAt || "22:00",
      },
    });
    return NextResponse.json({ ...studio, lessonCount: 0 }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "作成失敗" }, { status: 500 });
  }
}
