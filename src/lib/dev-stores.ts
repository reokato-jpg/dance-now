/**
 * In-memory dev stores — used when DATABASE_URL is a placeholder.
 * State persists only within the same Node.js process (dev server lifetime).
 */

export interface DevStudio {
  id: string;
  name: string;
  address: string;
  capacity: number;
  openAt: string;
  closeAt: string;
  lessonCount: number;
  createdAt: string;
}

export const devStudios: DevStudio[] = [
  {
    id: "dev-studio-a",
    name: "A",
    address: "渋谷区〇〇1-2-3 1F",
    capacity: 30,
    openAt: "10:00",
    closeAt: "22:00",
    lessonCount: 0,
    createdAt: new Date().toISOString(),
  },
];
