"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth-store";
import { useBookingStore } from "@/lib/booking-store";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const GENRES = [
  { id: "hiphop", label: "HIPHOP", color: "bg-brand-purple" },
  { id: "jazz", label: "JAZZ", color: "bg-brand-pink" },
  { id: "kpop", label: "K-POP", color: "bg-warning" },
  { id: "ballet", label: "BALLET", color: "bg-success" },
  { id: "house", label: "HOUSE", color: "bg-blue-500" },
  { id: "contemporary", label: "CONTEMPORARY", color: "bg-violet-500" },
];

const schema = z.object({
  lastName: z.string().min(1, "姓を入力してください"),
  firstName: z.string().min(1, "名を入力してください"),
  email: z.string().email("メールアドレスの形式が正しくありません").optional().or(z.literal("")),
  birthday: z.string().min(1, "生年月日を入力してください"),
});

type FormData = z.infer<typeof schema>;

export default function ProfileSetupPage() {
  const router = useRouter();
  const { customer, setCustomer } = useAuthStore();
  const { lesson } = useBookingStore();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const toggleGenre = (id: string) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, genres: selectedGenres, customerId: customer?.id }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error("プロフィール登録に失敗しました");
      setCustomer(updated.customer);
      // Preserve pending booking context
      if (lesson) {
        router.push("/booking/confirm");
      } else {
        router.push("/lessons");
      }
    } catch {
      toast({ title: "エラー", description: "プロフィール登録に失敗しました", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <p className="text-xs text-brand-purple font-bold tracking-widest uppercase mb-2">Step 1 of 1</p>
            <h1 className="text-3xl font-bold text-gray-900">プロフィール設定</h1>
            <p className="text-gray-500 text-sm mt-1">レッスンをもっと楽しくするために教えてください</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">姓</label>
                <Input {...register("lastName")} placeholder="田中" />
                {errors.lastName && <p className="text-danger text-xs mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">名</label>
                <Input {...register("firstName")} placeholder="花子" />
                {errors.firstName && <p className="text-danger text-xs mt-1">{errors.firstName.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                メールアドレス <span className="text-gray-400">(任意)</span>
              </label>
              <Input {...register("email")} type="email" placeholder="hanako@example.com" />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">生年月日</label>
              <Input {...register("birthday")} type="date" />
              {errors.birthday && <p className="text-danger text-xs mt-1">{errors.birthday.message}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                興味のあるジャンル <span className="text-gray-400">(複数選択可)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    className={cn(
                      "px-4 py-2 rounded-pill text-xs font-bold transition-all border-2",
                      selectedGenres.includes(g.id)
                        ? `${g.color} text-white border-transparent shadow-glow-purple`
                        : "bg-transparent border-gray-300 text-gray-500 hover:border-gray-500"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "登録中..." : "始める →"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
