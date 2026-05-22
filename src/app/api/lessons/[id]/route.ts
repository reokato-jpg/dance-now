import { NextRequest, NextResponse } from "next/server";

function isDbAvailable() {
  const url = process.env.DATABASE_URL ?? "";
  return url !== "" && !url.includes("placeholder");
}

const DEV_LESSONS: Record<string, object> = {
  "dev-lesson-1": {
    id: "dev-lesson-1",
    title: "HIPHOPビギナーズクラス",
    genre: { slug: "hiphop", name: "HIPHOP" },
    level: "BEGINNER",
    instructor: {
      name: "YUKI TANAKA",
      bio: "NYで10年修行後帰国。初心者でも楽しく学べるクラスが人気。",
      photoUrl: null,
      rating: 4.8,
      reviewCount: 124,
      experience: 12,
    },
    studio: { name: "A", address: "東京都渋谷区道玄坂1-2-3 B1F", capacity: 20 },
    startAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    durationMin: 60,
    capacity: 15,
    bookedCount: 8,
    price: 3000,
  },
  "dev-lesson-2": {
    id: "dev-lesson-2",
    title: "K-POPアイドルダンス",
    genre: { slug: "kpop", name: "K-POP" },
    level: "INTERMEDIATE",
    instructor: {
      name: "MINA SATO",
      bio: "BTS・NewJeans振付を徹底分解。細かい動きまで丁寧に指導します。",
      photoUrl: null,
      rating: 4.9,
      reviewCount: 256,
      experience: 8,
    },
    studio: { name: "B", address: "東京都渋谷区宇田川町5-6-7 3F", capacity: 15 },
    startAt: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
    durationMin: 90,
    capacity: 12,
    bookedCount: 11,
    price: 4500,
  },
  "dev-lesson-3": {
    id: "dev-lesson-3",
    title: "JAZZ基礎〜応用",
    genre: { slug: "jazz", name: "JAZZ" },
    level: "ALL",
    instructor: {
      name: "KEIKO INOUE",
      bio: "Broadway style を軸に、柔軟性と表現力を高めます。",
      photoUrl: null,
      rating: 4.7,
      reviewCount: 89,
      experience: 15,
    },
    studio: { name: "A", address: "東京都渋谷区道玄坂1-2-3 B1F", capacity: 20 },
    startAt: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    durationMin: 60,
    capacity: 20,
    bookedCount: 5,
    price: 3500,
  },
  "dev-lesson-4": {
    id: "dev-lesson-4",
    title: "HOUSEダンス体験",
    genre: { slug: "house", name: "HOUSE" },
    level: "BEGINNER",
    instructor: {
      name: "RYO KIMURA",
      bio: "ハウスの基礎フットワークから丁寧に教えます。",
      photoUrl: null,
      rating: 4.6,
      reviewCount: 67,
      experience: 6,
    },
    studio: { name: "C", address: "東京都新宿区歌舞伎町2-3-4 2F", capacity: 12 },
    startAt: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    durationMin: 60,
    capacity: 10,
    bookedCount: 3,
    price: 3000,
  },
  "dev-lesson-5": {
    id: "dev-lesson-5",
    title: "バレエ入門クラス",
    genre: { slug: "ballet", name: "BALLET" },
    level: "BEGINNER",
    instructor: {
      name: "AKANE YOSHIDA",
      bio: "クラシックバレエの美しい所作と体幹を一緒に鍛えましょう。",
      photoUrl: null,
      rating: 4.9,
      reviewCount: 142,
      experience: 20,
    },
    studio: { name: "B", address: "東京都渋谷区宇田川町5-6-7 3F", capacity: 15 },
    startAt: new Date(new Date().setHours(19, 30, 0, 0)).toISOString(),
    durationMin: 75,
    capacity: 8,
    bookedCount: 7,
    price: 5000,
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDbAvailable()) {
    const lesson = DEV_LESSONS[id];
    if (!lesson) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json(lesson);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        genre: true,
        instructor: true,
        studio: true,
        _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
      },
    });

    if (!lesson) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      genre: { slug: lesson.genre.slug, name: lesson.genre.name },
      level: lesson.level,
      instructor: {
        name: lesson.instructor.name,
        bio: lesson.instructor.bio,
        photoUrl: lesson.instructor.photoUrl,
        rating: lesson.instructor.rating,
        reviewCount: lesson.instructor.reviewCount,
        experience: lesson.instructor.experience,
      },
      studio: {
        name: lesson.studio.name,
        address: lesson.studio.address,
        capacity: lesson.studio.capacity,
      },
      startAt: lesson.startAt.toISOString(),
      durationMin: lesson.durationMin,
      capacity: lesson.capacity,
      bookedCount: lesson._count.bookings,
      price: lesson.price,
    });
  } catch (err) {
    console.error("Lesson detail error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
