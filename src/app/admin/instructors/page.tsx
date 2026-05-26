"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** This page is no longer used in the room-rental model. Redirect to admin home. */
export default function AdminInstructorsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin"); }, [router]);
  return null;
}
