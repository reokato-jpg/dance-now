"use client";

import { create } from "zustand";

interface BookingLesson {
  id: string;
  studioName: string;
  startAt: string;
  durationMin: number;
  price: number;
}

interface AppliedCoupon {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  discountAmount: number;
}

interface BookingState {
  lesson: BookingLesson | null;
  coupon: AppliedCoupon | null;
  finalAmount: number;
  setLesson: (lesson: BookingLesson) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>()((set, get) => ({
  lesson: null,
  coupon: null,
  finalAmount: 0,
  setLesson: (lesson) => set({ lesson, finalAmount: lesson.price, coupon: null }),
  setCoupon: (coupon) => {
    const lesson = get().lesson;
    if (!lesson) return;
    if (!coupon) {
      set({ coupon: null, finalAmount: lesson.price });
      return;
    }
    set({ coupon, finalAmount: lesson.price - coupon.discountAmount });
  },
  clearBooking: () => set({ lesson: null, coupon: null, finalAmount: 0 }),
}));
