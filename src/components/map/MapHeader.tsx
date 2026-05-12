"use client";

import { Locate, Moon, Sun, Lock, Layers } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import Link from "next/link";
import { useDarkMode } from "@/hooks/useDarkMode";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import FilterBar, { type MapFilters } from "@/components/map/FilterBar";
import { toast } from "sonner";
import SwiftParkLogo from "@/components/ui/SwiftParkLogo";

/* ── Design tokens ───────────────────────────────────────────────────── */
const T = {
  bg:      "#fafaf7",
  surface: "#f4f4f0",
  ink:     "#1a1a16",
  muted:   "#aaa9a0",
  divider: "#eeeee6",
  accent:  "#22956b",
} as const;

const DM = "var(--font-dm-sans), system-ui, sans-serif";

interface MapHeaderProps {
  spotsCount:      number;
  onLocate:        () => void;
  onSearch:        () => void;
  onShare:         () => void;
  filters:         MapFilters;
  onFiltersChange: (f: MapFilters) => void;
  hasActiveSpot:   boolean;
}

export default function MapHeader({
  spotsCount, onLocate, onSearch, onShare, filters, onFiltersChange, hasActiveSpot,
}: MapHeaderProps) {
  const profile        = useMapStore((s) => s.profile);
  const isSatellite    = useMapStore((s) => s.isSatellite);
  const toggleSatellite = useMapStore((s) => s.toggleSatellite);
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="absolute top-0 left-0 right-0 z-[800] pointer-events-none" style={{ fontFamily: DM }}>
      <div className="px-4 pt-safe-top pt-12 pb-3 pointer-events-auto">

        {/* Logo */}
        <div className="flex justify-center mb-3">
          <SwiftParkLogo
            markSize={44}
            fontSize={22}
            color="#085041"
            accent="#22956b"
            pill
            animated
          />
        </div>

        {/* Row 1: counter pill + right actions */}
        <div className="flex items-center justify-between mb-2.5">

          {/* Counter pill */}
          <div
            className="inline-flex items-center gap-2 pl-3 pr-3.5 h-10 rounded-[14px] whitespace-nowrap"
            style={{ background: "#fff", border: `1px solid ${T.divider}` }}
            aria-live="polite"
          >
            <span className="relative flex" style={{ width: 6, height: 6 }}>
              {spotsCount > 0 && (
                <span
                  className="absolute inset-0 rounded-full animate-ping opacity-50"
                  style={{ background: T.accent }}
                />
              )}
              <span
                className="relative rounded-full"
                style={{ width: 6, height: 6, background: spotsCount > 0 ? T.accent : T.muted }}
              />
            </span>
            <span style={{ fontSize: 13, fontWeight: 400, color: T.ink, letterSpacing: "-0.005em" }}>
              {spotsCount}
            </span>
            <span style={{ fontSize: 13, fontWeight: 300, color: T.muted, letterSpacing: "-0.005em" }}>
              {spotsCount > 1 ? "places autour" : "place autour"}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {profile && (
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-xs font-normal whitespace-nowrap"
                style={{
                  background: T.accent,
                  color: "#fff",
                  fontFamily: DM,
                  fontSize: 12,
                  fontWeight: 400,
                  border: "none",
                }}
              >
                <span style={{ color: "#fbbf24" }}>⚡</span>
                {profile.coin_balance} SC
              </Link>
            )}
            <NotificationCenter />
            {/* Satellite toggle */}
            <button
              onClick={toggleSatellite}
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36,
                borderRadius: 12,
                background: isSatellite ? T.accent : "#fff",
                border: `1px solid ${isSatellite ? T.accent : T.divider}`,
                color: isSatellite ? "#fff" : T.muted,
              }}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={toggle}
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36,
                borderRadius: 12,
                background: "#fff",
                border: `1px solid ${T.divider}`,
                color: T.ink,
              }}
            >
              {isDark
                ? <Sun className="w-4 h-4" style={{ color: "#f59e0b" }} />
                : <Moon className="w-4 h-4" style={{ color: T.muted }} />}
            </button>
            <button
              onClick={onLocate}
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36,
                borderRadius: 12,
                background: "#fff",
                border: `1px solid ${T.divider}`,
                color: T.accent,
              }}
            >
              <Locate className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: segmented mode + filter */}
        <div className="flex gap-2">
          {/* Segmented pill */}
          <div
            className="flex-1 inline-flex items-center p-1 rounded-[14px]"
            style={{ background: T.surface, border: `1px solid ${T.divider}` }}
          >
            {/* Je cherche */}
            <button
              type="button"
              onClick={onSearch}
              className="flex-1 flex items-center justify-center gap-1.5 transition active:scale-[0.97]"
              style={{
                height: 36,
                borderRadius: 10,
                background: "#fff",
                color: T.ink,
                fontSize: 13,
                fontWeight: 400,
                letterSpacing: "-0.005em",
                fontFamily: DM,
              }}
            >
              Je cherche
            </button>

            {/* Je me gare */}
            {hasActiveSpot ? (
              <button
                type="button"
                onClick={() => toast("Tu as déjà une place active 📍", {
                  description: "Clique sur la bannière pour la gérer ou marquer ton départ.",
                })}
                className="flex-1 flex items-center justify-center gap-1.5 transition"
                style={{
                  height: 36,
                  borderRadius: 10,
                  background: "transparent",
                  color: T.muted,
                  fontSize: 13,
                  fontWeight: 300,
                  fontFamily: DM,
                }}
              >
                <Lock className="w-3 h-3" style={{ color: T.muted }} />
                Place active
              </button>
            ) : (
              <button
                type="button"
                onClick={onShare}
                className="flex-1 flex items-center justify-center gap-1.5 transition active:scale-[0.97]"
                style={{
                  height: 36,
                  borderRadius: 10,
                  background: T.accent,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: "-0.005em",
                  fontFamily: DM,
                }}
              >
                Je me gare
              </button>
            )}
          </div>

          {/* Filter */}
          <FilterBar filters={filters} onChange={onFiltersChange} />
        </div>
      </div>
    </div>
  );
}
