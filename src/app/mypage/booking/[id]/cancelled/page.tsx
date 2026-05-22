"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { formatPrice } from "@/lib/utils";

export default function CancelledPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: booking } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${id}`);
      return res.json();
    },
  });

  const refundAmount = booking?.payment?.refundAmount || 0;

  return (
    <div className="min-h-screen bg-ink-900">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">キャンセルが完了しました</h1>
          <p className="text-ink-400 mb-8">
            {booking?.lesson?.title} のキャンセルを受け付けました
          </p>

          {refundAmount > 0 && (
            <div className="card-dark p-5 mb-6 text-left">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">返金明細</p>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-ink-400">予約番号</span>
                <span className="text-white font-mono">{booking?.reservationNo}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-ink-400">{booking?.lesson?.title}</span>
                <span className="text-danger">(返金対象)</span>
              </div>
              <div className="border-t border-ink-700 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-white">返金額</span>
                <span className="font-bold text-success text-lg">{formatPrice(refundAmount)}</span>
              </div>
              <p className="text-xs text-ink-500 mt-3 flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" />
                35営業日以内に元の決済方法へ返金されます
              </p>
            </div>
          )}

          <Button onClick={() => router.push("/mypage")} className="w-full" size="lg">
            <Home className="w-4 h-4 mr-2" /> マイページへ戻る
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
