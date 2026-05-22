"use client";

import { useState } from "react";
import { Search, Download, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SEGMENT_MAP: Record<string, { label: string; color: string; variant: any }> = {
  VIP: { label: "VIP", color: "#EC4899", variant: "pink" },
  FREQUENT: { label: "常連", color: "#6B46C1", variant: "default" },
  REGULAR: { label: "リピーター", color: "#10B981", variant: "success" },
  NEW: { label: "新規", color: "#6B7280", variant: "secondary" },
};

const MOCK_CUSTOMERS = [
  { id: "1", phone: "090-1234-5678", email: "sakura@ex.jp", bookings: 28, totalSpent: 98000, lastBookedAt: "2026-05-18", tag: "VIP" },
  { id: "2", phone: "090-8765-4321", email: null, bookings: 12, totalSpent: 42000, lastBookedAt: "2026-05-15", tag: "FREQUENT" },
  { id: "3", phone: "090-5555-3333", email: "misaki@ex.jp", bookings: 7, totalSpent: 24500, lastBookedAt: "2026-05-12", tag: "REGULAR" },
  { id: "4", phone: "090-2222-1111", email: "hanako@ex.jp", bookings: 2, totalSpent: 7000, lastBookedAt: "2026-03-12", tag: "NEW" },
  { id: "5", phone: "090-9999-8888", email: "moe@ex.jp", bookings: 5, totalSpent: 17500, lastBookedAt: null, tag: "REGULAR" },
];

const SEGMENTS = [
  { key: "ALL", label: "全員", count: 1248 },
  { key: "VIP", label: "VIP (10+)", count: 82 },
  { key: "FREQUENT", label: "3〜9回", count: 368 },
  { key: "REGULAR", label: "1〜2回", count: 542 },
  { key: "NEW", label: "30日以内", count: 256 },
];

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("ALL");

  const filtered = MOCK_CUSTOMERS.filter((c) =>
    (segment === "ALL" || c.tag === segment) &&
    (search === "" || c.phone.includes(search) || c.email?.includes(search))
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">顧客管理 (CRM)</h1>
          <p className="text-ink-400 text-sm">全 {SEGMENTS[0].count.toLocaleString()} 名</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-2">
          <Download className="w-4 h-4" /> CSV出力
        </Button>
      </div>

      {/* Segments */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {SEGMENTS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setSegment(key)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all",
              segment === key ? "bg-brand-purple border-brand-purple text-white shadow-glow-purple" : "border-ink-700 text-ink-400 hover:text-white bg-ink-800"
            )}
          >
            {label} <span className="text-xs ml-1 opacity-70">{count.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="電話番号、メールアドレスで検索" className="pl-9" />
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700">
              <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase">電話番号</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase">メール</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-ink-400 uppercase">予約数</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-ink-400 uppercase">LTV</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-ink-400 uppercase">最終予約</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-ink-400 uppercase">セグメント</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const seg = SEGMENT_MAP[c.tag];
              return (
                <tr key={c.id} className="border-b border-ink-700 hover:bg-ink-700/50 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-mono text-white">{c.phone}</td>
                  <td className="px-4 py-3 text-ink-300">{c.email || "---"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-white">{c.bookings}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-brand-purple">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-center text-ink-400 text-xs">
                    {c.lastBookedAt ? format(new Date(c.lastBookedAt), "M/d") : "---"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={seg.variant} className="gap-1">
                      {c.tag === "VIP" && <Crown className="w-3 h-3" />}
                      {seg.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
