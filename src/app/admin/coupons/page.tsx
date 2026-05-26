"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Calendar, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  validUntil: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: () => fetch("/api/admin/coupons").then((r) => r.json()),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/coupons/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "削除しました" });
    },
  });

  const filtered = coupons.filter((c) =>
    filter === "all" ? true : filter === "active" ? c.isActive : !c.isActive
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">クーポン管理</h1>
          <p className="text-ink-400 text-sm">{coupons.length}件</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> 新規作成
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-ink-800 rounded-xl p-1 w-fit mb-6">
        {(["all", "active", "inactive"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              filter === key ? "bg-brand-purple text-white" : "text-ink-400 hover:text-white"
            }`}
          >
            {key === "all" ? "すべて" : key === "active" ? "有効" : "無効"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card-dark h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-dark p-12 text-center text-ink-500">クーポンがありません</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((coupon) => (
            <div
              key={coupon.id}
              className={`card-dark p-5 transition-colors ${!coupon.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 bg-brand-purple/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-brand-purple" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-white font-mono text-lg">{coupon.code}</span>
                      <Badge variant={coupon.isActive ? "success" : "secondary"} className="text-xs">
                        {coupon.isActive ? "有効" : "無効"}
                      </Badge>
                      {coupon.discountType === "PERCENT" ? (
                        <Badge variant="default">{coupon.discountValue}% OFF</Badge>
                      ) : (
                        <Badge variant="pink">{formatPrice(coupon.discountValue)} OFF</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-ink-400 mt-1">
                      <span>使用数: <strong className="text-white">{coupon.usageCount}</strong>
                        {coupon.usageLimit != null ? `/${coupon.usageLimit}` : ""}
                      </span>
                      {coupon.validUntil && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          〜{format(new Date(coupon.validUntil), "yyyy/MM/dd")}
                        </span>
                      )}
                    </div>
                    {coupon.usageLimit != null && (
                      <div className="h-1 w-32 bg-ink-700 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full brand-gradient rounded-full"
                          style={{ width: `${Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                    className="text-ink-400 hover:text-brand-purple transition-colors"
                    title={coupon.isActive ? "無効にする" : "有効にする"}
                  >
                    {coupon.isActive
                      ? <ToggleRight className="w-5 h-5 text-success" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`「${coupon.code}」を削除しますか？`)) {
                        deleteMutation.mutate(coupon.id);
                      }
                    }}
                    className="text-ink-400 hover:text-danger transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <CreateCouponModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function CreateCouponModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT" as "PERCENT" | "FIXED",
    discountValue: "",
    validUntil: "",
    usageLimit: "",
  });
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          discountValue: Number(data.discountValue),
          validUntil: data.validUntil || null,
          usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        }),
      }).then((r) => r.json()),
    onSuccess: (d) => {
      if (d.error) { setError(d.error); return; }
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "クーポンを作成しました", description: d.code });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) { setError("コードを入力してください"); return; }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setError("割引額/率を入力してください"); return;
    }
    if (form.discountType === "PERCENT" && Number(form.discountValue) > 100) {
      setError("割引率は100%以下にしてください"); return;
    }
    createMutation.mutate(form);
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-ink-800 rounded-2xl border border-ink-700 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h2 className="text-lg font-bold text-white">クーポンを作成</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-400 mb-1.5">クーポンコード *</label>
            <Input
              value={form.code}
              onChange={f("code")}
              placeholder="例: SUMMER20"
              className="uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-400 mb-1.5">割引タイプ *</label>
              <select
                value={form.discountType}
                onChange={f("discountType")}
                className="w-full bg-ink-700 border border-ink-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-purple"
              >
                <option value="PERCENT">% OFF</option>
                <option value="FIXED">円 OFF</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-400 mb-1.5">
                割引{form.discountType === "PERCENT" ? "率 (%)" : "額 (円)"} *
              </label>
              <Input
                type="number"
                min={1}
                max={form.discountType === "PERCENT" ? 100 : undefined}
                value={form.discountValue}
                onChange={f("discountValue")}
                placeholder={form.discountType === "PERCENT" ? "10" : "500"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-400 mb-1.5">有効期限（任意）</label>
              <Input type="date" value={form.validUntil} onChange={f("validUntil")} />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-400 mb-1.5">使用上限（任意）</label>
              <Input
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={f("usageLimit")}
                placeholder="∞"
              />
            </div>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "作成中…" : "作成する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
