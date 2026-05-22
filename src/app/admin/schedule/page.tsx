"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GENRE_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 13 }, (_, i) => 10 + i);
const STUDIOS = ["A", "B", "C"];

const MOCK_SCHEDULE: Record<string, { title: string; genre: string; instructor: string; studio: string; hour: number; duration: number }[]> = {
  "2026-05-18": [
    { title: "BALLET BASIC", genre: "ballet", instructor: "SARA", studio: "A", hour: 10, duration: 1 },
    { title: "HOUSE BASIC", genre: "house", instructor: "KEN", studio: "B", hour: 14, duration: 1 },
    { title: "CONTEMPORARY", genre: "contemporary", instructor: "RIE", studio: "C", hour: 16, duration: 1.5 },
    { title: "HIPHOP BASIC", genre: "hiphop", instructor: "YUKI", studio: "A", hour: 18, duration: 1 },
    { title: "K-POP DANCE", genre: "kpop", instructor: "MINA", studio: "B", hour: 20, duration: 1 },
  ],
};

export default function AdminSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedStudio, setSelectedStudio] = useState("ALL");

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">スケジュール</h1>
          <p className="text-ink-400 text-sm">週次レッスンスケジュール</p>
        </div>
        <Button size="sm" className="gap-2">+ レッスン追加</Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset((v) => v - 1)} className="p-2 card-dark rounded-lg hover:border-brand-purple text-ink-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-white min-w-[120px] text-center">
            {format(weekStart, "M月d日", { locale: ja })} 〜
          </span>
          <button onClick={() => setWeekOffset((v) => v + 1)} className="p-2 card-dark rounded-lg hover:border-brand-purple text-ink-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-ink-400" />
          <div className="flex gap-1">
            {["ALL", ...STUDIOS].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStudio(s)}
                className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-colors", selectedStudio === s ? "bg-brand-purple text-white" : "text-ink-400 hover:text-white bg-ink-700")}
              >
                {s === "ALL" ? "全スタジオ" : `Studio ${s}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule grid */}
      <div className="card-dark overflow-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid border-b border-ink-700" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            <div className="p-2" />
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="p-2 text-center border-l border-ink-700">
                <p className="text-xs text-ink-400">{format(day, "E", { locale: ja })}</p>
                <p className="text-sm font-bold text-white">{format(day, "M/d")}</p>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-ink-700/50"
              style={{ gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: "56px" }}
            >
              <div className="p-2 text-right text-xs text-ink-500 font-mono pt-2">{`${hour}:00`}</div>
              {weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayLessons = (MOCK_SCHEDULE[dateKey] || []).filter((l) =>
                  l.hour === hour && (selectedStudio === "ALL" || l.studio === selectedStudio)
                );
                return (
                  <div key={day.toISOString()} className="border-l border-ink-700/50 p-1 space-y-1">
                    {dayLessons.map((l) => (
                      <div
                        key={l.title}
                        className="rounded p-1 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: (GENRE_COLORS[l.genre] || "#6B46C1") + "33", borderLeft: `3px solid ${GENRE_COLORS[l.genre]}` }}
                      >
                        <p className="font-bold text-white truncate">{l.title}</p>
                        <p className="text-ink-400 truncate">{l.instructor} · {l.studio}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
