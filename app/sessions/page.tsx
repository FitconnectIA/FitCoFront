"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BottomNav } from "@/app/_components/bottom-nav";
import { ProfileMenu } from "@/app/_components/profile-menu";
import { useApiClient } from "@/lib/use-api-client";
import type { PaginatedResponse, Session } from "@/lib/types";

const PAGE_SIZE = 20;
const SESSIONS_STALE_TIME = 1000 * 60 * 5;

export default function SessionsPage() {
  const apiClient = useApiClient();

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["sessions"],
      queryFn: ({ pageParam }) =>
        apiClient<PaginatedResponse<Session>>(
          `/sessions?page=${pageParam}&limit=${PAGE_SIZE}`,
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page * lastPage.limit < lastPage.total
          ? lastPage.page + 1
          : undefined,
      staleTime: SESSIONS_STALE_TIME,
    });

  const sessions = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="min-h-screen bg-secondary px-4 py-6 pb-24">
      <div className="mx-auto max-w-[440px]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-4xl font-extrabold leading-tight text-zinc-900">
            Mes séances
          </h1>
          <ProfileMenu />
        </div>

        {isLoading && (
          <p className="mt-6 text-[13px] text-zinc-500">Chargement...</p>
        )}
        {isError && (
          <p className="mt-6 text-sm text-red-500">
            Impossible de charger l&apos;historique.
          </p>
        )}

        {!isLoading && sessions.length === 0 && (
          <p className="py-12 text-center text-[14px] text-zinc-500">
            Aucune séance enregistrée.
            <br />
            Log ta première séance !
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="flex items-center justify-between rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-5 py-[1.1rem]"
            >
              <div>
                <p className="text-[14px] font-medium text-zinc-900">
                  {formatDate(session.started_at)}
                </p>
                <p className="mt-1 text-[12px] text-zinc-500">
                  {session.muscle_groups.join(" · ")}
                </p>
              </div>
              {session.session_rpe != null && (
                <div className="text-right">
                  <p className="text-[20px] font-medium text-[#0F6E56]">
                    {session.session_rpe}
                  </p>
                  <p className="text-[10px] text-zinc-500">RPE</p>
                </div>
              )}
            </Link>
          ))}
        </div>

        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-4 w-full rounded-xl border border-zinc-300 bg-white py-3 text-[13px] font-medium text-zinc-700 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Chargement..." : "Voir plus"}
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
