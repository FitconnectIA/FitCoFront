"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBolt,
  IconConfetti,
  IconFlame,
  IconLock,
  IconStar,
  IconTrophy,
  type IconProps,
} from "@tabler/icons-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { useApiClient } from "@/lib/use-api-client";
import type { BadgeCatalog, GamificationProfile } from "@/lib/types";

const GAMIFICATION_STALE_TIME = 1000 * 60 * 5;

// Miroir des `icon` renvoyés par le backend (app/services/gamification_service.py).
const BADGE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  confetti: IconConfetti,
  flame: IconFlame,
  trophy: IconTrophy,
  star: IconStar,
};

export default function GamificationPage() {
  const router = useRouter();
  const apiClient = useApiClient();

  const profileQuery = useQuery({
    queryKey: ["gamification", "profile"],
    queryFn: () => apiClient<GamificationProfile>("/gamification/profile"),
    staleTime: GAMIFICATION_STALE_TIME,
  });

  const catalogQuery = useQuery({
    queryKey: ["gamification", "catalog"],
    queryFn: () => apiClient<BadgeCatalog>("/gamification/badges/catalog"),
    staleTime: GAMIFICATION_STALE_TIME,
  });

  const profile = profileQuery.data;
  const catalog = catalogQuery.data;

  // Progression dans le niveau courant : total_xp entre le seuil du niveau et
  // celui du niveau suivant (niveau n = 100·n²).
  const levelProgress = (() => {
    if (!profile) return 0;
    const currentThreshold = 100 * profile.level ** 2;
    const nextThreshold = 100 * (profile.level + 1) ** 2;
    const span = nextThreshold - currentThreshold;
    if (span <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((profile.total_xp - currentThreshold) / span) * 100),
    );
  })();

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
          <h1 className="text-xl font-bold text-zinc-900">Récompenses</h1>
        </div>

        {profileQuery.isLoading && (
          <p className="mt-6 text-[13px] text-zinc-500">Chargement...</p>
        )}
        {profileQuery.isError && (
          <p className="mt-6 text-sm text-red-500">
            Impossible de charger ta progression.
          </p>
        )}

        {profile && (
          <div className="mt-6 rounded-lg border-[0.5px] border-[#D1D5DB] bg-white px-[1.25rem] py-[1.1rem]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F5EE]">
                  <IconBolt size={20} className="text-[#0F6E56]" />
                </div>
                <div>
                  <p className="text-[13px] text-zinc-500">Niveau</p>
                  <p className="text-[22px] font-bold leading-tight text-zinc-900">
                    {profile.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[22px] font-bold leading-tight text-[#0F6E56]">
                  {profile.total_xp}
                </p>
                <p className="text-[11px] text-zinc-500">XP total</p>
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[#0F6E56] transition-all"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-2 text-[12px] text-zinc-500">
              Encore {profile.xp_to_next_level} XP pour le niveau {profile.level + 1}
            </p>
          </div>
        )}

        <h2 className="mt-6 text-[15px] font-bold text-zinc-900">Badges</h2>
        {catalogQuery.isLoading && (
          <p className="mt-2 text-[13px] text-zinc-500">Chargement...</p>
        )}
        {catalog && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {catalog.items.map((badge) => {
              const Icon = BADGE_ICONS[badge.icon] ?? IconTrophy;
              return (
                <div
                  key={badge.badge_id}
                  className={`rounded-lg border-[0.5px] px-4 py-4 text-center ${
                    badge.unlocked
                      ? "border-[#9FE1CB] bg-[#E1F5EE]"
                      : "border-[#D1D5DB] bg-white opacity-70"
                  }`}
                >
                  <div
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
                      badge.unlocked ? "bg-white" : "bg-zinc-100"
                    }`}
                  >
                    {badge.unlocked ? (
                      <Icon size={22} className="text-[#0F6E56]" />
                    ) : (
                      <IconLock size={20} className="text-zinc-400" />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-[13px] font-medium ${
                      badge.unlocked ? "text-[#085041]" : "text-zinc-500"
                    }`}
                  >
                    {badge.name}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
