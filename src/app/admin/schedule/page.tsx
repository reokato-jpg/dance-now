"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STUDIO_COLORS, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const HOURS = Array.from({ length: 13 }, (_, i) => 10 + i);

interface Slot {
  id: string;
  studioId: string;
  studioName: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  bookedCount: number;
  price: number;
}

interface Studio {
  id: string;
  name: string;
  pricePerHour: number;
}

function AddSlotModal({ studios, onClose, selectedDate }: {
  studios: Studio[];
  onClose: () => void;
  selectedDate: Date;
}) {
  const queryClient = useQueryClient();
  const [studioId, setStudioId] = useState(studios[0]?.id ?? "");
  const [date, setDate] = useState(format(selectedDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("10:00");
  const [durationMin, setDurationMin] = useState(60);
  const [capacity, setCapacity] = useState(1);
  const [price, setPrice] = useState(() => {
    const studio = studios[0];
    return studio ? Math.round(studio.pricePerHour * 60 / 60) : 3000;
  });

  const updatePriceFromDuration = (dur: number) => {
    const studio = studios.find((s) => s.id === studioId);
    if (studio) setPrice(Math.round(studio.pricePerHour * dur / 60));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const [h, m] = startTime.split(":").map(Number);
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          date,
          startHour: h,
          startMinute: m,
          durationMin,
          capacity,
          price,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "作成失敗");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      toast({ title: "スロット追加", description: "スロットを追加しました" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="card-dark w-full max-w-sm rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">スロット追加</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">スタジオ</label>
            <select
              value={studioId}
              onChange={(e) => {
                setStudioId(e.target.value);
                const s = studios.find((s) => s.id === e.target.value);
                if (s) setPrice(Math.round(s.pricePerHour * durationMin / 60));
              }}
              className="w-full bg-ink-700 text-white border border-ink-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-purple"
            >
              {studios.map((s) => (
                <option key={s.id} value={s.id}>Studio {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">日付</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">開始時刻</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">時間 (分)</label>
              <select
                value={durationMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDurationMin(v);
                  updatePriceFromDuration(v);
                }}
                className="w-full bg-ink-700 text-white border border-ink-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-purple"
              >
                {[30, 60, 90, 120, 180].map((d) => (
                  <option key={d} value={d}>{d}分</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">定員</label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">料金 (円)</label>
              <Input
                type="number"
                min={0}
                step={100}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose}>キャンセル</Button>
          <Button className="flex-1" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "追加中..." : "追加する"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: slots = [] } = useQuery<Slot[]>({
    queryKey: ["admin-slots"],
    queryFn: async () => {
      const res = await fetch("/api/admin/slots");
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const { data: studios = [] } = useQuery<Studio[]>({
    queryKey: ["studios"],
    queryFn: async () => {
      const res = await fetch("/api/admin/studios");
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "削除失敗");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      toast({ title: "削除", description: "スロットを削除しました" });
    },
    onError: (err: Error) => {
      toast({ title: "削除エラー", description: err.message, variant: "destructive" });
    },
  });

  const studioColorMap: Record<string, string> = {};
  studios.forEach((s, idx) => {
    studioColorMap[s.id] = STUDIO_COLORS[idx % STUDIO_COLORS.length] ?? "#6B46C1";
  });

  const slotsForDayHour = (day: Date, hour: number) =>
    slots.filter((s) => {
      const d = new Date(s.startAt);
      return (
        d.toDateString() === day.toDateString() &&
        d.getHours() === hour
      );
    });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">スロット管理</h1>
          <p className="text-ink-400 text-sm">スタジオの空き枠を管理する</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> スロット追加
        </Button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setWeekOffset((v) => v - 1)} className="p-2 card-dark rounded-lg hover:border-brand-purple text-ink-400 hover:text-white">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-white min-w-[140px] text-center">
          {format(weekStart, "M月d日", { locale: ja })} 〜 {format(addDays(weekStart, 6), "M月d日")}
        </span>
        <button onClick={() => setWeekOffset((v) => v + 1)} className="p-2 card-dark rounded-lg hover:border-brand-purple text-ink-400 hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Schedule grid */}
      <div className="card-dark overflow-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid border-b border-ink-700" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            <div className="p-2" />
            {weekDays.map((day) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={day.toISOString()} className={cn("p-2 text-center border-l border-ink-700", isToday && "bg-brand-purple/10")}>
                  <p className="text-xs text-ink-400">{format(day, "E", { locale: ja })}</p>
                  <p className={cn("text-sm font-bold", isToday ? "text-brand-purple" : "text-white")}>{format(day, "M/d")}</p>
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-ink-700/50"
              style={{ gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: "52px" }}
            >
              <div className="p-2 text-right text-xs text-ink-500 font-mono pt-2">{hour}:00</div>
              {weekDays.map((day) => {
                const daySlots = slotsForDayHour(day, hour);
                return (
                  <div key={day.toISOString()} className="border-l border-ink-700/50 p-1 space-y-1">
                    {daySlots.map((s) => {
                      const color = studioColorMap[s.studioId] ?? "#6B46C1";
                      return (
                        <div
                          key={s.id}
                          className="rounded p-1 text-xs group relative"
                          style={{ backgroundColor: color + "22", borderLeft: `3px solid ${color}` }}
                        >
                          <p className="font-bold text-white truncate">Studio {s.studioName}</p>
                          <p className="text-ink-400">{s.durationMin}分 · {formatPrice(s.price)}</p>
                          <p className={cn("text-xs", s.bookedCount >= s.capacity ? "text-danger" : "text-ink-500")}>
                            {s.bookedCount}/{s.capacity}枠
                          </p>
                          {s.bookedCount === 0 && (
                            <button
                              onClick={() => {
                                if (confirm("このスロットを削除しますか？")) deleteMutation.mutate(s.id);
                              }}
                              className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded bg-danger/80 text-white"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showAddModal && studios.length > 0 && (
        <AddSlotModal
          studios={studios}
          onClose={() => setShowAddModal(false)}
          selectedDate={selectedDate}
        />
      )}

      {showAddModal && studios.length === 0 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card-dark rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-white font-bold mb-2">スタジオが登録されていません</p>
            <p className="text-ink-400 text-sm mb-4">先にスタジオを追加してください</p>
            <Button onClick={() => setShowAddModal(false)}>閉じる</Button>
          </div>
        </div>
      )}
    </div>
  );
}
