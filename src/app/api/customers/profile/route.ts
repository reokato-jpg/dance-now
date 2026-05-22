import { NextRequest, NextResponse } from "next/server";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
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
    const { prisma } = await import("@/lib/prisma");
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        lastName,
        firstName,
        email: email || null,
        birthday: birthday ? new Date(birthday) : null,
        genres,
      },
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        phone: customer.phone,
        email: customer.email,
        lastName: customer.lastName,
        firstName: customer.firstName,
        birthday: customer.birthday?.toISOString(),
        genres: customer.genres,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "プロフィール更新に失敗しました" }, { status: 500 });
  }
}
