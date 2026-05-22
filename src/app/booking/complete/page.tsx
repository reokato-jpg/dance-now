"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { formatPrice, formatDate } from "@/lib/utils";

function BookingCompleteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const bookingId = params.get("id");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!bookingId) {
      router.push("/lessons");
    }
  }, [bookingId, router]);

  const { data: booking } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (booking?.reservationNo) {
      QRCode.toDataURL(
        `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/ticket/${booking.reservationNo}`,
        { width: 200, margin: 2, color: { dark: "#0F0A1F", light: "#FFFFFF" } }
      ).then(setQrDataUrl);
    }
  }, [booking]);

  const handleAddCalendar = () => {
    if (!booking?.lesson) return;
    const start = new Date(booking.lesson.startAt);
    const end = new Date(start.getTime() + booking.lesson.durationMin * 60000);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTEND:${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `SUMMARY:${booking.lesson.title} - DANCE NOW`,
      `DESCRIPTION:予約番号: ${booking.reservationNo}`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dance-now-${booking.reservationNo}.ics`;
    a.click();
  };

  if (!bookingId) return null;

  return (
    <div className="min-h-screen bg-ink-900">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 brand-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-pink"
          >
            <span className="text-4xl">🎉</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-1">予約完了！</h1>
          <p className="text-ink-400">レッスン当日はこのQRコードを提示してください</p>
        </motion.div>

        {booking ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {/* E-Ticket */}
            <div className="relative overflow-hidden rounded-2xl border border-brand-purple shadow-glow-purple">
              <div className="brand-gradient p-5 text-white">
                <p className="text-xs font-bold tracking-widest uppercase opacity-80">E-TICKET</p>
                <h2 className="text-xl font-bold mt-1">{booking.lesson?.title}</h2>
                <p className="text-xs opacity-80 font-mono">#{booking.reservationNo}</p>
              </div>

              <div className="relative h-px mx-4">
                <div className="absolute inset-0 border-t-2 border-dashed border-ink-600" />
                <div className="absolute -left-6 -top-3 w-6 h-6 bg-ink-900 rounded-full" />
                <div className="absolute -right-6 -top-3 w-6 h-6 bg-ink-900 rounded-full" />
              </div>

              <div className="bg-ink-800 p-5 flex items-center gap-5">
                <div className="flex-1 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-400">日時</span>
                    <span className="text-white font-medium">{booking.lesson?.startAt ? formatDate(booking.lesson.startAt) : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">講師</span>
                    <span className="text-white">{booking.lesson?.instructor?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">スタジオ</span>
                    <span className="text-white">Studio {booking.lesson?.studio?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">金額</span>
                    <span className="text-brand-purple font-bold">{formatPrice(booking.amount - booking.discountAmount)}</span>
                  </div>
                </div>
                {qrDataUrl && (
                  <div className="w-24 h-24 bg-white rounded-xl p-1.5 flex-shrink-0">
                    <img src={qrDataUrl} alt="QR" className="w-full h-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Button onClick={handleAddCalendar} variant="secondary" className="gap-2">
                <Calendar className="w-4 h-4" />
                カレンダーに追加
              </Button>
              <Button onClick={() => router.push("/mypage")} variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                マイページへ
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="card-dark h-80 animate-pulse" />
        )}
      </div>
    </div>
  );
}

export default function BookingCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-900" />}>
      <BookingCompleteContent />
    </Suspense>
  );
}
