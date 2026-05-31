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
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, customerId: customer?.id }),
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "登録中..." : "始める →"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
