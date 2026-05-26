import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { devCoupons } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  if (!isDbAvailable()) {
    const idx = devCoupons.findIndex((c) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (typeof body.isActive === "boolean") devCoupons[idx].isActive = body.isActive;
    return NextResponse.json(devCoupons[idx]);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: body.isActive },
    });
    return NextResponse.json(coupon);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  if (!isDbAvailable()) {
    const idx = devCoupons.findIndex((c) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    devCoupons.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "削除失敗" }, { status: 500 });
  }
}
