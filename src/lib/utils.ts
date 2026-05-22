import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(date: Date | string, fmt = "M/d(E) HH:mm"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: ja });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "yyyy/MM/dd HH:mm");
}

export function generateReservationNo(): string {
  const now = new Date();
  const yyyymm = format(now, "yyyyMM");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `DN-${yyyymm}-${rand}`;
}

export function formatTimeRange(startAt: string, durationMin: number): string {
  const start = parseISO(startAt);
  const end = new Date(start.getTime() + durationMin * 60000);
  return `${format(start, "HH:mm")} 〜 ${format(end, "HH:mm")}`;
}

export const STUDIO_COLORS: string[] = [
  "#6B46C1", "#EC4899", "#3B82F6", "#10B981", "#F59E0B",
];
