"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconCheck,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { ProfileMenu } from "@/app/_components/profile-menu";
import { useApiClient } from "@/lib/use-api-client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { ApiError } from "@/lib/api-client";
import type {
  Exercise,
  ExercisesResponse,
  NewSessionPayload,
  Recommendation,
  Session,
  SessionSource,
} from "@/lib/types";

// Aligné sur le TTL du cache Redis backend (24h), comme sur le dashboard.
const RECOMMENDATION_STALE_TIME = 1000 * 60 * 60 * 24;

type SetDraft = {
  key: string;
  reps: string;
  weight_kg: string;
  rpe: string;
};

type ExerciseDraft = {
  exercise_id: string;
  exercise_name: string;
  sets: SetDraft[];
};

function createEmptySet(): SetDraft {
  return { key: crypto.randomUUID(), reps: "", weight_kg: "", rpe: "" };
}

function NewSessionForm() {
  const router = useRouter();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  // Date (YYYY-MM-DD) de la séance recommandée à pré-remplir, si on arrive
  // depuis le bouton « Logger cette séance » du dashboard.
  const recoDate = searchParams.get("reco");

  const [startedAt] = useState(() => new Date().toISOString());
  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [sessionRpe, setSessionRpe] = useState(7);
  const [source, setSource] = useState<SessionSource>("manual");
  const [formError, setFormError] = useState<string | null>(null);
  const prefilledRef = useRef(false);

  const recommendationQuery = useQuery({
    queryKey: ["recommendations", "current"],
    queryFn: () => apiClient<Recommendation>("/recommendations/current"),
    enabled: Boolean(recoDate),
    staleTime: RECOMMENDATION_STALE_TIME,
  });

  useEffect(() => {
    if (!recoDate || prefilledRef.current || !recommendationQuery.data) {
      return;
    }
    const recoSession = recommendationQuery.data.sessions.find(
      (s) => s.date === recoDate,
    );
    if (!recoSession) {
      return;
    }
    prefilledRef.current = true;
    setSource("recommended");
    setExercises(
      recoSession.exercises
        // Les placeholders ("recommended-<muscle>-<i>") ne sont pas des
        // exercices du catalogue : ils ne peuvent pas être logués.
        .filter((e) => !e.exercise_id.startsWith("recommended-"))
        .map((e) => ({
          exercise_id: e.exercise_id,
          exercise_name: e.name ?? "Exercice",
          sets: Array.from({ length: Math.max(1, e.sets) }, createEmptySet),
        })),
    );
  }, [recoDate, recommendationQuery.data]);

  const debouncedSearch = useDebouncedValue(search, 300);
  const showDropdown = debouncedSearch.trim().length > 1;

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["exercises", debouncedSearch],
    queryFn: () =>
      apiClient<ExercisesResponse>(
        `/exercises?search=${encodeURIComponent(debouncedSearch)}`,
      ),
    enabled: showDropdown,
  });

  const mutation = useMutation({
    mutationFn: (payload: NewSessionPayload) =>
      apiClient<Session>("/sessions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Séance enregistrée");
      router.push("/dashboard");
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Impossible d'enregistrer la séance. Réessaie.",
      );
    },
  });

  function addExercise(exercise: Exercise) {
    setExercises((prev) => {
      if (prev.some((e) => e.exercise_id === exercise.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          sets: [createEmptySet()],
        },
      ];
    });
    setSearch("");
  }

  function removeExercise(exIndex: number) {
    setExercises((prev) => prev.filter((_, i) => i !== exIndex));
  }

  function addSet(exIndex: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: [...ex.sets, createEmptySet()] } : ex,
      ),
    );
  }

  function updateSet(
    exIndex: number,
    setKey: string,
    patch: Partial<Pick<SetDraft, "reps" | "weight_kg" | "rpe">>,
  ) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.key === setKey ? { ...s, ...patch } : s,
              ),
            }
          : ex,
      ),
    );
  }

  function handleSubmit() {
    setFormError(null);

    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        if (set.rpe !== "" && (Number(set.rpe) < 1 || Number(set.rpe) > 10)) {
          setFormError("Le RPE doit être compris entre 1 et 10.");
          return;
        }
        if (set.weight_kg !== "" && Number(set.weight_kg) < 0) {
          setFormError("Le poids ne peut pas être négatif.");
          return;
        }
      }
    }

    const payloadExercises = exercises
      .map((ex, index) => ({
        exercise_id: ex.exercise_id,
        order: index + 1,
        sets: ex.sets
          .filter((s) => s.reps !== "" && s.weight_kg !== "")
          .map((s) => ({
            reps: Number(s.reps),
            weight_kg: Number(s.weight_kg),
            ...(s.rpe !== "" ? { rpe: Number(s.rpe) } : {}),
          })),
      }))
      .filter((ex) => ex.sets.length > 0);

    if (payloadExercises.length === 0) {
      setFormError(
        "Ajoute au moins un exercice avec une série complète (reps + poids).",
      );
      return;
    }

    mutation.mutate({
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      session_rpe: sessionRpe,
      source,
      exercises: payloadExercises,
    });
  }

  return (
    <main className="min-h-screen bg-secondary px-4 py-6 pb-28">
      <div className="mx-auto max-w-[480px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="flex h-8 w-8 items-center justify-center rounded-md border-[0.5px] border-zinc-300"
            >
              <IconArrowLeft size={15} />
            </button>
            <h1 className="text-xl font-bold text-zinc-900">Nouvelle séance</h1>
          </div>
          <ProfileMenu />
        </div>

        {recoDate && exercises.length > 0 && (
          <div className="mt-4 rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] px-4 py-3 text-[13px] text-[#085041]">
            Séance de ton programme pré-remplie — renseigne les répétitions et
            poids réellement effectués.
          </div>
        )}

        <div className="relative mt-6">
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un exercice…"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0F6E56]"
          />
          {showDropdown && (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border-[0.5px] border-zinc-300 bg-white shadow-sm">
              {isSearching && (
                <div className="px-[14px] py-[10px] text-[13px] text-zinc-500">
                  Recherche...
                </div>
              )}
              {!isSearching && searchResults?.items.length === 0 && (
                <div className="px-[14px] py-[10px] text-[13px] text-zinc-500">
                  Aucun exercice trouvé
                </div>
              )}
              {!isSearching &&
                searchResults?.items.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => addExercise(exercise)}
                    className={`flex w-full items-center justify-between px-[14px] py-[10px] text-left text-[13px] text-zinc-900 hover:bg-[#E1F5EE] ${
                      index < (searchResults?.items.length ?? 0) - 1
                        ? "border-b border-zinc-100"
                        : ""
                    }`}
                  >
                    <span>{exercise.name}</span>
                    <span className="text-zinc-500">
                      {exercise.muscle_groups.join(", ")}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {exercises.map((exercise, exIndex) => (
            <div
              key={exercise.exercise_id}
              className="rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-medium text-zinc-900">
                  {exercise.exercise_name}
                </h2>
                <button
                  type="button"
                  onClick={() => removeExercise(exIndex)}
                  aria-label="Retirer l'exercice"
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-md border-[0.5px] border-zinc-300 text-zinc-500 hover:text-red-500"
                >
                  <IconX size={14} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-[28px_1fr_1fr_1fr] gap-2 text-[11px] text-zinc-500">
                <span className="text-center">#</span>
                <span>Reps</span>
                <span>Poids</span>
                <span>RPE</span>
              </div>

              <div className="mt-1 flex flex-col gap-2">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={set.key}
                    className="grid grid-cols-[28px_1fr_1fr_1fr] items-center gap-2"
                  >
                    <span className="text-center text-[11px] text-zinc-500">
                      {setIndex + 1}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(exIndex, set.key, { reps: e.target.value })
                      }
                      className="w-full rounded-md border border-zinc-300 bg-white px-[6px] py-[7px] text-center text-[13px] text-zinc-900 outline-none focus:border-[#0F6E56]"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.5"
                      value={set.weight_kg}
                      onChange={(e) =>
                        updateSet(exIndex, set.key, {
                          weight_kg: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-zinc-300 bg-white px-[6px] py-[7px] text-center text-[13px] text-zinc-900 outline-none focus:border-[#0F6E56]"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10}
                      value={set.rpe}
                      onChange={(e) =>
                        updateSet(exIndex, set.key, { rpe: e.target.value })
                      }
                      className="w-full rounded-md border border-zinc-300 bg-white px-[6px] py-[7px] text-center text-[13px] text-zinc-900 outline-none focus:border-[#0F6E56]"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addSet(exIndex)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-zinc-300 p-2 text-[12px] font-medium text-zinc-500 hover:border-[#0F6E56] hover:text-[#0F6E56]"
              >
                <IconPlus size={13} />
                Ajouter une série
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => searchInputRef.current?.focus()}
          className="mt-4 w-full rounded-2xl border border-dashed border-zinc-300 py-3 text-[13px] font-medium text-zinc-500 hover:border-[#0F6E56] hover:text-[#0F6E56]"
        >
          Ajouter un exercice
        </button>

        <div className="mt-4 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-5 py-4">
          <p className="text-[13px] font-bold text-zinc-900">
            Ressenti global (RPE)
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[13px] text-zinc-500">Facile</span>
            <input
              type="range"
              min={1}
              max={10}
              value={sessionRpe}
              onChange={(e) => setSessionRpe(Number(e.target.value))}
              className="flex-1 accent-[#0F6E56]"
            />
            <span className="text-[13px] text-zinc-500">Max</span>
            <span className="w-6 text-center font-medium text-zinc-900">
              {sessionRpe}
            </span>
          </div>
        </div>

        {formError && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-600">
            {formError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F6E56] px-4 py-4 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <IconCheck size={16} />
          {mutation.isPending ? "Enregistrement..." : "Terminer la séance"}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}

// useSearchParams impose une frontière Suspense pour le prérendu statique.
export default function NewSessionPage() {
  return (
    <Suspense fallback={null}>
      <NewSessionForm />
    </Suspense>
  );
}
