"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { mapAuthErrorFromSearchParams } from "@/lib/auth/map-auth-error";

export function useAuthNoticeFromUrl(): string | null {
  const searchParams = useSearchParams();

  return useMemo(
    () => mapAuthErrorFromSearchParams(searchParams),
    [searchParams],
  );
}
