"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { formatPrice, formatDate, formatTimeRange } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: booking, refetch } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refetch();
      router.push(`/mypage/booking/${id}/cancelled`);
    } catch (err) {
      toast({ title: "エラー", description: err instanceof Error ? err.message : "キャンセルに失敗しました", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  if (!booking) return <div className="min-h-screen bg-gray-50"><UserHeader /></div>;

  const slot = booking.slot;
  const studioName = slot?.studioName ?? slot?.studio?.name ?? "";
  const now = new Date();
  const slotDate = new Date(slot?.startAt);
  const hoursUntil = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundRate = 0;
  let refundLabel = "";
  if (hoursUntil > 24) { refundRate = 100; refundLabel = "全額返金"; }
  else if (hoursUntil > 0) { refundRate = 50; refundLabel = "50% 返金"; }
  else { refundRate = 0; refundLabel = "返金なし"; }

  const refundAmount = Math.floor((booking.amount - booking.discountAmount) * refundRate / 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <div className="space-y-4">
          <div className="card-light p-5">
            <p className="text-xs font-mono text-gray-400">#{booking.reservationNo}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1 mb-3">Studio {studioName}</h1>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">日時</span>
                <span className="text-gray-900">{slot?.startAt ? formatDate(slot.startAt) : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">時間</span>
                <span className="text-gray-900">
                  {slot?.startAt ? formatTimeRange(slot.startAt, slot.durationMin) : ""}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500">支払い金額</span>
                <span className="font-bold text-gray-900">{formatPrice(booking.amount - booking.discountAmount)}</span>
              </div>
            </div>
          </div>

          {/* Cancel policy */}
          {booking.status === "CONFIRMED" && (
            <div className="card-light p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">キャンセルポリシー</p>
              <div className="space-y-2 text-sm">
                <div className={`flex justify-between p-2 rounded-lg ${hoursUntil > 24 ? "bg-success/10 border border-success/30" : "opacity-50"}`}>
                  <span className="text-gray-900">前日18:00まで</span>
                  <span className="text-success font-bold">100% 返金</span>
                </div>
                <div className={`flex justify-between p-2 rounded-lg ${hoursUntil <= 24 && hoursUntil > 0 ? "bg-warning/10 border border-warning/30" : "opacity-50"}`}>
                  <span className="text-gray-900">当日 (前日18:00以降)</span>
                  <span className="text-warning font-bold">50% 返金</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg opacity-50">
                  <span className="text-gray-900">無断キャンセル</span>
                  <span className="text-danger font-bold">返金なし</span>
                </div>
              </div>

              {!showCancel ? (
                <Button variant="outline" className="w-full mt-4 border-danger text-danger hover:bg-danger hover:text-white" onClick={() => setShowCancel(true)}>
                  予約をキャンセルする
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 border border-danger/50 bg-danger/10 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">キャンセルの確認</p>
                      <p className="text-sm text-gray-500 mt-1">
                        キャンセルポリシー: <span className="font-bold text-gray-900">{refundLabel}</span>
                      </p>
                      {refundAmount > 0 && (
                        <p className="text-sm text-success mt-1">返金額: {formatPrice(refundAmount)}（35日以内）</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setShowCancel(false)} disabled={cancelling}>
                      戻る
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? "処理中..." : "キャンセルする"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
