"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHistory, IconHome, IconPlus } from "@tabler/icons-react";

// Nutrition et Progression restent accessibles via les raccourcis du
// dashboard et le menu profil (présent sur toutes les pages).
const ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: IconHome },
  { href: "/sessions", label: "Séances", icon: IconHistory },
  { href: "/sessions/new", label: "Nouvelle séance", icon: IconPlus },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-[440px] grid-cols-3">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 ${
                active ? "text-[#0F6E56]" : "text-zinc-400"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
