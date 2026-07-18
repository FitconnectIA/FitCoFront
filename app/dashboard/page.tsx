"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconBarbell,
  IconFlask,
  IconPlus,
  IconRefresh,
  IconSalad,
  IconTrendingUp,
} from "@tabler/icons-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { ProfileMenu } from "@/app/_components/profile-menu";
import { StreakCard } from "@/app/_components/streak-card";
import { useApiClient } from "@/lib/use-api-client";
import { ApiError } from "@/lib/api-client";
import type {
  Recommendation,
  RecommendationSource,
  RecommendationSourceDetail,
} from "@/lib/types";

// Mirrors the backend Redis cache TTL for recommendation:{user_id}:{week_iso} (24h).
const RECOMMENDATION_STALE_TIME = 1000 * 60 * 60 * 24;
const MAX_DAILY_REGENERATIONS = 3;

function sourceForRule(
  sources: RecommendationSource[] | undefined,
  ruleId?: string | null,
) {
  if (!sources || !ruleId) {
    return undefined;
  }
  return sources.find((source) => source.rule_id === ruleId);
}

// "schoenfeld_2017" -> "Schoenfeld 2017"
function formatRuleLabel(ruleId: string) {
  return ruleId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function DashboardPage() {
  const { user } = useUser();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [activeSource, setActiveSource] = useState<RecommendationSource | null>(
    null,
  );
  const [regenerationsUsed, setRegenerationsUsed] = useState(0);

  const recommendationQuery = useQuery({
    queryKey: ["recommendations", "current"],
    queryFn: () => apiClient<Recommendation>("/recommendations/current"),
    staleTime: RECOMMENDATION_STALE_TIME,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const sourceDetailQuery = useQuery({
    queryKey: ["recommendations", "sources", activeSource?.rule_id],
    queryFn: () =>
      apiClient<RecommendationSourceDetail>(
        `/recommendations/sources/${activeSource?.rule_id}`,
      ),
    enabled: Boolean(activeSource),
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      apiClient<Recommendation>("/recommendations/regenerate", {
        method: "POST",
      }),
    onSuccess: () => {
      setRegenerationsUsed((n) => Math.min(n + 1, MAX_DAILY_REGENERATIONS));
      queryClient.invalidateQueries({ queryKey: ["recommendations", "current"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 429) {
        setRegenerationsUsed(MAX_DAILY_REGENERATIONS);
        toast.error("3 régénérations maximum par jour");
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Impossible de régénérer le programme.",
        );
      }
    },
  });

  const remainingRegenerations = Math.max(
    0,
    MAX_DAILY_REGENERATIONS - regenerationsUsed,
  );

  if (recommendationQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary">
        <p className="text-zinc-500">Génération de ton programme...</p>
      </main>
    );
  }

  if (recommendationQuery.isError) {
    const error = recommendationQuery.error;

    if (error instanceof ApiError && error.status === 403) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
          <p className="max-w-[360px] text-center text-[13px] text-zinc-500">
            Active le consentement santé dans tes paramètres pour accéder aux
            recommandations.
          </p>
        </main>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
        <p className="text-center text-sm text-red-500">
          Impossible de charger ton programme. Réessaie plus tard.
        </p>
      </main>
    );
  }

  const recommendation = recommendationQuery.data;
  if (!recommendation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#E1F5EE]">
              <IconBarbell size={18} className="text-[#0F6E56]" />
            </div>
            <span className="text-[15px] font-medium text-zinc-900">
              FitConnect
            </span>
          </div>
          <ProfileMenu />
        </div>

        <StreakCard />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/nutrition"
            className="flex items-center justify-center gap-1.5 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white py-2.5 text-[13px] font-medium text-zinc-700 hover:border-[#9FE1CB]"
          >
            <IconSalad size={15} className="text-[#0F6E56]" />
            Nutrition
          </Link>
          <Link
            href="/progress"
            className="flex items-center justify-center gap-1.5 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white py-2.5 text-[13px] font-medium text-zinc-700 hover:border-[#9FE1CB]"
          >
            <IconTrendingUp size={15} className="text-[#0F6E56]" />
            Progression
          </Link>
        </div>

        {recommendation.deload_week && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-[#FAC775] bg-[#FAEEDA] px-[1.1rem] py-[0.85rem]">
            <IconAlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-[#B45309]"
            />
            <p className="text-[13px] text-[#633806]">
              Semaine de décharge : ton RPE moyen était élevé sur tes 2
              dernières séances. Le volume est réduit de 20% pour favoriser la
              récupération.
            </p>
          </div>
        )}

        <p className="mt-6 text-[13px] text-zinc-500">
          Bonjour {user?.firstName ?? ""} 👋
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-zinc-900">
          Ton programme de la semaine
        </h1>

        <div className="mt-6 flex flex-col gap-4">
          {(recommendation.sessions ?? []).map((session, sessionIndex) => (
            <div
              key={session.date ?? sessionIndex}
              className="rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-medium text-zinc-900">
                  {formatSessionTitle(session.date, session.title)}
                </h2>
                <span className="text-[12px] text-zinc-500">
                  {(session.exercises ?? []).length} exercices
                </span>
              </div>

              <div className="mt-2">
                {(session.exercises ?? []).map((exercise, index) => {
                  const source = sourceForRule(
                    recommendation.sources,
                    exercise.source_rule,
                  );
                  return (
                    <div
                      key={`${exercise.exercise_id}-${index}`}
                      className={`flex items-center justify-between gap-2 py-[6px] text-[13px] ${
                        index < (session.exercises?.length ?? 0) - 1
                          ? "border-b-[0.5px] border-zinc-200"
                          : ""
                      }`}
                    >
                      <span className="text-zinc-900">
                        {exercise.name ?? exercise.exercise_id}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-500">
                          {exercise.sets}×{exercise.reps}
                        </span>
                        {source && (
                          <button
                            type="button"
                            onClick={() => setActiveSource(source)}
                            className="flex items-center gap-1 rounded-full border border-[#9FE1CB] bg-[#E1F5EE] px-[7px] py-[3px] text-[11px] font-medium text-[#085041]"
                          >
                            <IconFlask size={12} />
                            {formatRuleLabel(source.rule_id)}
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Link
                href={`/sessions/new?reco=${session.date}`}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] py-2.5 text-[13px] font-medium text-[#085041] hover:opacity-90"
              >
                <IconPlus size={14} />
                Logger cette séance
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => regenerateMutation.mutate()}
            disabled={
              remainingRegenerations === 0 || regenerateMutation.isPending
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconRefresh size={16} />
            Régénérer ({remainingRegenerations})
          </button>
          <Link
            href="/sessions/new"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F6E56] px-4 py-3 text-[13px] font-medium text-white"
          >
            <IconPlus size={16} />
            Logger
          </Link>
        </div>
      </div>

      {activeSource && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setActiveSource(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] rounded-2xl bg-white p-6"
          >
            <h3 className="text-base font-bold text-zinc-900">
              {activeSource.study_reference}
            </h3>
            {sourceDetailQuery.isLoading && (
              <p className="mt-3 text-[13px] text-zinc-500">Chargement...</p>
            )}
            {sourceDetailQuery.isError && (
              <p className="mt-3 text-[13px] text-red-500">
                Impossible de charger le détail de cette source.
              </p>
            )}
            {sourceDetailQuery.data && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-[13px] text-zinc-500">
                  {sourceDetailQuery.data.summary}
                </p>
                <p className="text-[13px] text-zinc-400">
                  {sourceDetailQuery.data.journal}, {sourceDetailQuery.data.year}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setActiveSource(null)}
              className="mt-5 w-full rounded-xl border border-zinc-200 py-3 text-[13px] font-medium text-zinc-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function formatSessionTitle(date?: string, title?: string) {
  const parsed = date ? new Date(date) : null;
  const dayLabel =
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleDateString("fr-FR", { weekday: "long" })
      : date ?? "";
  const capitalized = dayLabel
    ? dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)
    : "";
  return [capitalized, title].filter(Boolean).join(" — ");
}
