"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IconArrowLeft } from "@tabler/icons-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { ProfileMenu } from "@/app/_components/profile-menu";
import { useApiClient } from "@/lib/use-api-client";
import { ApiError } from "@/lib/api-client";
import type { Session } from "@/lib/types";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const apiClient = useApiClient();

  const {
    data: session,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["session", id],
    queryFn: () => apiClient<Session>(`/sessions/${id}`),
    enabled: Boolean(id),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 403) {
      router.replace("/sessions");
    }
  }, [error, router]);

  return (
    <main className="min-h-screen bg-secondary px-4 py-6 pb-24">
      <div className="mx-auto max-w-[440px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-[0.5px] border-zinc-300"
            >
              <IconArrowLeft size={15} />
            </button>
            <h1 className="truncate text-xl font-bold text-zinc-900">
              {session ? formatFullDate(session.started_at) : ""}
            </h1>
          </div>
          <ProfileMenu />
        </div>

        {isLoading && (
          <p className="mt-6 text-[13px] text-zinc-500">Chargement...</p>
        )}
        {isError && !(error instanceof ApiError && error.status === 403) && (
          <p className="mt-6 text-sm text-red-500">
            Impossible de charger cette séance.
          </p>
        )}

        {session && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-2 rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] p-4">
              <Metric
                value={`${durationMinutes(session.started_at, session.ended_at)}`}
                label="min"
              />
              <Metric value={`${session.exercises.length}`} label="exercices" />
              {session.session_rpe != null && (
                <Metric
                  value={`${session.session_rpe}`}
                  label="RPE"
                  valueClassName="text-[#0F6E56]"
                />
              )}
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {session.exercises
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((exercise) => (
                  <div
                    key={`${exercise.exercise_id}-${exercise.order}`}
                    className="rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-5 py-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[14px] font-medium text-zinc-900">
                        {exercise.exercise_name ?? exercise.exercise_id}
                      </h2>
                      {exercise.muscle_groups &&
                        exercise.muscle_groups.length > 0 && (
                          <span className="text-[11px] text-zinc-500">
                            {exercise.muscle_groups.join(", ")}
                          </span>
                        )}
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-zinc-500">
                      <span>#</span>
                      <span>Reps</span>
                      <span>Poids kg</span>
                      <span>RPE</span>
                    </div>

                    <div className="mt-1">
                      {exercise.sets.map((set, index) => (
                        <div
                          key={index}
                          className={`grid grid-cols-4 gap-2 py-[6px] text-[13px] text-zinc-900 ${
                            index < exercise.sets.length - 1
                              ? "border-b-[0.5px] border-zinc-200"
                              : ""
                          }`}
                        >
                          <span className="text-zinc-500">{index + 1}</span>
                          <span>{set.reps}</span>
                          <span>{set.weight_kg}</span>
                          <span>{set.rpe ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function Metric({
  value,
  label,
  valueClassName,
}: {
  value: string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-[20px] font-medium text-zinc-900 ${valueClassName ?? ""}`}>
        {value}
      </p>
      <p className="text-[10px] text-zinc-600">{label}</p>
    </div>
  );
}

function durationMinutes(startedAt: string, endedAt: string) {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

function formatFullDate(iso: string) {
  const formatted = new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
