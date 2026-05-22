import { PrismaClient } from "@prisma/client";
import { addDays, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Genres
  const genres = await Promise.all([
    prisma.genre.upsert({ where: { slug: "hiphop" }, update: {}, create: { name: "HIPHOP", slug: "hiphop", color: "#6B46C1" } }),
    prisma.genre.upsert({ where: { slug: "jazz" }, update: {}, create: { name: "JAZZ", slug: "jazz", color: "#EC4899" } }),
    prisma.genre.upsert({ where: { slug: "kpop" }, update: {}, create: { name: "K-POP", slug: "kpop", color: "#F59E0B" } }),
    prisma.genre.upsert({ where: { slug: "ballet" }, update: {}, create: { name: "BALLET", slug: "ballet", color: "#10B981" } }),
    prisma.genre.upsert({ where: { slug: "house" }, update: {}, create: { name: "HOUSE", slug: "house", color: "#3B82F6" } }),
    prisma.genre.upsert({ where: { slug: "contemporary" }, update: {}, create: { name: "CONTEMPORARY", slug: "contemporary", color: "#8B5CF6" } }),
  ]);
  console.log("✅ Genres created");

  // Studios
  const studioA = await prisma.studio.upsert({
    where: { id: "studio-a" },
    update: {},
    create: { id: "studio-a", name: "A", address: "渋谷区渋谷12-3 4F", capacity: 12, openAt: "10:00", closeAt: "22:00" },
  });
  const studioB = await prisma.studio.upsert({
    where: { id: "studio-b" },
    update: {},
    create: { id: "studio-b", name: "B", address: "渋谷区渋谷12-3 5F", capacity: 12, openAt: "12:00", closeAt: "22:00" },
  });
  console.log("✅ Studios created");

  // Instructors
  const yuki = await prisma.instructor.upsert({
    where: { id: "inst-yuki" },
    update: {},
    create: {
      id: "inst-yuki", name: "YUKI",
      bio: "HIPHOPを中心に活動する実力派インストラクター。分かりやすいレッスンが人気。",
      hourlyRate: 8000, rating: 4.8, reviewCount: 124, experience: 8,
    },
  });
  const mina = await prisma.instructor.upsert({
    where: { id: "inst-mina" },
    update: {},
    create: {
      id: "inst-mina", name: "MINA",
      bio: "K-POP専門インストラクター。最新K-POPダンスを楽しく丁寧に指導します。",
      hourlyRate: 7500, rating: 4.9, reviewCount: 98, experience: 5,
    },
  });
  const sara = await prisma.instructor.upsert({
    where: { id: "inst-sara" },
    update: {},
    create: {
      id: "inst-sara", name: "SARA",
      bio: "クラシックバレエからジャズまで幅広く対応。10年のキャリアを持つベテラン。",
      hourlyRate: 9000, rating: 4.7, reviewCount: 76, experience: 10,
    },
  });
  console.log("✅ Instructors created");

  // Coupons
  await prisma.coupon.upsert({
    where: { code: "DANCE10" },
    update: {},
    create: { code: "DANCE10", discountType: "PERCENT", discountValue: 10, validUntil: new Date("2026-06-30"), usageLimit: 500, targetGenres: [], isActive: true },
  });
  await prisma.coupon.upsert({
    where: { code: "FRIEND500" },
    update: {},
    create: { code: "FRIEND500", discountType: "FIXED", discountValue: 500, validUntil: new Date("2026-05-31"), targetGenres: [], isActive: true },
  });
  await prisma.coupon.upsert({
    where: { code: "BIRTHDAY1000" },
    update: {},
    create: { code: "BIRTHDAY1000", discountType: "FIXED", discountValue: 1000, targetGenres: [], isActive: true },
  });
  console.log("✅ Coupons created");

  // Lessons (next 7 days)
  const hiphopGenre = genres.find((g) => g.slug === "hiphop")!;
  const kpopGenre = genres.find((g) => g.slug === "kpop")!;
  const jazzGenre = genres.find((g) => g.slug === "jazz")!;
  const balletGenre = genres.find((g) => g.slug === "ballet")!;

  for (let i = 0; i < 7; i++) {
    const baseDate = addDays(new Date(), i);
    const lessons = [
      {
        id: `lesson-hiphop-${i}`,
        title: "HIPHOP BASIC",
        genreId: hiphopGenre.id, level: "INTERMEDIATE" as const,
        instructorId: yuki.id, studioId: studioA.id,
        startAt: setMinutes(setHours(baseDate, 19), 0),
        price: 3500, capacity: 12,
      },
      {
        id: `lesson-kpop-${i}`,
        title: "K-POP DANCE",
        genreId: kpopGenre.id, level: "BEGINNER" as const,
        instructorId: mina.id, studioId: studioB.id,
        startAt: setMinutes(setHours(baseDate, 20), 30),
        price: 3500, capacity: 12,
      },
    ];

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: { startAt: lesson.startAt },
        create: lesson,
      });
    }
  }
  console.log("✅ Lessons created");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
