import { PrismaClient } from "@prisma/client";
import { addDays, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Studios
  const studioA = await prisma.studio.upsert({
    where: { id: "studio-a" },
    update: {},
    create: { id: "studio-a", name: "A", address: "渋谷区渋谷12-3 4F", capacity: 12, pricePerHour: 3000, openAt: "10:00", closeAt: "22:00" },
  });
  const studioB = await prisma.studio.upsert({
    where: { id: "studio-b" },
    update: {},
    create: { id: "studio-b", name: "B", address: "渋谷区渋谷12-3 5F", capacity: 12, pricePerHour: 3500, openAt: "12:00", closeAt: "22:00" },
  });
  console.log("Studios created");

  // Coupons
  await prisma.coupon.upsert({
    where: { code: "DANCE10" },
    update: {},
    create: { code: "DANCE10", discountType: "PERCENT", discountValue: 10, validUntil: new Date("2026-06-30"), usageLimit: 500, isActive: true },
  });
  await prisma.coupon.upsert({
    where: { code: "FRIEND500" },
    update: {},
    create: { code: "FRIEND500", discountType: "FIXED", discountValue: 500, validUntil: new Date("2026-05-31"), isActive: true },
  });
  await prisma.coupon.upsert({
    where: { code: "BIRTHDAY1000" },
    update: {},
    create: { code: "BIRTHDAY1000", discountType: "FIXED", discountValue: 1000, isActive: true },
  });
  console.log("Coupons created");

  // Slots (next 7 days, morning and evening blocks in each studio)
  for (let i = 0; i < 7; i++) {
    const baseDate = addDays(new Date(), i);

    const slots = [
      {
        id: `slot-a-morning-${i}`,
        studioId: studioA.id,
        startAt: setMinutes(setHours(baseDate, 10), 0),
        durationMin: 60,
        price: 3000,
        capacity: 1,
      },
      {
        id: `slot-a-evening-${i}`,
        studioId: studioA.id,
        startAt: setMinutes(setHours(baseDate, 19), 0),
        durationMin: 60,
        price: 3000,
        capacity: 1,
      },
      {
        id: `slot-b-morning-${i}`,
        studioId: studioB.id,
        startAt: setMinutes(setHours(baseDate, 12), 0),
        durationMin: 60,
        price: 3500,
        capacity: 1,
      },
      {
        id: `slot-b-evening-${i}`,
        studioId: studioB.id,
        startAt: setMinutes(setHours(baseDate, 20), 30),
        durationMin: 60,
        price: 3500,
        capacity: 1,
      },
    ];

    for (const slot of slots) {
      await prisma.slot.upsert({
        where: { id: slot.id },
        update: { startAt: slot.startAt },
        create: slot,
      });
    }
  }
  console.log("Slots created");

  console.log("Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
