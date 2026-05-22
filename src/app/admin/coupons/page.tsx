"use client";

import { useState } from "react";
import { Plus, Tag, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";

const MOCK_COUPONS = [
  { code: "DANCE10", type: "PERCENT", value: 10, desc: "全ジャンル10%OFF", usageCount: 142, usageLimit: 500, validUntil: "2026-06-30", targetGenres: [], isActive: true },
  { code: "FRIEND500", type: "FIXED", value: 500, desc: "友達紹介500円OFF", usageCount: 28, usageLimit: null, validUntil: "2026-05-31", targetGenres: [], isActive: true },
  { code: "BIRTHDAY1000", type: "FIXED", value: 1000, desc: "誕生日1000円OFF", usageCount: 0, usageLimit: null, validUntil: null, targetGenres: [], isActive: true },
  { code: "SUMMER20", type: "PERCENT", value: 20, desc: "夏祭り20%OFF", usageCount: 0, usageLimit: null, validUntil: "2026-08-31", targetGenres: ["K-POP", "HIPHOP"], isActive: false },
];

export default function AdminCouponsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = MOCK_COUPONS.filter((c) =>
    filter === "all" ? true : filter === "active" ? c.isActive : !c.isActive
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">クーポン管理</h1>
          <p className="text-ink-400 text-sm">{MOCK_COUPONS.length}件</p>
        </div>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> 新規作成</Button>
      </div>

      <div className="flex gap-1 bg-ink-800 rounded-xl p-1 w-fit mb-6">
        {[["all", "すべて"], ["active", "有効"], ["inactive", "無効"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === key ? "bg-brand-purple text-white" : "text-ink-400 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((coupon) => (
          <div key={coupon.code} className={`card-dark p-5 hover:border-brand-purple transition-colors ${!coupon.isActive ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 bg-brand-purple/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-brand-purple" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white font-mono text-lg">{coupon.code}</span>
                    <Badge variant={coupon.isActive ? "success" : "secondary"} className="text-xs">
                      {coupon.isActive ? "有効" : "無効"}
                    </Badge>
                    {coupon.type === "PERCENT" ? (
                      <Badge variant="default">{coupon.value}% OFF</Badge>
                    ) : (
                      <Badge variant="pink">{formatPrice(coupon.value)} OFF</Badge>
                    )}
                  </div>
                  <p className="text-sm text-ink-300">{coupon.desc}</p>
                  {coupon.targetGenres.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {coupon.targetGenres.map((g) => (
                        <span key={g} className="text-xs bg-ink-700 text-ink-300 px-2 py-0.5 rounded-full">{g}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0 space-y-1">
                {coupon.usageLimit ? (
                  <div>
                    <p className="text-sm font-bold text-white">{coupon.usageCount} / {coupon.usageLimit}</p>
                    <div className="h-1 w-20 bg-ink-700 rounded-full overflow-hidden mt-1">
                      <div className="h-full brand-gradient rounded-full" style={{ width: `${(coupon.usageCount / coupon.usageLimit) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-white">{coupon.usageCount}回使用</p>
                )}
                {coupon.validUntil && (
                  <p className="text-xs text-ink-400 flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3" />〜{coupon.validUntil}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
