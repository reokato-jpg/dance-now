"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
  CONFIRMED: { label: "確定", variant: "default" },
  ATTENDED: { label: "受講済", variant: "success" },
  CANCELLED: { label: "キャンセル", variant: "destructive" },
  NO_SHOW: { label: "未出席", variant: "warning" },
};

const PAYMENT_MAP: Record<string, string> = {
  STRIPE: "カード",
  PAYPAY: "PayPay",
};

export default function AdminBookingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ search, status });
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const bookings = data?.bookings || [];
  const stats = data?.stats || { total: 0, confirmed: 0, cancelled: 0, noShow: 0 };

  const handleExportCsv = async () => {
    const res = await fetch("/api/admin/bookings/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">予約一覧</h1>
          <p className="text-ink-400 text-sm mt-0.5">全 {stats.total.toLocaleString()} 件</p>
        </div>
        <Button onClick={handleExportCsv} variant="secondary" size="sm" className="gap-2">
          <Download className="w-4 h-4" /> CSV出力
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "全件", value: stats.total, key: "ALL" },
          { label: "確定", value: stats.confirmed, key: "CONFIRMED" },
          { label: "キャンセル", value: stats.cancelled, key: "CANCELLED" },
          { label: "未出席", value: stats.noShow, key: "NO_SHOW" },
        ].map(({ label, value, key }) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={cn("card-dark p-3 text-left transition-colors hover:border-brand-purple", status === key ? "border-brand-purple" : "")}
          >
            <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-xs text-ink-400">{label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="予約番号、電話番号で検索"
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700">
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase tracking-wider">予約番号</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase tracking-wider">スタジオ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase tracking-wider">日時</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase tracking-wider">金額</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase tracking-wider">支払</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-400 uppercase tracking-wider">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-ink-700">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-ink-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">予約がありません</td></tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-ink-700 hover:bg-ink-700/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-brand-purple text-xs">{b.reservationNo}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      Studio {b.slot?.studioName ?? b.slot?.studio?.name ?? "---"}
                    </td>
                    <td className="px-4 py-3 text-ink-300">{b.slot?.startAt ? formatDate(b.slot.startAt) : "---"}</td>
                    <td className="px-4 py-3 font-bold text-white">{formatPrice(b.amount - b.discountAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", b.payment?.method === "PAYPAY" ? "bg-[#FF0033]/20 text-[#FF0033]" : "bg-blue-500/20 text-blue-400")}>
                        {PAYMENT_MAP[b.payment?.method] || "---"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_MAP[b.status]?.variant}>{STATUS_MAP[b.status]?.label}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
