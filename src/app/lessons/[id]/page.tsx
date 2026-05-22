"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserHeader } from "@/components/layout/user-header";
import { useAuthStore } from "@/lib/auth-store";
import { useBookingStore } from "@/lib/booking-store";
import { formatPrice, formatDate, GENRE_COLORS, LEVEL_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { customer } = useAuthStore();
  const { setLesson } = useBookingStore();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${id}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
  });

  const handleBook = () => {
    // Save lesson first so it survives the login redirect
    setLesson({
      id: lesson.id,
      title: lesson.title,
      genre: lesson.genre.slug,
      level: lesson.level,
      startAt: lesson.startAt,
      durationMin: lesson.durationMin,
      instructorName: lesson.instructor.name,
      studioName: lesson.studio.name,
      price: lesson.price,
    });
    if (!customer) {
      router.push("/login");
      return;
    }
    router.push("/booking/confirm");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-900">
        <UserHeader />
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="card-dark h-20 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  const available = lesson.capacity - (lesson.bookedCount || 0);
  const genreColor = GENRE_COLORS[lesson.genre.slug] || "#6B46C1";

  return (
    <div className="min-h-screen bg-ink-900">
      <UserHeader />

      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-ink-400 hover:text-white mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header card */}
          <div className="card-dark p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: genreColor }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: genreColor }}>
                {lesson.genre.name} · {LEVEL_LABELS[lesson.level]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{lesson.title}</h1>
            <p className="text-brand-purple font-bold text-xl">{formatPrice(lesson.price)}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-dark p-4 text-center">
              <Clock className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <p className="text-xs text-ink-400 mb-0.5">日時</p>
              <p className="text-sm font-bold text-white">{formatDate(lesson.startAt)}</p>
            </div>
            <div className="card-dark p-4 text-center">
              <Users className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <p className="text-xs text-ink-400 mb-0.5">残席</p>
              <p className={cn("text-sm font-bold", available <= 3 ? "text-warning" : "text-white")}>
                {available} / {lesson.capacity}
              </p>
            </div>
            <div className="card-dark p-4 text-center">
              <Clock className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <p className="text-xs text-ink-400 mb-0.5">時間</p>
              <p className="text-sm font-bold text-white">{lesson.durationMin}分</p>
            </div>
          </div>

          {/* Instructor */}
          <div className="card-dark p-5">
            <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">INSTRUCTOR</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full brand-gradient flex items-center justify-center text-xl font-bold text-white shadow-glow-purple">
                {lesson.instructor.name[0]}
              </div>
              <div>
                <p className="font-bold text-white text-lg">{lesson.instructor.name}</p>
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                  <span>{lesson.instructor.rating?.toFixed(1)} ({lesson.instructor.reviewCount}件)</span>
                </div>
                <p className="text-xs text-ink-400 mt-0.5">{lesson.genre.name} / 経験{lesson.instructor.experience}年</p>
              </div>
            </div>
            {lesson.instructor.bio && (
              <p className="text-sm text-ink-300 mt-3 leading-relaxed">{lesson.instructor.bio}</p>
            )}
          </div>

          {/* Studio */}
          <div className="card-dark p-5">
            <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">STUDIO</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-purple/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <p className="font-bold text-white">Studio {lesson.studio.name}</p>
                <p className="text-xs text-ink-400 mt-0.5">{lesson.studio.address}</p>
                <p className="text-xs text-ink-400">定員{lesson.studio.capacity}名</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-ink-900 via-ink-900/95 to-transparent">
        <div className="max-w-md mx-auto">
          {available <= 0 ? (
            <Button disabled className="w-full" size="lg">満席です</Button>
          ) : (
            <Button onClick={handleBook} className="w-full" size="lg">
              このレッスンを予約する → {formatPrice(lesson.price)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
