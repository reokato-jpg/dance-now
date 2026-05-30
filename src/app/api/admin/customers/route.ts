import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { devCustomers } from "@/lib/dev-stores";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    const db = getAdminClient();

    // Build main query with count
    let query = db.from("customers")
      .select("id, phone, email, last_name, first_name, tag, total_bookings, total_spent, last_booked_at, created_at", { count: "exact" })
      .order("total_spent", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (segment !== "ALL") query = query.eq("tag", segment);
    if (search) {
      query = query.or(
        `phone.ilike.%${search}%,email.ilike.%${search}%,last_name.ilike.%${search}%,first_name.ilike.%${search}%`
      );
    }

    const { data: customers, count: total } = await query;

    // Tag counts (no search/segment filter — same as original groupBy)
    const [
      { count: allCount },
      { count: vipCount },
      { count: frequentCount },
      { count: regularCount },
      { count: newCount },
    ] = await Promise.all([
      db.from("customers").select("*", { count: "exact", head: true }),
      db.from("customers").select("*", { count: "exact", head: true }).eq("tag", "VIP"),
      db.from("customers").select("*", { count: "exact", head: true }).eq("tag", "FREQUENT"),
      db.from("customers").select("*", { count: "exact", head: true }).eq("tag", "REGULAR"),
      db.from("customers").select("*", { count: "exact", head: true }).eq("tag", "NEW"),
    ]);

    return NextResponse.json({
      customers: (customers ?? []).map((c: any) => ({
        id: c.id,
        phone: c.phone,
        email: c.email,
        lastName: c.last_name,
        firstName: c.first_name,
        tag: c.tag,
        totalBookings: c.total_bookings,
        totalSpent: c.total_spent,
        lastBookedAt: c.last_booked_at ?? null,
        createdAt: c.created_at,
      })),
      total: total ?? 0,
      counts: {
        ALL: allCount ?? 0,
        VIP: vipCount ?? 0,
        FREQUENT: frequentCount ?? 0,
        REGULAR: regularCount ?? 0,
        NEW: newCount ?? 0,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}
