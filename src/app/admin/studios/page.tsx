"use client";

import { Plus, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_STUDIOS = [
  { id: "A", name: "Studio A", address: "渋谷区〇〇12-3 4F", capacity: 80, openAt: "10:00", closeAt: "22:00", lessonCount: 12, occupancy: 88 },
  { id: "B", name: "Studio B", address: "渋谷区〇〇12-3 5F", capacity: 60, openAt: "12:00", closeAt: "22:00", lessonCount: 10, occupancy: 76 },
  { id: "C", name: "Studio C", address: "渋谷区〇〇6-1-2 B1", capacity: 100, openAt: "10:00", closeAt: "23:00", lessonCount: 16, occupancy: 82 },
];

export default function AdminStudiosPage() {
  const avgOccupancy = Math.round(MOCK_STUDIOS.reduce((s, st) => s + st.occupancy, 0) / MOCK_STUDIOS.length);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">スタジオ</h1>
          <p className="text-ink-400 text-sm">{MOCK_STUDIOS.length}スタジオ · 平均稼働率 {avgOccupancy}%</p>
        </div>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> 追加</Button>
      </div>

      <div className="space-y-4">
        {MOCK_STUDIOS.map((studio) => (
          <div key={studio.id} className="card-dark p-5 hover:border-brand-purple transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 brand-gradient rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-glow-purple">
                  {studio.id}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{studio.name}</h3>
                  <div className="flex items-center gap-1 text-ink-400 text-sm">
                    <MapPin className="w-3.5 h-3.5" />{studio.address}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: studio.occupancy >= 85 ? "#10B981" : studio.occupancy >= 70 ? "#F59E0B" : "#EF4444" }}>
                  {studio.occupancy}%
                </p>
                <p className="text-xs text-ink-400">稼働率</p>
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="h-2 bg-ink-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${studio.occupancy}%`,
                  background: studio.occupancy >= 85 ? "#10B981" : "linear-gradient(135deg, #6B46C1, #EC4899)",
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-ink-400">
                <Users className="w-4 h-4" />
                <span>定員 {studio.capacity}名</span>
              </div>
              <div className="flex items-center gap-2 text-ink-400">
                <Clock className="w-4 h-4" />
                <span>{studio.openAt}〜{studio.closeAt}</span>
              </div>
              <div className="text-right text-ink-400">
                <span>レッスン {studio.lessonCount}本/週</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
