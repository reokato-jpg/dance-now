"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { UserHeader } from "@/components/layout/user-header";
import { Badge } from "@/components/ui/badge";
import { GENRE_COLORS, LEVEL_LABELS, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const GENRES = ["ALL", "HIPHOP", "JAZZ", "K-POP", "BALLET", "HOUSE", "CONTEMPORARY"];
const GENRE_IDS: Record<string, string> = {
  "HIPHOP": "hiphop", "JAZZ": "jazz", "K-POP": "kpop",
  "BALLET": "ballet", "HOUSE": "house", "CONTEMPORARY": "contemporary",
};

interface Lesson {
  id: string;
  title: string;
  genre: { slug: string; name: string };
  level: string;
  instructor: { name: string };
  studio: { name: string };
  startAt: string;
  durationMin: number;
  capacity: number;
  bookedCount: number;
  price: number;
}

export default function LessonsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeGenre, setActiveGenre] = useState("ALL");

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["lessons", format(selectedDate, "yyyy-MM-dd"), activeGenre],
    queryFn: async () => {
      const params = new URLSearchParams({
        date: format(selectedDate, "yyyy-MM-dd"),
        genre: activeGenre === "ALL" ? "" : GENRE_IDS[activeGenre] || "",
      });
      const res = await fetch(`/api/lessons?${params}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const available = (l: Lesson) => l.capacity - l.bookedCount;

  return (
    <div className="min-h-screen bg-ink-900">
      <UserHeader />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-5">
          <h2 className="font-display text-4xl text-white tracking-wider">FIND YOUR LESSON</h2>
          <p className="text-ink-400 text-sm">好きなジャンルのレッスンを予約しよう</p>
        </div>

        {/* Genre filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-pill text-xs font-bold transition-all",
                activeGenre === g
                  ? "bg-brand-purple text-white shadow-glow-purple"
                  : "bg-ink-700 text-ink-400 hover:text-white"
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Week calendar */}
        <div className="card-dark p-4 mb-6">
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
                  <span className={cn("text-sm font-bold", isSelected ? "text-white" : "text-white")}>
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lesson list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-dark h-24 animate-pulse" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16 text-ink-500">
            <p className="text-4xl mb-3">🎵</p>
            <p className="font-bold">この日のレッスンはありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, i) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/lessons/${lesson.id}`}>
                  <div className="card-dark p-4 hover:border-brand-purple transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: GENRE_COLORS[lesson.genre.slug] || "#6B46C1" }}
                          />
                          <span className="text-xs font-bold text-ink-400 uppercase">
                            {lesson.genre.name} · {LEVEL_LABELS[lesson.level]}
                          </span>
                        </div>
                        <h3 className="font-bold text-white truncate">{lesson.title}</h3>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {format(new Date(lesson.startAt), "HH:mm", { locale: ja })} ·{" "}
                          <span className="text-ink-300">{lesson.instructor.name}</span> ·{" "}
                          Studio {lesson.studio.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-white">{formatPrice(lesson.price)}</p>
                        <p className={cn(
                          "text-xs mt-0.5",
                          available(lesson) <= 3 ? "text-warning font-bold" : "text-ink-400"
                        )}>
                          残{available(lesson)}席
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
