"use client";

import { useState } from "react";
import { format, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { Download, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const MONTHLY_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  sales: Math.floor(Math.random() * 60000) + 40000,
}));

const PAYMENT_SPLIT = [
  { name: "PayPay", value: 58, amount: 956000, color: "#FF0033" },
  { name: "カード", value: 42, amount: 692000, color: "#6B46C1" },
];

const SUMMARY = {
  totalSales: 1648500,
  totalSalesGrowth: 18,
  bookings: 472,
  avgPrice: 3492,
  avgPriceGrowth: 120,
};

export default function AdminSalesPage() {
  const [period, setPeriod] = useState("month");
  const currentMonth = format(new Date(), "yyyy年M月", { locale: ja });

  const handleExport = (type: "csv" | "pdf") => {
    // In production: generate and download file
    alert(`${type.toUpperCase()}をエクスポートします`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">売上レポート</h1>
          <p className="text-ink-400 text-sm">{currentMonth} (5/1 - 5/19)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleExport("pdf")}>
            <Download className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-dark p-4">
          <p className="text-xs font-bold text-ink-400 uppercase mb-2">月次売上</p>
          <p className="text-2xl font-bold text-white">{formatPrice(SUMMARY.totalSales)}</p>
          <p className="text-success text-xs mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +{SUMMARY.totalSalesGrowth}% vs 先月
          </p>
        </div>
        <div className="card-dark p-4">
          <p className="text-xs font-bold text-ink-400 uppercase mb-2">予約数</p>
          <p className="text-2xl font-bold text-white">{SUMMARY.bookings}件</p>
          <p className="text-success text-xs mt-1">先月比 +23件</p>
        </div>
        <div className="card-dark p-4">
          <p className="text-xs font-bold text-ink-400 uppercase mb-2">客単価</p>
          <p className="text-2xl font-bold text-white">{formatPrice(SUMMARY.avgPrice)}</p>
          <p className="text-success text-xs mt-1">+{formatPrice(SUMMARY.avgPriceGrowth)} vs 先月</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <div className="lg:col-span-2 card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">日次売上推移</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_DATA}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B46C1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6B46C1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#1A1035", border: "1px solid #3D2B6B", borderRadius: 8, color: "#fff" }}
                formatter={(v: number) => [formatPrice(v), "売上"]}
              />
              <Area type="monotone" dataKey="sales" stroke="#6B46C1" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment split */}
        <div className="card-dark p-5">
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4">支払い方法</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={PAYMENT_SPLIT} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                {PAYMENT_SPLIT.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {PAYMENT_SPLIT.map((p) => (
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
        </div>
      </div>
    </div>
  );
}
