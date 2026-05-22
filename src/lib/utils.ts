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

export const GENRE_COLORS: Record<string, string> = {
  hiphop: "#6B46C1",
  jazz: "#EC4899",
  kpop: "#F59E0B",
  ballet: "#10B981",
  house: "#3B82F6",
  contemporary: "#8B5CF6",
};

export const GENRE_LABELS: Record<string, string> = {
  hiphop: "HIPHOP",
  jazz: "JAZZ",
  kpop: "K-POP",
  ballet: "BALLET",
  house: "HOUSE",
  contemporary: "CONTEMPORARY",
};

export const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "BEG.",
  INTERMEDIATE: "INT.",
  ADVANCED: "ADV.",
};
