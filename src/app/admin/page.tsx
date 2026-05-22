"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { TrendingUp, TrendingDown, Users, BookOpen, BarChart2, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatPrice } from "@/lib/utils";

const MOCK_KPI = {
  todaySales: 84500,
  todaySalesGrowth: 12,
  bookings: 27,
  cancelRate: 4.2,
  cancelRateChange: -0.8,
  occupancy: 82,
  weeklyData: [
    { day: "月", sales: 72000 }, { day: "火", sales: 84500 }, { day: "水", sales: 91000 },
    { day: "木", sales: 68000 }, { day: "金", sales: 95000 }, { day: "土", sales: 110000 }, { day: "日", sales: 88000 },
  ],
  topGenres: [
    { name: "HIPHOP", pct: 32 }, { name: "K-POP", pct: 24 }, { name: "JAZZ", pct: 18 },
    { name: "BALLET", pct: 14 }, { name: "HOUSE", pct: 12 },
  ],
  todayLessons: [
    { title: "HIPHOP BASIC", instructor: "YUKI", studio: "A", booked: 9, capacity: 12, time: "19:00" },
    { title: "K-POP DANCE", instructor: "MINA", studio: "B", booked: 7, capacity: 12, time: "20:30" },
    { title: "JAZZ ADVANCE", instructor: "SARA", studio: "A", booked: 11, capacity: 12, time: "21:30" },
  ],
};

export default function AdminDashboard() {
  const today = format(new Date(), "yyyy年M月d日(E)", { locale: ja });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
          <p className="text-ink-400 text-sm">{today}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <KpiCard
            label="今日の売上"
            value={formatPrice(MOCK_KPI.todaySales)}
            change={`+${MOCK_KPI.todaySalesGrowth}% vs 先週`}
            positive
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <KpiCard
            label="予約数"
            value={`${MOCK_KPI.bookings}件`}
            change="今日"
            positive
            icon={<BookOpen className="w-5 h-5" />}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KpiCard
            label="キャンセル率"
            value={`${MOCK_KPI.cancelRate}%`}
            change={`${MOCK_KPI.cancelRateChange}pt vs 先週`}
            positive
            icon={<Percent className="w-5 h-5" />}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <KpiCard
            label="稼働率"
            value={`${MOCK_KPI.occupancy}%`}
            change="今週平均"
            positive
            icon={<BarChart2 className="w-5 h-5" />}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="lg:col-span-2 card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">7日間の売上</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_KPI.weeklyData}>
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#1A1035", border: "1px solid #3D2B6B", borderRadius: 8, color: "#fff" }}
                formatter={(v: number) => [formatPrice(v), "売上"]}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                {MOCK_KPI.weeklyData.map((_, i) => (
                  <Cell key={i} fill={i === 1 ? "#6B46C1" : "#3D2B6B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Genre breakdown */}
        <div className="card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">ジャンル別 TOP 5</h3>
          <div className="space-y-3">
            {MOCK_KPI.topGenres.map((g) => (
              <div key={g.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white font-medium">{g.name}</span>
                  <span className="text-ink-400">{g.pct}%</span>
                </div>
                <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                  <div className="h-full brand-gradient rounded-full" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's lessons */}
      <div className="card-dark p-5">
        <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">本日のレッスン</h3>
        <div className="space-y-3">
          {MOCK_KPI.todayLessons.map((l) => (
            <div key={l.title} className="flex items-center justify-between p-3 bg-ink-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-brand-purple font-mono text-sm font-bold">{l.time}</span>
                <div>
                  <p className="font-bold text-white text-sm">{l.title}</p>
                  <p className="text-xs text-ink-400">{l.instructor} · Studio {l.studio}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{l.booked}/{l.capacity}</p>
                <div className="h-1 w-16 bg-ink-600 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(l.booked / l.capacity) * 100}%`,
                      background: l.booked / l.capacity >= 0.9 ? "#EF4444" : "#6B46C1",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, change, positive, icon }: {
  label: string; value: string; change: string; positive: boolean; icon: React.ReactNode;
}) {
  return (
    <div className="card-dark p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">{label}</p>
        <span className="text-brand-purple">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className={`text-xs font-medium ${positive ? "text-success" : "text-danger"}`}>{change}</p>
    </div>
  );
}
