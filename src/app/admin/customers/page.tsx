"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  phone: string;
  email: string | null;
  lastName: string | null;
  firstName: string | null;
  tag: "NEW" | "REGULAR" | "FREQUENT" | "VIP";
  totalBookings: number;
  totalSpent: number;
  lastBookedAt: string | null;
  createdAt: string;
}

interface CustomerResponse {
  customers: Customer[];
  total: number;
  counts: Record<string, number>;
}

const SEGMENT_MAP = {
  VIP: { label: "VIP", variant: "pink" as const },
  FREQUENT: { label: "常連", variant: "default" as const },
  REGULAR: { label: "リピーター", variant: "success" as const },
  NEW: { label: "新規", variant: "secondary" as const },
};

const SEGMENT_LABELS: Record<string, string> = {
  ALL: "全員",
  VIP: "VIP",
  FREQUENT: "常連 (10+)",
  REGULAR: "リピーター",
  NEW: "新規",
};

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [segment, setSegment] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<CustomerResponse>({
    queryKey: ["admin-customers", debouncedSearch, segment, page],
    queryFn: () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        segment,
        page: String(page),
        limit: "20",
      });
      return fetch(`/api/admin/customers?${params}`).then((r) => r.json());
    },
    placeholderData: (prev) => prev,
  });

  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 300);
  };

  const handleSegmentChange = (s: string) => {
    setSegment(s);
    setPage(1);
  };

  const handleCsvExport = () => {
    window.open("/api/admin/bookings/export", "_blank");
  };

  const counts = data?.counts ?? {};
  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客管理 (CRM)</h1>
          <p className="text-gray-500 text-sm">全 {(counts.ALL ?? 0).toLocaleString()} 名</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-2" onClick={handleCsvExport}>
          <Download className="w-4 h-4" /> CSV出力
        </Button>
      </div>

      {/* Segment tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {["ALL", "VIP", "FREQUENT", "REGULAR", "NEW"].map((key) => (
          <button
            key={key}
            onClick={() => handleSegmentChange(key)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all",
              segment === key
                ? "bg-brand-purple border-brand-purple text-white shadow-glow-purple"
                : "border-gray-200 text-gray-500 hover:text-gray-900 bg-white"
            )}
          >
            {SEGMENT_LABELS[key]}{" "}
            <span className="text-xs ml-1 opacity-70">
              {(counts[key] ?? 0).toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="電話番号・メール・名前で検索"
          className="pl-9 bg-white border-gray-200 text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="card-light overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">名前</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">連絡先</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">予約数</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">LTV</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">最終予約</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">セグメント</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : customers.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    顧客が見つかりません
                  </td>
                </tr>
              )
              : customers.map((c) => {
                  const seg = SEGMENT_MAP[c.tag];
                  const name =
                    c.lastName && c.firstName
                      ? `${c.lastName} ${c.firstName}`
                      : null;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {name ?? <span className="text-gray-400 text-xs">未設定</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-gray-900 text-xs">{c.phone}</p>
                        {c.email && <p className="text-gray-500 text-xs mt-0.5">{c.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-gray-900">{c.totalBookings}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-purple">
                        {formatPrice(c.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        {c.lastBookedAt
                          ? format(new Date(c.lastBookedAt), "M/d")
                          : "---"}
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

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>{total}件中 {(page - 1) * 20 + 1}〜{Math.min(page * 20, total)}件表示</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              前へ
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              次へ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
