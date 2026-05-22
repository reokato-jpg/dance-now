import { NextRequest, NextResponse } from "next/server";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

const DEV_LESSON_DATA: Record<string, object> = {
  "dev-lesson-1": {
    title: "HIPHOPビギナーズクラス",
    startAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    durationMin: 60,
    instructor: { name: "YUKI TANAKA" },
    studio: { name: "A" },
    genre: { slug: "hiphop", name: "HIPHOP" },
  },
  "dev-lesson-2": {
    title: "K-POPアイドルダンス",
    startAt: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
    durationMin: 90,
    instructor: { name: "MINA SATO" },
    studio: { name: "B" },
    genre: { slug: "kpop", name: "K-POP" },
  },
  "dev-lesson-3": {
    title: "JAZZ基礎〜応用",
    startAt: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    durationMin: 60,
    instructor: { name: "KEIKO INOUE" },
    studio: { name: "A" },
    genre: { slug: "jazz", name: "JAZZ" },
  },
  "dev-lesson-4": {
    title: "HOUSEダンス体験",
    startAt: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    durationMin: 60,
    instructor: { name: "RYO KIMURA" },
    studio: { name: "C" },
    genre: { slug: "house", name: "HOUSE" },
  },
  "dev-lesson-5": {
    title: "バレエ入門クラス",
    startAt: new Date(new Date().setHours(19, 30, 0, 0)).toISOString(),
    durationMin: 75,
    instructor: { name: "AKANE YOSHIDA" },
    studio: { name: "B" },
    genre: { slug: "ballet", name: "BALLET" },
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDbAvailable()) {
    if (!id.startsWith("dev-booking::")) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    const lessonId = id.split("::")[1] ?? "dev-lesson-1";
    const lessonData = DEV_LESSON_DATA[lessonId] ?? DEV_LESSON_DATA["dev-lesson-1"];
    const lesson = lessonData as any;
    return NextResponse.json({
      id,
      reservationNo: `DN-DEV-${id.split("::")[2]?.slice(-4) ?? "0000"}`,
      status: "CONFIRMED",
      amount: 3000,
      discountAmount: 0,
      lesson,
    });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        lesson: { include: { instructor: true, studio: true, genre: true } },
        payment: true,
        customer: true,
      },
    });

    if (!booking) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (err) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
