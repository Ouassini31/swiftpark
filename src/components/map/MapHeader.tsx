"use client";

import { Locate, Search, MapPin, Moon, Sun } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import Link from "next/link";
import { useDarkMode } from "@/hooks/useDarkMode";
import NotificationCenter from "@/components/notifications/NotificationCenter";

interface MapHeaderProps {
  spotsCount: number;
  onLocate: () => void;
  onSearch: () => void;
  onShare: () => void;
}

export default function MapHeader({ spotsCount, onLocate, onSearch, onShare }: MapHeaderProps) {
  const profile = useMapStore((s) => s.profile);
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="absolute top-0 left-0 right-0 z-[800] pointer-events-none">
      <div className="px-4 pt-safe-top pt-12 pb-3 pointer-events-auto">

        {/* Ligne 1 : logo + actions */}
        <div className="flex items-center justify-between mb-2.5">
          {/* Logo glassmorphism */}
          <div className="flex items-center gap-2.5 bg-white/90 dark:bg-black/60 backdrop-blur-xl rounded-2xl shadow-lg px-3.5 py-2.5 border border-white/50">
            <div className="w-8 h-8 bg-gradient-to-br from-[#22956b] to-[#085041] rounded-[10px] flex items-center justify-center shadow-md">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-black text-gray-900 leading-none">SwiftPark</p>
              {spotsCount > 0 && (
                <p className="text-[10px] text-[#22956b] font-semibold mt-0.5">
                  {spotsCount} info{spotsCount > 1 ? "s" : ""} live
                </p>
              )}
            </div>
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2">
            {profile && (
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white rounded-full px-3.5 py-2 text-xs font-bold shadow-lg shadow-[#22956b]/30"
              >
                <span className="text-yellow-300">⚡</span>
                {profile.coin_balance} SC
              </Link>
            )}

            <NotificationCenter />

            <button
              onClick={toggle}
              className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-white/50 flex items-center justify-center shadow-lg text-gray-600"
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onLocate}
              className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-white/50 flex items-center justify-center shadow-lg text-[#22956b]"
            >
              <Locate className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ligne 2 : boutons d'action */}
        <div className="flex gap-2.5">
          <button
            onClick={onSearch}
            className="flex-1 flex items-center justify-center gap-2 bg-white/90 backdrop-blur-xl border border-white/50 text-gray-700 rounded-2xl px-4 py-3 text-[13px] font-semibold shadow-lg transition active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-[#22956b]" />
            Je cherche une place
          </button>
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white rounded-2xl px-4 py-3 text-[13px] font-bold shadow-lg shadow-[#22956b]/30 transition active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5" />
            Je me gare
          </button>
        </div>
      </div>

      {/* Pill flottante "X places" */}
      {spotsCount > 0 && (
        <div className="flex justify-center mt-1 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xl rounded-full px-4 py-1.5 text-xs font-bold text-gray-800 shadow-lg border border-white/50">
            <span className="w-1.5 h-1.5 bg-[#22956b] rounded-full animate-pulse" />
            {spotsCount} place{spotsCount > 1 ? "s" : ""} disponible{spotsCount > 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
