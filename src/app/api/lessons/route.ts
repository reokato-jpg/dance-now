import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

const DEV_LESSONS = [
  {
    id: "dev-lesson-1",
    title: "HIPHOPビギナーズクラス",
    genre: { slug: "hiphop", name: "HIPHOP" },
    level: "BEGINNER",
    instructor: { name: "YUKI TANAKA" },
    studio: { name: "A" },
    startAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    durationMin: 60,
    capacity: 15,
    bookedCount: 8,
    price: 3000,
  },
  {
    id: "dev-lesson-2",
    title: "K-POPアイドルダンス",
    genre: { slug: "kpop", name: "K-POP" },
    level: "INTERMEDIATE",
    instructor: { name: "MINA SATO" },
    studio: { name: "B" },
    startAt: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
    durationMin: 90,
    capacity: 12,
    bookedCount: 11,
    price: 4500,
  },
  {
    id: "dev-lesson-3",
    title: "JAZZ基礎〜応用",
    genre: { slug: "jazz", name: "JAZZ" },
    level: "ALL",
    instructor: { name: "KEIKO INOUE" },
    studio: { name: "A" },
    startAt: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    durationMin: 60,
    capacity: 20,
    bookedCount: 5,
    price: 3500,
  },
  {
    id: "dev-lesson-4",
    title: "HOUSEダンス体験",
    genre: { slug: "house", name: "HOUSE" },
    level: "BEGINNER",
    instructor: { name: "RYO KIMURA" },
    studio: { name: "C" },
    startAt: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    durationMin: 60,
    capacity: 10,
    bookedCount: 3,
    price: 3000,
  },
  {
    id: "dev-lesson-5",
    title: "バレエ入門クラス",
    genre: { slug: "ballet", name: "BALLET" },
    level: "BEGINNER",
    instructor: { name: "AKANE YOSHIDA" },
    studio: { name: "B" },
    startAt: new Date(new Date().setHours(19, 30, 0, 0)).toISOString(),
    durationMin: 75,
    capacity: 8,
    bookedCount: 7,
    price: 5000,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const genre = searchParams.get("genre") || "";

  const date = dateStr ? new Date(dateStr) : new Date();

  if (!isDbAvailable()) {
    const filtered = DEV_LESSONS.filter((l) => {
      const lessonDate = new Date(l.startAt);
      const inRange = lessonDate >= startOfDay(date) && lessonDate <= endOfDay(date);
      const matchGenre = !genre || l.genre.slug === genre;
      return inRange && matchGenre;
    });
    return NextResponse.json(filtered);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const lessons = await prisma.lesson.findMany({
      where: {
        startAt: { gte: startOfDay(date), lte: endOfDay(date) },
        ...(genre ? { genre: { slug: genre } } : {}),
      },
      include: {
        genre: true,
        instructor: true,
        studio: true,
        _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json(
      lessons.map((l) => ({
        id: l.id,
        title: l.title,
        genre: { slug: l.genre.slug, name: l.genre.name },
        level: l.level,
        instructor: { name: l.instructor.name },
        studio: { name: l.studio.name },
        startAt: l.startAt.toISOString(),
        durationMin: l.durationMin,
        capacity: l.capacity,
        bookedCount: l._count.bookings,
        price: l.price,
      }))
    );
  } catch (err) {
    console.error("Lessons fetch error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
