/**
 * In-memory dev stores — used when DATABASE_URL is a placeholder.
 */

export interface DevStudio {
  id: string;
  name: string;
  address: string;
  capacity: number;
  pricePerHour: number;
  openAt: string;
  closeAt: string;
  lessonCount: number;
  createdAt: string;
}

export interface DevSlot {
  id: string;
  studioId: string;
  studioName: string;
  studioAddress: string;
  startAt: string;  // ISO string
  durationMin: number;
  capacity: number;
  bookedCount: number;
  price: number;
}

export const devStudios: DevStudio[] = [
  {
    id: "dev-studio-a",
    name: "A",
    address: "渋谷区〇〇1-2-3 1F",
    capacity: 30,
    pricePerHour: 3000,
    openAt: "10:00",
    closeAt: "22:00",
    lessonCount: 0,
    createdAt: new Date().toISOString(),
  },
];

function makeSlot(id: string, studioId: string, studioName: string, hour: number, durationMin: number, price: number): DevSlot {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return {
    id,
    studioId,
    studioName,
    studioAddress: "渋谷区〇〇1-2-3 1F",
    startAt: d.toISOString(),
    durationMin,
    capacity: 1,
    bookedCount: 0,
    price,
  };
}

export const devSlots: DevSlot[] = [
  makeSlot("dev-slot-1", "dev-studio-a", "A", 10, 60, 3000),
  makeSlot("dev-slot-2", "dev-studio-a", "A", 12, 120, 6000),
  makeSlot("dev-slot-3", "dev-studio-a", "A", 15, 60, 3000),
  makeSlot("dev-slot-4", "dev-studio-a", "A", 17, 60, 3000),
  makeSlot("dev-slot-5", "dev-studio-a", "A", 19, 90, 4500),
];
