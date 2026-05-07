"use client";

import { Locate, Search, MapPin } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { formatCoins } from "@/lib/utils";
import Link from "next/link";
import { useDarkMode } from "@/hooks/useDarkMode";

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
      <div className="px-4 pt-12 pb-3 pointer-events-auto">
        {/* Ligne 1 : logo + solde + dark */}
        <div className="flex items-center justify-between mb-2">
          {/* Logo */}
          <div className="flex items-center gap-2 bg-[var(--s,#fff)] rounded-2xl shadow px-3 py-2 border border-[var(--b,#e8e8e2)]">
            <div className="w-7 h-7 bg-[#22956b] rounded-[9px] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-[var(--t,#111)]">SwiftPark</span>
            {spotsCount > 0 && (
              <span className="text-[10px] text-[var(--t3,#999)] font-semibold">
                · {spotsCount} info{spotsCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Solde SC */}
            {profile && (
              <Link
                href="/wallet"
                className="flex items-center gap-1 bg-[#e8f5ef] text-[#085041] border border-[rgba(34,149,107,.25)] rounded-full px-3 py-1.5 text-xs font-bold"
              >
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                </svg>
                {profile.coin_balance} SC
              </Link>
            )}

            {/* Dark mode */}
            <button
              onClick={toggle}
              className="w-8 h-8 rounded-[9px] border border-[var(--b,#e8e8e2)] bg-[var(--s,#fff)] flex items-center justify-center shadow"
            >
              {isDark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t2,#555)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t2,#555)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Localiser */}
            <button
              onClick={onLocate}
              className="w-8 h-8 rounded-[9px] border border-[var(--b,#e8e8e2)] bg-[var(--s,#fff)] flex items-center justify-center shadow text-[#22956b]"
            >
              <Locate className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ligne 2 : 2 boutons d'action */}
        <div className="flex gap-2">
          <button
            onClick={onSearch}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#e8f5ef] text-[#085041] border border-[rgba(34,149,107,.25)] rounded-[11px] px-3 py-2.5 text-xs font-bold"
          >
            <Search className="w-3 h-3 shrink-0" />
            Je cherche une place
          </button>
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#22956b] text-white rounded-[11px] px-3 py-2.5 text-xs font-bold shadow-[0_3px_12px_rgba(34,149,107,.3)]"
          >
            <MapPin className="w-3 h-3 shrink-0" />
            Je me gare
          </button>
        </div>
      </div>

      {/* Pill "X infos disponibles" */}
      {spotsCount > 0 && (
        <div className="flex justify-center pointer-events-none">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-xs font-bold text-[#111] shadow border border-black/[.08]">
            <span className="w-1.5 h-1.5 bg-[#22956b] rounded-full animate-pulse inline-block" />
            {spotsCount} info{spotsCount > 1 ? "s" : ""} disponible{spotsCount > 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
