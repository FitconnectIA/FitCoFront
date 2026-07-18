"use client";

import { useQuery } from "@tanstack/react-query";
import { IconFlask } from "@tabler/icons-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { ProfileMenu } from "@/app/_components/profile-menu";
import { useApiClient } from "@/lib/use-api-client";
import type {
  NutritionAdviceObjective,
  NutritionAdviceToday,
  NutritionMacroFocus,
  NutritionTriggerContext,
} from "@/lib/types";

const TODAY_STALE_TIME = 1000 * 60 * 30;
const OBJECTIVE_STALE_TIME = 1000 * 60 * 60 * 24;

const CONTEXT_BADGES: Record<
  NutritionTriggerContext,
  { label: string; className: string }
> = {
  post_workout: {
    label: "Post-entraînement",
    className: "border-[#9FE1CB] bg-[#E1F5EE] text-[#085041]",
  },
  pre_workout: {
    label: "Pré-entraînement",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  rest_day: {
    label: "Jour de repos",
    className: "border-[#FAC775] bg-[#FAEEDA] text-[#B45309]",
  },
  general: {
    label: "Général",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
  },
};

const MACRO_LABELS: Record<NutritionMacroFocus, string> = {
  protein: "Protéines",
  carbs: "Glucides",
  hydration: "Hydratation",
  balanced: "Équilibré",
};

function MacroBadge({ focus }: { focus: NutritionMacroFocus }) {
  return (
    <span className="rounded-full border border-[#9FE1CB] bg-[#E1F5EE] px-2.5 py-1 text-[11px] font-medium text-[#085041]">
      {MACRO_LABELS[focus]}
    </span>
  );
}

export default function NutritionPage() {
  const apiClient = useApiClient();

  const todayQuery = useQuery({
    queryKey: ["nutrition", "today"],
    queryFn: () => apiClient<NutritionAdviceToday>("/nutrition/advice/today"),
    staleTime: TODAY_STALE_TIME,
  });

  const objectiveQuery = useQuery({
    queryKey: ["nutrition", "objective"],
    queryFn: () =>
      apiClient<NutritionAdviceObjective>("/nutrition/advice/objective"),
    staleTime: OBJECTIVE_STALE_TIME,
  });

  const today = todayQuery.data;
  const objective = objectiveQuery.data;

  return (
    <main className="min-h-screen bg-secondary px-4 py-6 pb-24">
      <div className="mx-auto max-w-[440px]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-4xl font-extrabold leading-tight text-zinc-900">
            Nutrition
          </h1>
          <ProfileMenu />
        </div>

        {todayQuery.isLoading && (
          <p className="mt-6 text-[13px] text-zinc-500">Chargement...</p>
        )}
        {todayQuery.isError && (
          <p className="mt-6 text-sm text-red-500">
            Impossible de charger le conseil du jour.
          </p>
        )}

        {today && (
          <div className="mt-6 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
            <span
              className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-medium ${CONTEXT_BADGES[today.trigger_context].className}`}
            >
              {CONTEXT_BADGES[today.trigger_context].label}
            </span>

            <p className="mt-3 text-[14px] leading-relaxed text-zinc-900">
              {today.advice_text}
            </p>

            {today.source_reference && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#9FE1CB] bg-[#E1F5EE] px-[7px] py-[3px] text-[11px] font-medium text-[#085041]">
                <IconFlask size={12} />
                {today.source_reference}
              </span>
            )}

            <p className="mt-4 border-t-[0.5px] border-zinc-200 pt-3 text-[12px] italic text-zinc-500">
              {today.disclaimer}
            </p>
          </div>
        )}

        {objectiveQuery.isError && (
          <p className="mt-4 text-sm text-red-500">
            Impossible de charger le conseil selon ton objectif.
          </p>
        )}

        {objective && (
          <div className="mt-4 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-medium text-zinc-900">
                Conseil selon ton objectif
              </h2>
              <MacroBadge focus={objective.macro_focus} />
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-900">
              {objective.advice_text}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
