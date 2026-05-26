"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { Download, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface SalesData {
  dailySales: Array<{ day: number; sales: number }>;
  paymentSplit: Array<{ name: string; value: number; amount: number; color: string }>;
  summary: {
    totalSales: number;
    totalSalesGrowth: number | null;
    bookings: number;
    avgPrice: number;
    avgPriceGrowth: number | null;
  };
}

export default function AdminSalesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useQuery<SalesData>({
    queryKey: ["admin-sales", year, month],
    queryFn: () =>
      fetch(`/api/admin/sales?year=${year}&month=${month}`).then((r) => r.json()),
  });

  const handlePrevMonth = () => {
    const d = subMonths(new Date(year, month - 1), 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };
  const handleNextMonth = () => {
    const next = new Date(year, month - 1 + 1);
    if (next > now) return;
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const monthLabel = format(new Date(year, month - 1), "yyyy年M月", { locale: ja });

  const handleCsvExport = () => {
    window.open(`/api/admin/bookings/export?year=${year}&month=${month}`, "_blank");
  };

  const summary = data?.summary ?? { totalSales: 0, totalSalesGrowth: null, bookings: 0, avgPrice: 0, avgPriceGrowth: null };
  const dailySales = data?.dailySales ?? [];
  const paymentSplit = data?.paymentSplit ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">売上レポート</h1>
          {/* Month navigator */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handlePrevMonth}
              className="text-ink-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-ink-400 text-sm font-medium">{monthLabel}</p>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="text-ink-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Button variant="secondary" size="sm" className="gap-2" onClick={handleCsvExport}>
          <Download className="w-4 h-4" /> CSV出力
        </Button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="card-dark h-28 animate-pulse" />)
        ) : (
          <>
            <div className="card-dark p-4">
              <p className="text-xs font-bold text-ink-400 uppercase mb-2">月次売上</p>
              <p className="text-2xl font-bold text-white">{formatPrice(summary.totalSales)}</p>
              {summary.totalSalesGrowth != null ? (
                <p className={`text-xs mt-1 flex items-center gap-1 ${summary.totalSalesGrowth >= 0 ? "text-success" : "text-danger"}`}>
                  <TrendingUp className="w-3 h-3" />
                  {summary.totalSalesGrowth >= 0 ? "+" : ""}{summary.totalSalesGrowth}% vs 先月
                </p>
              ) : (
                <p className="text-xs mt-1 text-ink-500">先月データなし</p>
              )}
            </div>
            <div className="card-dark p-4">
              <p className="text-xs font-bold text-ink-400 uppercase mb-2">予約数</p>
              <p className="text-2xl font-bold text-white">{summary.bookings}件</p>
              <p className="text-xs mt-1 text-ink-500">確定済み</p>
            </div>
            <div className="card-dark p-4">
              <p className="text-xs font-bold text-ink-400 uppercase mb-2">客単価</p>
              <p className="text-2xl font-bold text-white">{formatPrice(summary.avgPrice)}</p>
              {summary.avgPriceGrowth != null ? (
                <p className={`text-xs mt-1 flex items-center gap-1 ${summary.avgPriceGrowth >= 0 ? "text-success" : "text-danger"}`}>
                  <TrendingUp className="w-3 h-3" />
                  {summary.avgPriceGrowth >= 0 ? "+" : ""}{formatPrice(summary.avgPriceGrowth)} vs 先月
                </p>
              ) : (
                <p className="text-xs mt-1 text-ink-500">先月データなし</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily sales chart */}
        <div className="lg:col-span-2 card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">日次売上推移</h3>
          {isLoading ? (
            <div className="h-[220px] animate-pulse bg-ink-700 rounded-lg" />
          ) : dailySales.every((d) => d.sales === 0) ? (
            <div className="h-[220px] flex items-center justify-center text-ink-500 text-sm">
              この月のデータはありません
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B46C1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6B46C1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#1A1035", border: "1px solid #3D2B6B", borderRadius: 8, color: "#fff" }}
                  formatter={(v: number) => [formatPrice(v), "売上"]}
                  labelFormatter={(l) => `${l}日`}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#6B46C1"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment split */}
        <div className="card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">支払い方法</h3>
          {isLoading ? (
            <div className="h-[150px] animate-pulse bg-ink-700 rounded-lg" />
          ) : paymentSplit.every((p) => p.value === 0) ? (
            <div className="h-[150px] flex items-center justify-center text-ink-500 text-sm">
              データなし
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={paymentSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {paymentSplit.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentSplit.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-white">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">{p.value}%</span>
                      <span className="text-ink-400 text-xs ml-1">({formatPrice(p.amount)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
