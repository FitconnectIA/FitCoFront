"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BottomNav } from "@/app/_components/bottom-nav";
import { ProfileMenu } from "@/app/_components/profile-menu";
import { useApiClient } from "@/lib/use-api-client";
import type {
  ExerciseProgress,
  ExercisesResponse,
  RpeTrend,
  WeeklyVolume,
} from "@/lib/types";

const PROGRESS_STALE_TIME = 1000 * 60 * 5;
const RPE_WARNING_THRESHOLD = 8;

// Palette pour distinguer les groupes musculaires dans le BarChart.
const MUSCLE_COLORS = [
  "#0F6E56",
  "#5DCAA5",
  "#3B82F6",
  "#B45309",
  "#8B5CF6",
  "#DC2626",
  "#0891B2",
  "#65A30D",
];

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
      <h2 className="text-[14px] font-medium text-zinc-900">{title}</h2>
      {children}
    </div>
  );
}

function ChartState({ query, empty }: { query: { isLoading: boolean; isError: boolean }; empty: boolean }) {
  if (query.isLoading) {
    return <p className="mt-3 text-[13px] text-zinc-500">Chargement...</p>;
  }
  if (query.isError) {
    return (
      <p className="mt-3 text-[13px] text-red-500">
        Impossible de charger les données.
      </p>
    );
  }
  if (empty) {
    return (
      <p className="mt-3 text-[13px] text-zinc-500">
        Pas encore de données — logue quelques séances !
      </p>
    );
  }
  return null;
}

export default function ProgressPage() {
  const apiClient = useApiClient();
  const router = useRouter();
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  // Catalogue chargé une seule fois pour alimenter le select.
  const exercisesQuery = useQuery({
    queryKey: ["exercises", "all"],
    queryFn: () => apiClient<ExercisesResponse>("/exercises"),
    staleTime: Infinity,
  });

  const exerciseProgressQuery = useQuery({
    queryKey: ["progress", "exercise", selectedExerciseId],
    queryFn: () =>
      apiClient<ExerciseProgress>(
        `/progress/exercise/${selectedExerciseId}`,
      ),
    enabled: Boolean(selectedExerciseId),
    staleTime: PROGRESS_STALE_TIME,
  });

  const volumeQuery = useQuery({
    queryKey: ["progress", "volume"],
    queryFn: () => apiClient<WeeklyVolume>("/progress/volume?weeks=8"),
    staleTime: PROGRESS_STALE_TIME,
  });

  const rpeTrendQuery = useQuery({
    queryKey: ["progress", "rpe-trend"],
    queryFn: () => apiClient<RpeTrend>("/progress/rpe-trend"),
    staleTime: PROGRESS_STALE_TIME,
  });

  const exerciseData = useMemo(
    () =>
      (exerciseProgressQuery.data?.data_points ?? []).map((point) => ({
        ...point,
        label: formatShortDate(point.date),
      })),
    [exerciseProgressQuery.data],
  );

  const { volumeData, muscleGroups } = useMemo(() => {
    const weeks = volumeQuery.data?.weekly_data ?? [];
    const groups = Array.from(
      new Set(weeks.flatMap((week) => Object.keys(week.muscle_groups))),
    ).sort();
    const rows = weeks.map((week) => ({
      week: formatShortDate(week.week_start),
      ...week.muscle_groups,
    }));
    return { volumeData: rows, muscleGroups: groups };
  }, [volumeQuery.data]);

  const rpeData = useMemo(
    () =>
      (rpeTrendQuery.data?.data_points ?? []).map((point) => ({
        ...point,
        label: formatShortDate(point.week_start),
      })),
    [rpeTrendQuery.data],
  );

  // Warning si le RPE moyen dépasse 8 sur les 2 dernières semaines.
  const highRpe = useMemo(() => {
    const lastTwo = rpeData.slice(-2);
    return (
      lastTwo.length === 2 &&
      lastTwo.every((point) => point.avg_rpe > RPE_WARNING_THRESHOLD)
    );
  }, [rpeData]);

  const personalRecord = exerciseProgressQuery.data?.personal_record;

  return (
    <main className="min-h-screen bg-secondary px-4 py-6 pb-24">
      <div className="mx-auto max-w-[440px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-[0.5px] border-zinc-300"
            >
              <IconArrowLeft size={15} />
            </button>
            <h1 className="text-4xl font-extrabold leading-tight text-zinc-900">
              Progression
            </h1>
          </div>
          <ProfileMenu />
        </div>

        <SectionCard title="Évolution par exercice">
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="mt-3 w-full appearance-none rounded-md border border-zinc-300 bg-white px-4 py-3 text-[13px] text-zinc-900 outline-none focus:border-[#0F6E56]"
          >
            <option value="">Choisis un exercice…</option>
            {(exercisesQuery.data?.items ?? []).map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>

          {selectedExerciseId && (
            <>
              <ChartState
                query={exerciseProgressQuery}
                empty={exerciseData.length === 0}
              />

              {personalRecord && (
                <div className="mt-4 rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] p-4 text-center">
                  <p className="text-[26px] font-bold leading-tight text-[#0F6E56]">
                    {personalRecord.weight_kg} kg
                  </p>
                  <p className="mt-1 text-[11px] text-[#085041]">
                    Record personnel — {formatLongDate(personalRecord.achieved_at)}
                  </p>
                </div>
              )}

              {exerciseData.length > 0 && (
                <div className="mt-4 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exerciseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        unit=" kg"
                        width={55}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} kg`, "Charge max"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="max_weight_kg"
                        stroke="#0F6E56"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#0F6E56", cursor: "pointer" }}
                        activeDot={{ r: 5, cursor: "pointer" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard title="Volume hebdomadaire">
          <ChartState query={volumeQuery} empty={volumeData.length === 0} />
          {volumeData.length > 0 && (
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {muscleGroups.map((group, index) => (
                    <Bar
                      key={group}
                      dataKey={group}
                      fill={MUSCLE_COLORS[index % MUSCLE_COLORS.length]}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Tendance RPE">
          {highRpe && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#FAC775] bg-[#FAEEDA] px-[1.1rem] py-[0.85rem]">
              <IconAlertTriangle
                size={16}
                className="mt-0.5 shrink-0 text-[#B45309]"
              />
              <p className="text-[13px] text-[#633806]">
                Ton RPE est élevé — envisage une semaine de récupération.
              </p>
            </div>
          )}
          <ChartState query={rpeTrendQuery} empty={rpeData.length === 0} />
          {rpeData.length > 0 && (
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rpeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={30} domain={[0, 10]} />
                  <Tooltip formatter={(value) => [value, "RPE moyen"]} />
                  <Line
                    type="monotone"
                    dataKey="avg_rpe"
                    stroke="#B45309"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#B45309" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      <BottomNav />
    </main>
  );
}
