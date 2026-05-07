"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, PlusCircle, ClipboardList, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/map",          label: "Carte",    icon: Map },
  { href: "/reservations", label: "Trajets",  icon: ClipboardList },
  { href: "/map?share=1",  label: "Partager", icon: PlusCircle, primary: true },
  { href: "/leaderboard",  label: "Top",      icon: Trophy },
  { href: "/profile",      label: "Profil",   icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[850] safe-bottom">
      {/* Fond glassmorphism */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100/80 shadow-[0_-8px_32px_rgba(0,0,0,.08)]">
        <div className="flex items-center h-16 px-2">
          {NAV.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/map?share=1" && item.href !== "/map" && pathname.startsWith(item.href)) ||
              (item.href === "/map" && pathname === "/map");
            const Icon = item.icon;

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center -translate-y-3"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#22956b] to-[#085041] rounded-[18px] flex items-center justify-center shadow-xl shadow-[#22956b]/40 transition active:scale-90">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[9px] font-bold text-[#22956b] mt-1">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-1 transition"
              >
                <div className={cn(
                  "w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200",
                  isActive ? "bg-[#e8f5ef]" : "bg-transparent"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-[#22956b]" : "text-gray-400"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold transition-colors",
                  isActive ? "text-[#22956b]" : "text-gray-400"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
