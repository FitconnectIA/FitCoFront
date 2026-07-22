"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconCopy,
  IconDownload,
  IconLogout,
} from "@tabler/icons-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { useApiClient } from "@/lib/use-api-client";
import type {
  ExportFormat,
  ExportRequestResponse,
  ExportStatusResponse,
  NotificationPreferences,
  UserProfile,
} from "@/lib/types";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

const GOAL_LABELS: Record<string, string> = {
  strength: "Force",
  hypertrophy: "Prise de muscle",
  weight_loss: "Perte de poids",
  endurance: "Endurance",
};

const PREFERENCE_LABELS: { key: keyof NotificationPreferences; label: string; hint: string }[] = [
  { key: "session_reminders", label: "Rappels de séance", hint: "Le matin d'un jour d'entraînement prévu" },
  { key: "streak_alerts", label: "Streak en danger", hint: "À 18h si tu n'as pas encore logué" },
  { key: "badge_unlocks", label: "Nouveaux badges", hint: "Quand tu débloques un badge" },
];

function initialsFrom(name?: string | null, email?: string | null) {
  const source = name?.trim() || email || "";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p.charAt(0)).join("");
  return initials.toUpperCase() || "?";
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? "bg-[#0F6E56]" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const [exportJob, setExportJob] = useState<{ id: string; format: ExportFormat } | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => apiClient<UserProfile>("/users/me"),
  });

  const prefsQuery = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => apiClient<NotificationPreferences>("/notifications/preferences"),
    staleTime: 1000 * 60 * 5,
  });

  const updatePrefs = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) =>
      apiClient<NotificationPreferences>("/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: (data) => queryClient.setQueryData(["notification-preferences"], data),
    onError: () => toast.error("Mise à jour des préférences impossible."),
  });

  const requestExport = useMutation({
    mutationFn: (format: ExportFormat) =>
      apiClient<ExportRequestResponse>("/export/request", {
        method: "POST",
        body: JSON.stringify({ format }),
      }),
    onSuccess: (data, format) => {
      setDownloaded(false);
      setExportJob({ id: data.export_id, format });
    },
    onError: () => toast.error("Impossible de lancer l'export."),
  });

  const statusQuery = useQuery({
    queryKey: ["export-status", exportJob?.id],
    queryFn: () => apiClient<ExportStatusResponse>(`/export/${exportJob!.id}/status`),
    enabled: Boolean(exportJob),
    refetchInterval: (query) =>
      query.state.data?.status === "processing" ? 1500 : false,
  });

  const deleteAccount = useMutation({
    mutationFn: () => apiClient("/users/me", { method: "DELETE" }),
    onSuccess: async () => {
      queryClient.clear();
      await signOut({ redirectUrl: "/sign-out" });
    },
    onError: () => toast.error("Suppression du compte impossible."),
  });

  async function downloadExport(id: string, format: ExportFormat) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = await getToken();
    const response = await fetch(`${baseUrl}/export/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      toast.error("Téléchargement impossible.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fitconnect_export.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé");
  }

  useEffect(() => {
    if (!exportJob) {
      return;
    }
    const status = statusQuery.data?.status;
    if (status === "ready" && !downloaded) {
      setDownloaded(true);
      void downloadExport(exportJob.id, exportJob.format);
    } else if (status === "failed") {
      toast.error("L'export a échoué. Réessaie.");
      setExportJob(null);
    }
    // downloadExport is stable enough for this effect's purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusQuery.data, exportJob, downloaded]);

  const profile = profileQuery.data;
  const prefs = prefsQuery.data;
  const isExporting =
    requestExport.isPending || statusQuery.data?.status === "processing";

  function copyInviteCode() {
    if (!profile?.invite_code) return;
    navigator.clipboard
      .writeText(profile.invite_code)
      .then(() => toast.success("Code copié"))
      .catch(() => toast.error("Copie impossible"));
  }

  return (
    <main className="min-h-screen bg-secondary px-4 py-6 pb-24">
      <div className="mx-auto max-w-[440px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-[0.5px] border-zinc-300"
          >
            <IconArrowLeft size={15} />
          </button>
          <h1 className="text-xl font-bold text-zinc-900">Mon profil</h1>
        </div>

        {/* Profil */}
        {profile && (
          <div className="mt-6 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E1F5EE]">
                <span className="text-[16px] font-medium text-[#0F6E56]">
                  {initialsFrom(profile.display_name, profile.email)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-zinc-900">
                  {profile.display_name || "Utilisateur"}
                </p>
                <p className="truncate text-[13px] text-zinc-500">{profile.email}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full border border-[#9FE1CB] bg-[#E1F5EE] px-2.5 py-1 text-[11px] font-medium text-[#085041]">
                {LEVEL_LABELS[profile.level] ?? profile.level}
              </span>
              <span className="rounded-full border border-[#9FE1CB] bg-[#E1F5EE] px-2.5 py-1 text-[11px] font-medium text-[#085041]">
                {GOAL_LABELS[profile.goal] ?? profile.goal}
              </span>
            </div>
          </div>
        )}

        {/* Code d'invitation */}
        {profile?.invite_code && (
          <div className="mt-4 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
            <p className="text-[13px] font-medium text-zinc-900">Code d&apos;invitation</p>
            <p className="mt-1 text-[12px] text-zinc-500">
              Partage ce code pour que tes amis t&apos;ajoutent.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[15px] font-mono tracking-wider text-zinc-900">
                {profile.invite_code}
              </code>
              <button
                type="button"
                onClick={copyInviteCode}
                aria-label="Copier le code"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:text-[#0F6E56]"
              >
                <IconCopy size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Préférences de notifications */}
        <div className="mt-4 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
          <p className="text-[13px] font-medium text-zinc-900">Notifications</p>
          {prefsQuery.isLoading && (
            <p className="mt-2 text-[13px] text-zinc-500">Chargement...</p>
          )}
          {prefs && (
            <div className="mt-3 flex flex-col gap-3">
              {PREFERENCE_LABELS.map(({ key, label, hint }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-zinc-900">{label}</p>
                    <p className="text-[11px] text-zinc-500">{hint}</p>
                  </div>
                  <Toggle
                    checked={prefs[key]}
                    disabled={updatePrefs.isPending}
                    onChange={() => updatePrefs.mutate({ [key]: !prefs[key] })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export RGPD */}
        <div className="mt-4 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
          <p className="text-[13px] font-medium text-zinc-900">Exporter mes données</p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Télécharge l&apos;intégralité de tes données personnelles (RGPD Art. 20).
          </p>
          <div className="mt-3 flex gap-2">
            {(["json", "csv"] as ExportFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                disabled={isExporting}
                onClick={() => requestExport.mutate(format)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white py-2.5 text-[13px] font-medium text-zinc-700 hover:border-[#9FE1CB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IconDownload size={15} />
                {format.toUpperCase()}
              </button>
            ))}
          </div>
          {isExporting && (
            <p className="mt-2 text-[12px] text-zinc-500">Génération en cours...</p>
          )}
        </div>

        {/* Déconnexion / compte */}
        <div className="mt-4 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/sign-out" })}
            className="flex w-full items-center gap-2 py-1 text-[13px] font-medium text-zinc-700"
          >
            <IconLogout size={16} />
            Se déconnecter
          </button>
          <div className="my-2 border-t-[0.5px] border-zinc-200" />
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-2 py-1 text-[13px] font-medium text-[#DC2626]"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] rounded-2xl bg-white p-6"
          >
            <h3 className="text-base font-bold text-zinc-900">Supprimer ton compte ?</h3>
            <p className="mt-2 text-[13px] text-zinc-500">
              Tes données seront supprimées (soft delete 30 jours, RGPD Art. 17).
              Cette action te déconnecte immédiatement.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-3 text-[13px] font-medium text-zinc-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => deleteAccount.mutate()}
                disabled={deleteAccount.isPending}
                className="flex-1 rounded-xl bg-[#DC2626] py-3 text-[13px] font-medium text-white disabled:opacity-60"
              >
                {deleteAccount.isPending ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
