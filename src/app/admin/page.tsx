"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, Users, BookOpen, BarChart2, Percent,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatPrice, formatTimeRange } from "@/lib/utils";

interface KpiData {
  todaySales: number;
  todaySalesGrowth: number | null;
  todayBookings: number;
  cancelRate: number;
  occupancy: number;
  weeklyData: Array<{ date: string; day: string; sales: number }>;
  studioBreakdown: Array<{ name: string; pct: number }>;
  todaySlots: Array<{
    id: string; studioName: string; startAt: string;
    durationMin: number; price: number; bookedCount: number; capacity: number;
  }>;
}

export default function AdminDashboard() {
  const today = format(new Date(), "yyyy年M月d日(E)", { locale: ja });

  const { data, isLoading } = useQuery<KpiData>({
    queryKey: ["admin-kpi"],
    queryFn: () => fetch("/api/admin/kpi").then((r) => r.json()),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
            <p className="text-ink-400 text-sm">{today}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-dark h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-dark h-64 animate-pulse" />
          <div className="card-dark h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  const highestSalesIdx = data.weeklyData.reduce(
    (best, item, i) => (item.sales > data.weeklyData[best].sales ? i : best),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
          <p className="text-ink-400 text-sm">{today}</p>
        </div>
        <span className="text-xs text-ink-500 bg-ink-800 px-2 py-1 rounded-lg">1分ごとに自動更新</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "今日の売上",
            value: formatPrice(data.todaySales),
            change: data.todaySalesGrowth != null
              ? `${data.todaySalesGrowth >= 0 ? "+" : ""}${data.todaySalesGrowth}% vs 先週同曜日`
              : "先週データなし",
            positive: (data.todaySalesGrowth ?? 0) >= 0,
            icon: <TrendingUp className="w-5 h-5" />,
          },
          {
            label: "予約数",
            value: `${data.todayBookings}件`,
            change: "本日確定",
            positive: true,
            icon: <BookOpen className="w-5 h-5" />,
          },
          {
            label: "キャンセル率",
            value: `${data.cancelRate}%`,
            change: "今週7日間",
            positive: data.cancelRate <= 10,
            icon: <Percent className="w-5 h-5" />,
          },
          {
            label: "稼働率",
            value: `${data.occupancy}%`,
            change: "本日スロット平均",
            positive: data.occupancy >= 50,
            icon: <BarChart2 className="w-5 h-5" />,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="lg:col-span-2 card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">過去7日間の売上</h3>
          {data.weeklyData.every((d) => d.sales === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-ink-500 text-sm">
              まだデータがありません
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weeklyData}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#1A1035",
                    border: "1px solid #3D2B6B",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  formatter={(v: number) => [formatPrice(v), "売上"]}
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {data.weeklyData.map((_, i) => (
                    <Cell key={i} fill={i === highestSalesIdx ? "#6B46C1" : "#3D2B6B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Studio breakdown */}
        <div className="card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">
            スタジオ別 予約内訳
          </h3>
          {data.studioBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-ink-500 text-sm">
              データなし
            </div>
          ) : (
            <div className="space-y-3">
              {data.studioBreakdown.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white font-medium">{s.name}</span>
                    <span className="text-ink-400">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                    <div className="h-full brand-gradient rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's slots */}
      <div className="card-dark p-5">
        <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">本日のスロット</h3>
        {data.todaySlots.length === 0 ? (
          <p className="text-ink-500 text-sm text-center py-8">本日のスロットはありません</p>
        ) : (
          <div className="space-y-3">
            {data.todaySlots.map((sl) => {
              const fill = sl.capacity > 0 ? sl.bookedCount / sl.capacity : 0;
              return (
                <div
                  key={sl.id}
                  className="flex items-center justify-between p-3 bg-ink-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-brand-purple font-mono text-sm font-bold">
                      {format(new Date(sl.startAt), "HH:mm")}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">Studio {sl.studioName}</p>
                      <p className="text-xs text-ink-400">
                        {formatTimeRange(sl.startAt, sl.durationMin)} · {formatPrice(sl.price)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {sl.bookedCount}/{sl.capacity}
                    </p>
                    <div className="h-1 w-16 bg-ink-600 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${fill * 100}%`,
                          background: fill >= 0.9 ? "#EF4444" : "#6B46C1",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  positive,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-dark p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">{label}</p>
        <span className="text-brand-purple">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className={`text-xs font-medium flex items-center gap-1 ${positive ? "text-success" : "text-danger"}`}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {change}
      </p>
    </div>
  );
}
