"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconCheck,
  IconFlame,
  IconTrophy,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { useApiClient } from "@/lib/use-api-client";
import { ApiError } from "@/lib/api-client";
import type {
  FriendFeed,
  FriendList,
  IncomingFriendRequestList,
  Leaderboard,
  UserProfile,
} from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[15px] font-bold text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [inviteCode, setInviteCode] = useState("");

  const meQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => apiClient<UserProfile>("/users/me"),
  });

  const requestsQuery = useQuery({
    queryKey: ["friends", "requests"],
    queryFn: () => apiClient<IncomingFriendRequestList>("/friends/requests"),
  });

  const friendsQuery = useQuery({
    queryKey: ["friends", "list"],
    queryFn: () => apiClient<FriendList>("/friends"),
  });

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", "weekly"],
    queryFn: () => apiClient<Leaderboard>("/leaderboard/weekly"),
  });

  const feedQuery = useQuery({
    queryKey: ["friends", "feed"],
    queryFn: () => apiClient<FriendFeed>("/friends/feed"),
  });

  const sendRequest = useMutation({
    mutationFn: (code: string) =>
      apiClient("/friends/requests", {
        method: "POST",
        body: JSON.stringify({ recipient_invite_code: code }),
      }),
    onSuccess: () => {
      setInviteCode("");
      toast.success("Demande envoyée");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Vous êtes déjà liés (ou demande en cours)");
      } else if (error instanceof ApiError && error.status === 400) {
        toast.error("Code d'invitation invalide");
      } else {
        toast.error("Impossible d'envoyer la demande");
      }
    },
  });

  const respondRequest = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "declined" }) =>
      apiClient(`/friends/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    },
    onError: () => toast.error("Action impossible"),
  });

  function handleSend() {
    const code = inviteCode.trim().toUpperCase();
    if (code.length < 4) {
      toast.error("Entre un code d'invitation valide");
      return;
    }
    sendRequest.mutate(code);
  }

  const requests = requestsQuery.data?.items ?? [];
  const friends = friendsQuery.data?.items ?? [];
  const rankings = leaderboardQuery.data?.rankings ?? [];
  const feed = feedQuery.data?.items ?? [];
  const myId = meQuery.data?.id;

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
          <h1 className="text-xl font-bold text-zinc-900">Communauté</h1>
        </div>

        {/* Ajouter un ami */}
        <div className="mt-6 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
          <p className="text-[13px] font-medium text-zinc-900">Ajouter un ami</p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Entre le code d&apos;invitation de ton ami (le tien est sur ton profil).
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Code d'invitation"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-[14px] tracking-wider text-zinc-900 outline-none focus:border-[#0F6E56]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sendRequest.isPending}
              className="flex items-center gap-1.5 rounded-md bg-[#0F6E56] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              <IconUserPlus size={15} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Demandes reçues */}
        {requests.length > 0 && (
          <Section title="Demandes reçues">
            <div className="mt-3 flex flex-col gap-2">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="flex items-center justify-between gap-2 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-4 py-3"
                >
                  <span className="text-[14px] font-medium text-zinc-900">
                    {request.display_name || "Utilisateur"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label="Accepter"
                      disabled={respondRequest.isPending}
                      onClick={() =>
                        respondRequest.mutate({ id: request.request_id, status: "accepted" })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F6E56] text-white disabled:opacity-50"
                    >
                      <IconCheck size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Refuser"
                      disabled={respondRequest.isPending}
                      onClick={() =>
                        respondRequest.mutate({ id: request.request_id, status: "declined" })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 disabled:opacity-50"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Amis */}
        <Section title="Mes amis">
          {friends.length === 0 ? (
            <p className="mt-3 text-[13px] text-zinc-500">
              Aucun ami pour l&apos;instant — partage ton code d&apos;invitation !
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {friends.map((friend) => (
                <div
                  key={friend.user_id}
                  className="flex items-center justify-between rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-4 py-3"
                >
                  <span className="text-[14px] font-medium text-zinc-900">
                    {friend.display_name || "Utilisateur"}
                  </span>
                  <div className="flex items-center gap-3 text-[12px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <IconFlame size={14} className="text-[#B45309]" />
                      {friend.current_streak}
                    </span>
                    <span>Niv. {friend.level}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Leaderboard */}
        <Section title="Classement de la semaine">
          {rankings.length === 0 ? (
            <p className="mt-3 text-[13px] text-zinc-500">Pas encore de classement.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border-[0.5px] border-[#D1D5DB] bg-white">
              {rankings.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between px-4 py-3 text-[14px] ${
                    index < rankings.length - 1 ? "border-b-[0.5px] border-zinc-100" : ""
                  } ${entry.user_id === myId ? "bg-[#E1F5EE]" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                        entry.rank === 1
                          ? "bg-[#0F6E56] text-white"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span className="font-medium text-zinc-900">
                      {entry.display_name || "Utilisateur"}
                      {entry.user_id === myId && (
                        <span className="ml-1 text-[11px] text-zinc-500">(toi)</span>
                      )}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-[13px] font-medium text-[#0F6E56]">
                    <IconTrophy size={13} />
                    {entry.weekly_xp} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Feed */}
        <Section title="Activité récente">
          {feed.length === 0 ? (
            <p className="mt-3 text-[13px] text-zinc-500">
              Les séances de tes amis apparaîtront ici.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {feed.map((item, index) => (
                <div
                  key={`${item.user_id}-${item.logged_at}-${index}`}
                  className="rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-zinc-900">
                      {item.display_name || "Utilisateur"}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {formatDate(item.logged_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-zinc-500">
                    {(item.session_summary.muscle_groups ?? []).join(" · ")} ·{" "}
                    {item.session_summary.duration_minutes} min
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <BottomNav />
    </main>
  );
}
