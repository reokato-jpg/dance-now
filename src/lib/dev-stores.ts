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
    id: "dev-studio-myself",
    name: "ダンススクールマイセルフ",
    address: "尼崎市七松町2-6-6",
    capacity: 20,
    pricePerHour: 3000,
    openAt: "08:00",
    closeAt: "23:00",
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
    studioAddress: "尼崎市七松町2-6-6",
    startAt: d.toISOString(),
    durationMin,
    capacity: 1,
    bookedCount: 0,
    price,
  };
}

export const devSlots: DevSlot[] = [
  makeSlot("dev-slot-1", "dev-studio-myself", "マイセルフ", 10, 60, 3000),
  makeSlot("dev-slot-2", "dev-studio-myself", "マイセルフ", 12, 120, 6000),
  makeSlot("dev-slot-3", "dev-studio-myself", "マイセルフ", 15, 60, 3000),
  makeSlot("dev-slot-4", "dev-studio-myself", "マイセルフ", 17, 60, 3000),
  makeSlot("dev-slot-5", "dev-studio-myself", "マイセルフ", 19, 90, 4500),
];

// ─── Dev Coupons ──────────────────────────────────────────
export interface DevCoupon {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  validUntil: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export const devCoupons: DevCoupon[] = [
  {
    id: "dev-coupon-1",
    code: "WELCOME10",
    discountType: "PERCENT",
    discountValue: 10,
    validUntil: "2026-12-31T23:59:59.000Z",
    usageLimit: 100,
    usageCount: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "dev-coupon-2",
    code: "FRIEND500",
    discountType: "FIXED",
    discountValue: 500,
    validUntil: null,
    usageLimit: null,
    usageCount: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// ─── Dev Settings ─────────────────────────────────────────
export const devSettings: Record<string, string> = {
  coupon_enabled: "true",
};

// ─── Dev Customers ────────────────────────────────────────
export interface DevCustomer {
  id: string;
  phone: string;
  email: string | null;
  lastName: string | null;
  firstName: string | null;
  tag: "NEW" | "REGULAR" | "FREQUENT" | "VIP";
  totalBookings: number;
  totalSpent: number;
  lastBookedAt: string | null;
  createdAt: string;
}

export const devCustomers: DevCustomer[] = [
  {
    id: "dev-customer-1",
    phone: "090-0000-0001",
    email: "test@example.com",
    lastName: "山田",
    firstName: "太郎",
    tag: "NEW",
    totalBookings: 1,
    totalSpent: 3000,
    lastBookedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];
