"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, PlusCircle, Wallet, User, ClipboardList, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/store/useMapStore";
import { formatCoins } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  { href: "/map",          label: "Carte",    icon: <Map className="w-5 h-5" /> },
  { href: "/map?share=1",  label: "Partager", icon: <PlusCircle className="w-5 h-5" /> },
  { href: "/reservations", label: "Trajets",  icon: <ClipboardList className="w-5 h-5" /> },
  { href: "/leaderboard",  label: "Top",      icon: <Trophy className="w-5 h-5" /> },
  { href: "/profile",      label: "Profil",   icon: <User className="w-5 h-5" /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const profile = useMapStore((s) => s.profile);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[850] bg-[var(--s,#fff)] border-t border-[var(--b,#e8e8e2)] safe-bottom">
      {/* Barre SwiftCoins */}
      {profile && (
        <div className="flex items-center justify-center gap-1.5 py-1.5 bg-[#fffbeb] border-b border-[#fef3c7]">
          <span className="text-[#f59e0b] text-xs">⚡</span>
          <span className="text-xs font-bold text-[#b45309]">
            {formatCoins(profile.coin_balance)}
          </span>
        </div>
      )}

      <div className="flex items-stretch h-16">
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/map?share=1" && pathname.startsWith(item.href));
          const isShare = item.href === "/map?share=1";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                isShare
                  ? "text-[#22956b]"
                  : isActive
                  ? "text-[#22956b]"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div
                className={cn(
                  "transition-transform",
                  isShare && "scale-125 -translate-y-0.5",
                  isActive && !isShare && "scale-110",
                )}
              >
                {item.icon}
              </div>
              <span className={cn("text-[10px] font-medium", isShare && "text-[#22956b]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
