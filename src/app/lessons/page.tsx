"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import Link from "next/link";
import { UserHeader } from "@/components/layout/user-header";
import { formatPrice, formatTimeRange, STUDIO_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Slot {
  id: string;
  studioId: string;
  studioName: string;
  studioAddress: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  bookedCount: number;
  price: number;
}

export default function LessonsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStudio, setActiveStudio] = useState("ALL");

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: slots = [], isLoading } = useQuery<Slot[]>({
    queryKey: ["slots", format(selectedDate, "yyyy-MM-dd"), activeStudio],
    queryFn: async () => {
      const params = new URLSearchParams({ date: format(selectedDate, "yyyy-MM-dd") });
      if (activeStudio !== "ALL") params.set("studioId", activeStudio);
      const res = await fetch(`/api/lessons?${params}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  // Derive unique studios from slots for filter tabs
  const studioOptions = Array.from(
    new Map(slots.map((s) => [s.studioId, { id: s.studioId, name: s.studioName }])).values()
  );

  const available = (s: Slot) => s.capacity - s.bookedCount;

  return (
    <div className="min-h-screen bg-ink-900">
      <UserHeader />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-5">
          <h2 className="font-display text-4xl text-white tracking-wider">BOOK A STUDIO</h2>
          <p className="text-ink-400 text-sm">スタジオを選んで時間を予約しよう</p>
        </div>

        {/* Week calendar */}
        <div className="card-dark p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setWeekOffset((v) => v - 1)} className="p-1 text-ink-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-white">
              {format(weekStart, "yyyy年M月", { locale: ja })}
            </span>
            <button onClick={() => setWeekOffset((v) => v + 1)} className="p-1 text-ink-400 hover:text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center py-2 rounded-lg transition-all",
                    isSelected ? "brand-gradient text-white shadow-glow-purple" : "hover:bg-ink-700",
                    isToday && !isSelected ? "border border-brand-purple" : ""
                  )}
                >
                  <span className="text-xs text-ink-400">{format(day, "E", { locale: ja })}</span>
                  <span className="text-sm font-bold text-white">{format(day, "d")}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio filter (shown only if multiple studios have slots) */}
        {studioOptions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
              onClick={() => setActiveStudio("ALL")}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-pill text-xs font-bold transition-all flex items-center gap-1.5",
                activeStudio === "ALL"
                  ? "bg-brand-purple text-white shadow-glow-purple"
                  : "bg-ink-700 text-ink-400 hover:text-white"
              )}
            >
              <Building2 className="w-3 h-3" /> すべて
            </button>
            {studioOptions.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveStudio(s.id)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-pill text-xs font-bold transition-all",
                  activeStudio === s.id
                    ? "bg-brand-purple text-white shadow-glow-purple"
                    : "bg-ink-700 text-ink-400 hover:text-white"
                )}
              >
                Studio {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Slot list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-dark h-20 animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-16 text-ink-500">
            <p className="text-4xl mb-3">🏢</p>
            <p className="font-bold">この日の空き枠はありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, i) => {
              const colorIdx = studioOptions.findIndex((s) => s.id === slot.studioId);
              const color = STUDIO_COLORS[colorIdx % STUDIO_COLORS.length] ?? "#6B46C1";
              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/lessons/${slot.id}`}>
                    <div className="card-dark p-4 hover:border-brand-purple transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-bold text-ink-400 uppercase">
                              Studio {slot.studioName}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-white">
                            {formatTimeRange(slot.startAt, slot.durationMin)}
                          </p>
                          <p className="text-xs text-ink-400 mt-0.5">{slot.durationMin}分</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-white">{formatPrice(slot.price)}</p>
                          <p className={cn(
                            "text-xs mt-0.5",
                            available(slot) <= 0 ? "text-danger font-bold" : available(slot) <= 3 ? "text-warning font-bold" : "text-ink-400"
                          )}>
                            {available(slot) <= 0 ? "満員" : `残${available(slot)}枠`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
