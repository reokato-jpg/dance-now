"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const MOCK_INSTRUCTORS = [
  { id: "1", name: "YUKI", genres: ["HIPHOP", "HOUSE"], experience: 8, lessonCount: 18, hourlyRate: 8000, rating: 4.8, reviewCount: 124 },
  { id: "2", name: "MINA", genres: ["K-POP", "GIRLS HIPHOP"], experience: 5, lessonCount: 22, hourlyRate: 7500, rating: 4.9, reviewCount: 98 },
  { id: "3", name: "SARA", genres: ["BALLET", "JAZZ"], experience: 10, lessonCount: 15, hourlyRate: 9000, rating: 4.7, reviewCount: 76 },
  { id: "4", name: "KEN", genres: ["HOUSE"], experience: 6, lessonCount: 12, hourlyRate: 7000, rating: 4.6, reviewCount: 52 },
  { id: "5", name: "RIE", genres: ["CONTEMPORARY", "BALLET"], experience: 7, lessonCount: 10, hourlyRate: 8500, rating: 4.8, reviewCount: 44 },
];

export default function AdminInstructorsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">インストラクター</h1>
          <p className="text-ink-400 text-sm">{MOCK_INSTRUCTORS.length}名</p>
        </div>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> 追加</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_INSTRUCTORS.map((inst) => (
          <div key={inst.id} className="card-dark p-5 hover:border-brand-purple transition-colors cursor-pointer">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 brand-gradient rounded-full flex items-center justify-center text-xl font-bold text-white shadow-glow-purple flex-shrink-0">
                {inst.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{inst.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {inst.genres.map((g) => (
                    <span key={g} className="text-xs bg-ink-700 text-ink-300 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center border-t border-ink-700 pt-4">
              <div>
                <p className="text-lg font-bold text-white">{inst.lessonCount}</p>
                <p className="text-xs text-ink-400">レッスン/月</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatPrice(inst.hourlyRate)}</p>
                <p className="text-xs text-ink-400">/ 時間</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                  <span className="text-lg font-bold text-white">{inst.rating}</span>
                </div>
                <p className="text-xs text-ink-400">({inst.reviewCount}件)</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
