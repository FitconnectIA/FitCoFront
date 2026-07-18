"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useApiClient } from "@/lib/use-api-client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const fetchAPI = useApiClient();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasSynced.current) {
      return;
    }
    hasSynced.current = true;

    fetchAPI<{ onboarding_completed: boolean }>("/auth/sync", {
      method: "POST",
    })
      .then(({ onboarding_completed }) => {
        router.replace(onboarding_completed ? "/dashboard" : "/onboarding");
      })
      .catch(() => {
        hasSynced.current = false;
      });
  }, [isLoaded, isSignedIn, fetchAPI, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="flex w-full max-w-[440px] flex-col items-center">
        {children}
      </div>
    </main>
  );
}
