"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { useAuthStore } from "@/lib/auth-store";
import { useBookingStore } from "@/lib/booking-store";
import { formatPrice, formatDate, formatTimeRange } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function SlotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { customer } = useAuthStore();
  const { setLesson } = useBookingStore();

  const { data: slot, isLoading } = useQuery({
    queryKey: ["slot", id],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${id}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const handleBook = () => {
    setLesson({
      id: slot.id,
      studioName: slot.studioName,
      startAt: slot.startAt,
      durationMin: slot.durationMin,
      price: slot.price,
    });
    if (!customer) {
      router.push("/login");
      return;
    }
    router.push("/booking/confirm");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="card-light h-20 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!slot) return null;

  const available = slot.capacity - (slot.bookedCount || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header card */}
          <div className="card-light p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">STUDIO {slot.studioName}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {formatTimeRange(slot.startAt, slot.durationMin)}
            </h1>
            <p className="text-sm text-gray-500">{formatDate(slot.startAt, "M月d日(E)")}</p>
            <p className="text-brand-purple font-bold text-xl mt-2">{formatPrice(slot.price)}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-light p-4 text-center">
              <Clock className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-0.5">時間</p>
              <p className="text-sm font-bold text-gray-900">{slot.durationMin}分</p>
            </div>
            <div className="card-light p-4 text-center">
              <Users className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-0.5">残り枠</p>
              <p className={cn("text-sm font-bold", available <= 0 ? "text-danger" : available <= 3 ? "text-warning" : "text-gray-900")}>
                {available} / {slot.capacity}
              </p>
            </div>
            <div className="card-light p-4 text-center">
              <Clock className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-0.5">開始</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date(slot.startAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Studio info */}
          <div className="card-light p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">STUDIO INFO</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Studio {slot.studioName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{slot.studioAddress}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent">
        <div className="max-w-md mx-auto">
          {available <= 0 ? (
            <Button disabled className="w-full" size="lg">満員です</Button>
          ) : (
            <Button onClick={handleBook} className="w-full" size="lg">
              このスタジオを予約する → {formatPrice(slot.price)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
