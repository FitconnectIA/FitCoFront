"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { useApiClient } from "@/lib/use-api-client";
import { ApiError } from "@/lib/api-client";
import type { Streak } from "@/lib/types";

const STREAK_STALE_TIME = 1000 * 60 * 5;
const MAX_PAUSE_DAYS = 30;

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export function StreakCard() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseUntil, setPauseUntil] = useState("");

  const streakQuery = useQuery({
    queryKey: ["streak"],
    // Slash final : la route FastAPI est /v1/streak/ (évite un 307).
    queryFn: () => apiClient<Streak>("/streak/"),
    staleTime: STREAK_STALE_TIME,
  });

  const pauseMutation = useMutation({
    mutationFn: (untilDate: string) =>
      apiClient("/streak/pause", {
        method: "POST",
        body: JSON.stringify({ until_date: untilDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      setPauseModalOpen(false);
      setPauseUntil("");
      toast.success("Streak mis en pause");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Impossible de mettre le streak en pause.",
      );
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiClient("/streak/pause", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      toast.success("Streak repris");
    },
    onError: () => {
      toast.error("Impossible de reprendre le streak.");
    },
  });

  const streak = streakQuery.data;
  if (streakQuery.isLoading || streakQuery.isError || !streak) {
    // Le streak est un bonus du dashboard : pas d'état d'erreur bloquant.
    return null;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxPauseDate = new Date();
  maxPauseDate.setDate(maxPauseDate.getDate() + MAX_PAUSE_DAYS);

  return (
    <div className="mt-6 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[26px] font-bold leading-tight text-[#0F6E56]">
            {streak.current_streak}
          </p>
          <p className="text-[11px] text-zinc-500">Jours consécutifs</p>
        </div>
        <div className="text-center">
          <p className="text-[26px] font-bold leading-tight text-zinc-900">
            {streak.longest_streak}
          </p>
          <p className="text-[11px] text-zinc-500">Meilleur streak</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          {streak.is_paused ? (
            <span className="rounded-full border border-[#FAC775] bg-[#FAEEDA] px-2.5 py-1 text-[12px] font-medium text-[#B45309]">
              En pause
            </span>
          ) : (
            <span className="rounded-full border border-[#9FE1CB] bg-[#E1F5EE] px-2.5 py-1 text-[12px] font-medium text-[#085041]">
              Actif
            </span>
          )}
        </div>
      </div>

      {streak.is_paused && streak.paused_until && (
        <p className="mt-2 text-center text-[12px] text-zinc-500">
          Reprend le {formatDate(streak.paused_until)}
        </p>
      )}

      <div className="mt-3 border-t-[0.5px] border-zinc-200 pt-3">
        {streak.is_paused ? (
          <button
            type="button"
            onClick={() => resumeMutation.mutate()}
            disabled={resumeMutation.isPending}
            className="flex w-full items-center justify-center gap-1 text-[12px] font-medium text-[#0F6E56] disabled:opacity-50"
          >
            <IconPlayerPlay size={12} />
            Reprendre
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPauseModalOpen(true)}
            className="flex w-full items-center justify-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-700"
          >
            <IconPlayerPause size={12} />
            Mettre en pause
          </button>
        )}
      </div>

      {pauseModalOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setPauseModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] rounded-2xl bg-white p-6"
          >
            <h3 className="text-base font-bold text-zinc-900">
              Mettre le streak en pause
            </h3>
            <p className="mt-2 text-[13px] text-zinc-500">
              Ton streak est gelé jusqu&apos;à la date choisie (30 jours
              maximum), sans être brisé.
            </p>
            <input
              type="date"
              value={pauseUntil}
              min={toInputDate(tomorrow)}
              max={toInputDate(maxPauseDate)}
              onChange={(e) => setPauseUntil(e.target.value)}
              aria-label="Date de fin de pause du streak"
              className="mt-4 w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-[14px] text-zinc-900 outline-none focus:border-[#0F6E56]"
            />
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPauseModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-3 text-[13px] font-medium text-zinc-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => pauseMutation.mutate(pauseUntil)}
                disabled={!pauseUntil || pauseMutation.isPending}
                className="flex-1 rounded-xl bg-[#0F6E56] py-3 text-[13px] font-medium text-white disabled:bg-[#B4B2A9]"
              >
                {pauseMutation.isPending ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
