"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Clock, Users, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface Studio {
  id: string;
  name: string;
  address: string;
  capacity: number;
  openAt: string;
  closeAt: string;
  lessonCount: number;
}

const EMPTY_FORM = { name: "", address: "", capacity: 30, openAt: "10:00", closeAt: "22:00" };

function StudioModal({
  initial,
  onClose,
  onSave,
  loading,
}: {
  initial: typeof EMPTY_FORM & { id?: string };
  onClose: () => void;
  onSave: (data: typeof EMPTY_FORM) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY_FORM, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-ink-800 border border-ink-600 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{initial.id ? "スタジオ編集" : "スタジオ追加"}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">スタジオ名 *</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例: A" />
            <p className="text-xs text-ink-500 mt-1">表示は「Studio A」のようになります</p>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">住所 *</label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="渋谷区〇〇1-2-3 1F" />
          </div>
          <div>
            <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">定員（名）*</label>
            <Input
              type="number"
              min={1}
              max={999}
              value={form.capacity}
              onChange={(e) => set("capacity", parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">開場</label>
              <Input type="time" value={form.openAt} onChange={(e) => set("openAt", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">閉場</label>
              <Input type="time" value={form.closeAt} onChange={(e) => set("closeAt", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>キャンセル</Button>
          <Button
            onClick={() => onSave(form)}
            className="flex-1"
            disabled={loading || !form.name.trim() || !form.address.trim()}
          >
            {loading ? "保存中..." : (
              <><Check className="w-4 h-4 mr-1" /> {initial.id ? "更新" : "追加"}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStudiosPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<(typeof EMPTY_FORM & { id?: string }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Studio | null>(null);

  const { data: studios = [], isLoading } = useQuery<Studio[]>({
    queryKey: ["admin-studios"],
    queryFn: async () => {
      const res = await fetch("/api/admin/studios");
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      const res = await fetch("/api/admin/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-studios"] });
      toast({ title: "追加しました", variant: "success" as any });
      setModal(null);
    },
    onError: (e: Error) => toast({ title: "エラー", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM & { id: string }) => {
      const res = await fetch(`/api/admin/studios/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-studios"] });
      toast({ title: "更新しました", variant: "success" as any });
      setModal(null);
    },
    onError: (e: Error) => toast({ title: "エラー", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/studios/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-studios"] });
      toast({ title: "削除しました" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast({ title: "削除できません", description: e.message, variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  const handleSave = (data: typeof EMPTY_FORM) => {
    if (modal?.id) updateMutation.mutate({ ...data, id: modal.id });
    else createMutation.mutate(data);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">スタジオ</h1>
          <p className="text-ink-400 text-sm">
            {studios.length}スタジオ
            {studios.length === 0 && " · スタジオを追加してください"}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setModal(EMPTY_FORM)}>
          <Plus className="w-4 h-4" /> スタジオ追加
        </Button>
      </div>

      {/* Empty state */}
      {!isLoading && studios.length === 0 && (
        <div className="card-dark p-10 text-center">
          <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <p className="font-bold text-white mb-1">スタジオがまだありません</p>
          <p className="text-ink-400 text-sm mb-4">「スタジオ追加」から登録してください</p>
          <Button size="sm" onClick={() => setModal(EMPTY_FORM)}><Plus className="w-4 h-4 mr-1" /> 最初のスタジオを追加</Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="card-dark h-32 animate-pulse" />)}
        </div>
      )}

      {/* Studio cards */}
      <div className="space-y-4">
        {studios.map((studio) => (
          <div key={studio.id} className="card-dark p-5 hover:border-brand-purple transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 brand-gradient rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-glow-purple">
                  {studio.name}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Studio {studio.name}</h3>
                  <div className="flex items-center gap-1 text-ink-400 text-sm">
                    <MapPin className="w-3.5 h-3.5" />{studio.address}
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModal({ id: studio.id, name: studio.name, address: studio.address, capacity: studio.capacity, openAt: studio.openAt, closeAt: studio.closeAt })}
                  className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-ink-600 transition-colors"
                  title="編集"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(studio)}
                  className="p-2 rounded-lg text-ink-400 hover:text-danger hover:bg-danger/10 transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-ink-400">
                <Users className="w-4 h-4" />
                <span>定員 {studio.capacity}名</span>
              </div>
              <div className="flex items-center gap-2 text-ink-400">
                <Clock className="w-4 h-4" />
                <span>{studio.openAt}〜{studio.closeAt}</span>
              </div>
              <div className="text-right text-ink-400">
                <span>レッスン {studio.lessonCount}本</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <StudioModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={isMutating}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-ink-800 border border-ink-600 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2">Studio {deleteTarget.name} を削除</h2>
            <p className="text-ink-400 text-sm mb-6">
              削除するとこのスタジオのレッスン割当も解除されます。今後のレッスンが残っている場合は削除できません。
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1" disabled={deleteMutation.isPending}>
                キャンセル
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-danger hover:bg-danger/80 text-white"
              >
                {deleteMutation.isPending ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
