import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { devCustomers } from "@/lib/dev-stores";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const segment = searchParams.get("segment") ?? "ALL";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));

  if (!isDbAvailable()) {
    let results = devCustomers.filter((c) => {
      if (segment !== "ALL" && c.tag !== segment) return false;
      if (search && !c.phone.includes(search) && !(c.email ?? "").includes(search)) return false;
      return true;
    });
    return NextResponse.json({
      customers: results.slice((page - 1) * limit, page * limit),
      total: results.length,
      counts: {
        ALL: devCustomers.length,
        VIP: devCustomers.filter((c) => c.tag === "VIP").length,
        FREQUENT: devCustomers.filter((c) => c.tag === "FREQUENT").length,
        REGULAR: devCustomers.filter((c) => c.tag === "REGULAR").length,
        NEW: devCustomers.filter((c) => c.tag === "NEW").length,
      },
    });
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    const where = {
      ...(segment !== "ALL" ? { tag: segment as any } : {}),
      ...(search
        ? {
            OR: [
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search } },
              { firstName: { contains: search } },
            ],
          }
        : {}),
    };

    const [customers, total, counts] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { totalSpent: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          phone: true,
          email: true,
          lastName: true,
          firstName: true,
          tag: true,
          totalBookings: true,
          totalSpent: true,
          lastBookedAt: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
      prisma.customer.groupBy({ by: ["tag"], _count: { id: true } }),
    ]);

    const countMap: Record<string, number> = { ALL: 0, VIP: 0, FREQUENT: 0, REGULAR: 0, NEW: 0 };
    for (const c of counts) {
      countMap[c.tag] = c._count.id;
      countMap.ALL += c._count.id;
    }

    return NextResponse.json({
      customers: customers.map((c) => ({
        ...c,
        lastBookedAt: c.lastBookedAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      counts: countMap,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}
