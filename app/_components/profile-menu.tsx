"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconLogout,
  IconMedal,
  IconSalad,
  IconTrendingUp,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";

function initialsFrom(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

type ProfileMenuProps = {
  /** "down" : menu sous l'avatar (headers) · "up" : menu au-dessus (bottom nav) */
  placement?: "down" | "up";
  /** "avatar" : pastille initiales (headers) · "nav" : item icône+label (bottom nav) */
  trigger?: "avatar" | "nav";
};

export function ProfileMenu({
  placement = "down",
  trigger = "avatar",
}: ProfileMenuProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    // Purge le cache TanStack Query avant de fermer la session Clerk pour
    // qu'aucune donnée du compte ne survive à la déconnexion.
    queryClient.clear();
    await signOut({ redirectUrl: "/sign-out" });
  }

  const initials = initialsFrom(user?.firstName, user?.lastName);
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div ref={containerRef} className="relative">
      {trigger === "avatar" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu profil"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E1F5EE]"
        >
          <span className="text-[12px] font-medium text-[#0F6E56]">
            {initials}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu profil"
          className={`flex w-full flex-col items-center gap-1 py-3 ${
            open ? "text-[#0F6E56]" : "text-zinc-400"
          }`}
        >
          <IconUser size={20} />
          <span className="text-[10px]">Profil</span>
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-30 min-w-[180px] rounded-lg border-[0.5px] border-[#D1D5DB] bg-white py-1 shadow-lg ${
            placement === "down" ? "top-[48px]" : "bottom-[56px] right-2"
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E1F5EE] text-[11px] font-medium text-[#0F6E56]">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-zinc-900">
                {user?.fullName ?? "Utilisateur"}
              </span>
              {email && (
                <span className="block truncate text-[13px] text-zinc-500">
                  {email}
                </span>
              )}
            </span>
          </div>

          <div className="border-t-[0.5px] border-zinc-200" />

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
          >
            <IconUser size={15} />
            Mon profil
          </Link>
          <Link
            href="/nutrition"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
          >
            <IconSalad size={15} />
            Nutrition
          </Link>
          <Link
            href="/progress"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
          >
            <IconTrendingUp size={15} />
            Progression
          </Link>
          <Link
            href="/gamification"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
          >
            <IconMedal size={15} />
            Récompenses
          </Link>
          <Link
            href="/community"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
          >
            <IconUsers size={15} />
            Communauté
          </Link>

          <div className="border-t-[0.5px] border-zinc-200" />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#DC2626] hover:bg-red-50 disabled:opacity-60"
          >
            <IconLogout size={15} />
            {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      )}
    </div>
  );
}
