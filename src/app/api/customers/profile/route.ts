import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(req: NextRequest) {
  const { customerId, lastName, firstName, email, birthday, genres } = await req.json();

  if (!customerId) {
    return NextResponse.json({ error: "顧客IDが必要です" }, { status: 400 });
  }

  if (!isDbAvailable()) {
    return NextResponse.json({
      customer: {
        id: customerId,
        phone: customerId.replace("dev-", ""),
        email: email || null,
        lastName: lastName || null,
        firstName: firstName || null,
        birthday: birthday || null,
        genres: genres || [],
      },
    });
  }

  try {
    const db = getAdminClient();
    const { data: customer, error } = await db.from("customers")
      .update({
        last_name: lastName || null,
        first_name: firstName || null,
        email: email || null,
        birthday: birthday ? new Date(birthday).toISOString() : null,
        genres: genres || [],
      })
      .eq("id", customerId)
      .select("id, phone, email, last_name, first_name, birthday, genres")
      .single();

    if (error) throw error;

    return NextResponse.json({
      customer: {
        id: (customer as any).id,
        phone: (customer as any).phone,
        email: (customer as any).email,
        lastName: (customer as any).last_name,
        firstName: (customer as any).first_name,
        birthday: (customer as any).birthday ?? null,
        genres: (customer as any).genres,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "プロフィール更新に失敗しました" }, { status: 500 });
  }
}
