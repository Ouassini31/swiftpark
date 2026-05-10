"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { format, isThisMonth, isThisYear } from "date-fns";
import { fr } from "date-fns/locale";
import BottomNav from "@/components/ui/BottomNav";

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
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 300, letterSpacing: "0.08em",
  textTransform: "uppercase", color: T.muted,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FoundEntry  = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SharedEntry = any;

interface Props {
  found:   FoundEntry[];
  shared:  SharedEntry[];
  profile: { spots_found: number; spots_shared: number; coins_earned: number; coins_spent: number } | null;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function getAddress(entry: FoundEntry | SharedEntry): string {
  const raw = entry.parking_spots?.address ?? entry.address ?? null;
  if (!raw) return `${Number(entry.parking_spots?.lat ?? entry.lat ?? 0).toFixed(4)}, ${Number(entry.parking_spots?.lng ?? entry.lng ?? 0).toFixed(4)}`;
  return raw.split(",").slice(0, 2).join(",");
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isThisMonth(d)) return format(d, "d MMM", { locale: fr });
  if (isThisYear(d))  return format(d, "d MMM", { locale: fr });
  return format(d, "d MMM yy", { locale: fr });
}

/* Group entries by month label */
function groupByMonth<T extends { created_at: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = format(new Date(item.created_at), "MMMM yyyy", { locale: fr });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return Array.from(map.entries());
}

/* Build street → count frequency map, sorted desc */
function streetFrequency(entries: (FoundEntry | SharedEntry)[]): [string, number][] {
  const freq: Record<string, number> = {};
  entries.forEach((e) => {
    const street = getAddress(e).split(",")[0]?.trim();
    if (street) freq[street] = (freq[street] ?? 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]);
}

/* Most frequent street label (for header stats) */
function topStreet(entries: (FoundEntry | SharedEntry)[]): string | null {
  return streetFrequency(entries)[0]?.[0] ?? null;
}

/* ── Component ───────────────────────────────────────────────────────── */
export default function HistoryClient({ found, shared, profile }: Props) {
  const [tab, setTab]             = useState<"found" | "shared">("found");
  const [streetFilter, setStreet] = useState<string | null>(null);

  const foundGroups  = groupByMonth(found);
  const sharedGroups = groupByMonth(shared);
  const topFound  = topStreet(found);
  const topShared = topStreet(shared);

  /* Frequency data for current tab */
  const currentEntries = tab === "found" ? found : shared;
  const freqs = streetFrequency(currentEntries).filter(([, n]) => n >= 2); // only streets with ≥ 2 visits

  /* Filter current entries by selected street */
  const filteredFound  = streetFilter
    ? found.filter((e) => getAddress(e).split(",")[0]?.trim() === streetFilter)
    : found;
  const filteredShared = streetFilter
    ? shared.filter((e) => getAddress(e).split(",")[0]?.trim() === streetFilter)
    : shared;

  const filteredFoundGroups  = groupByMonth(filteredFound);
  const filteredSharedGroups = groupByMonth(filteredShared);

  /* Reset filter when switching tabs */
  function switchTab(t: "found" | "shared") {
    setTab(t);
    setStreet(null);
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: T.bg, fontFamily: DM }}>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-6 px-5">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/map"
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-white font-black text-xl">Historique</h1>
            <p className="text-white/60 text-xs">Tes déplacements SwiftPark</p>
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white/60 text-xs font-medium">Places trouvées</span>
            </div>
            <p className="text-white font-black text-2xl">{profile?.spots_found ?? found.length}</p>
            {topFound && (
              <p className="text-white/50 text-[10px] mt-1 truncate">Souvent : {topFound}</p>
            )}
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white/60 text-xs font-medium">Places partagées</span>
            </div>
            <p className="text-white font-black text-2xl">{profile?.spots_shared ?? shared.length}</p>
            {topShared && (
              <p className="text-white/50 text-[10px] mt-1 truncate">Souvent : {topShared}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div
          className="flex p-1 rounded-[14px]"
          style={{ background: T.surface, border: `1px solid ${T.divider}` }}
        >
          {(["found", "shared"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex-1 py-2.5 text-sm transition"
              style={{
                borderRadius: 10,
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? T.ink : T.muted,
                fontWeight: tab === t ? 400 : 300,
                fontFamily: DM,
                fontSize: 13,
              }}
            >
              {t === "found" ? `🔍 Trouvées (${found.length})` : `🅿️ Partagées (${shared.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Lieux fréquents — barre de filtre rapide */}
      {freqs.length > 0 && (
        <div className="pt-3 pb-1">
          <p className="px-4 mb-2" style={label}>Lieux fréquents</p>
          <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-none">
            {/* "Tous" pill */}
            <button
              onClick={() => setStreet(null)}
              className="shrink-0 transition active:scale-[0.97]"
              style={{
                height: 32,
                paddingLeft: 12, paddingRight: 12,
                borderRadius: 20,
                background: streetFilter === null ? T.accent : T.surface,
                color:       streetFilter === null ? "#fff"    : T.muted,
                fontSize: 12, fontWeight: 300,
                border: `1px solid ${streetFilter === null ? T.accent : T.divider}`,
                fontFamily: DM,
                whiteSpace: "nowrap",
              }}
            >
              Tous
            </button>

            {freqs.map(([street, count]) => {
              const active = streetFilter === street;
              return (
                <button
                  key={street}
                  onClick={() => setStreet(active ? null : street)}
                  className="shrink-0 flex items-center gap-1.5 transition active:scale-[0.97]"
                  style={{
                    height: 32,
                    paddingLeft: 12, paddingRight: 12,
                    borderRadius: 20,
                    background: active ? T.accent : T.surface,
                    color:       active ? "#fff"    : T.ink,
                    fontSize: 12, fontWeight: 300,
                    border: `1px solid ${active ? T.accent : T.divider}`,
                    fontFamily: DM,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{street}</span>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 400,
                      color: active ? "rgba(255,255,255,0.7)" : T.accent,
                      background: active ? "rgba(255,255,255,0.2)" : "#e8f5ef",
                      padding: "1px 5px",
                      borderRadius: 8,
                    }}
                  >
                    {count}×
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="px-4 mt-3 space-y-6">
        {tab === "found" && (
          <>
            {filteredFoundGroups.length === 0 ? (
              streetFilter ? (
                <div className="py-10 text-center" style={{ color: T.muted, fontSize: 13 }}>
                  Aucune place trouvée à &quot;{streetFilter}&quot;
                </div>
              ) : (
                <EmptyState
                  icon="🔍"
                  title="Aucune place trouvée"
                  sub="Utilise la carte pour trouver ta première place."
                  cta="Trouver une place"
                  href="/map"
                />
              )
            ) : filteredFoundGroups.map(([month, entries]) => (
              <MonthGroup key={month} title={month}>
                {entries.map((e: FoundEntry) => (
                  <FoundRow key={e.id} entry={e} freqStreet={topFound} />
                ))}
              </MonthGroup>
            ))}
          </>
        )}

        {tab === "shared" && (
          <>
            {filteredSharedGroups.length === 0 ? (
              streetFilter ? (
                <div className="py-10 text-center" style={{ color: T.muted, fontSize: 13 }}>
                  Aucune place partagée à &quot;{streetFilter}&quot;
                </div>
              ) : (
                <EmptyState
                  icon="🅿️"
                  title="Aucune place partagée"
                  sub="Partage ta place quand tu pars pour gagner des SC."
                  cta="Partager une place"
                  href="/map?share=1"
                />
              )
            ) : filteredSharedGroups.map(([month, entries]) => (
              <MonthGroup key={month} title={month}>
                {entries.map((e: SharedEntry) => (
                  <SharedRow key={e.id} entry={e} freqStreet={topShared} />
                ))}
              </MonthGroup>
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

/* ── Month group ─────────────────────────────────────────────────────── */
function MonthGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="mb-2 capitalize"
        style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}
      >
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/* ── Found row ───────────────────────────────────────────────────────── */
function FoundRow({ entry, freqStreet }: { entry: FoundEntry; freqStreet: string | null }) {
  const addr    = getAddress(entry);
  const street  = addr.split(",")[0]?.trim();
  const done    = entry.status === "completed";
  const isFreq  = !!freqStreet && street === freqStreet;
  const spotLat = entry.parking_spots?.lat;
  const spotLng = entry.parking_spots?.lng;

  return (
    <Link
      href={spotLat && spotLng ? `/map?lat=${spotLat}&lng=${spotLng}` : "/map"}
      className="flex items-center gap-3 rounded-[14px] px-4 py-3 active:scale-[0.99] transition"
      style={{ background: "#fff", border: `1px solid ${T.divider}` }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: 36, height: 36, borderRadius: 10, background: done ? "#f0faf6" : T.surface }}
      >
        <MapPin className="w-4 h-4" style={{ color: done ? T.accent : T.muted }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate" style={{ fontSize: 13, fontWeight: 400, color: T.ink }}>{addr}</p>
          {isFreq && (
            <span
              className="shrink-0"
              style={{
                fontSize: 9, fontWeight: 400, letterSpacing: "0.04em",
                textTransform: "uppercase", color: T.accent,
                background: "#e8f5ef", padding: "1px 5px", borderRadius: 6,
              }}
            >
              Habituel
            </span>
          )}
        </div>
        <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: 11, fontWeight: 300, color: T.muted }}>
          <Clock className="w-3 h-3" />
          {fmtDate(entry.created_at)}
          {entry.status === "cancelled" && " · Annulé"}
          {entry.status === "expired"   && " · Expiré"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p style={{ fontSize: 13, fontWeight: 400, color: done ? "#a73838" : T.muted }}>
          {done ? `−${entry.coin_amount} SC` : "—"}
        </p>
      </div>
    </Link>
  );
}

/* ── Shared row ──────────────────────────────────────────────────────── */
function SharedRow({ entry, freqStreet }: { entry: SharedEntry; freqStreet: string | null }) {
  const addr   = getAddress(entry);
  const street = addr.split(",")[0]?.trim();
  const done   = entry.status === "completed";
  const isFreq = !!freqStreet && street === freqStreet;

  return (
    <Link
      href={entry.lat && entry.lng ? `/map?lat=${entry.lat}&lng=${entry.lng}` : "/map"}
      className="flex items-center gap-3 rounded-[14px] px-4 py-3 active:scale-[0.99] transition"
      style={{ background: "#fff", border: `1px solid ${T.divider}` }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: 36, height: 36, borderRadius: 10, background: done ? "#f0faf6" : T.surface }}
      >
        <TrendingUp className="w-4 h-4" style={{ color: done ? T.accent : T.muted }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate" style={{ fontSize: 13, fontWeight: 400, color: T.ink }}>{addr}</p>
          {isFreq && (
            <span
              className="shrink-0"
              style={{
                fontSize: 9, fontWeight: 400, letterSpacing: "0.04em",
                textTransform: "uppercase", color: T.accent,
                background: "#e8f5ef", padding: "1px 5px", borderRadius: 6,
              }}
            >
              Habituel
            </span>
          )}
        </div>
        <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: 11, fontWeight: 300, color: T.muted }}>
          <Clock className="w-3 h-3" />
          {fmtDate(entry.created_at)}
          {entry.status === "expired"   && " · Expiré (pas de preneur)"}
          {entry.status === "cancelled" && " · Annulé"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p style={{ fontSize: 13, fontWeight: 400, color: done ? T.accent : T.muted }}>
          {done ? `+${Math.round(entry.coin_price * 0.75)} SC` : "—"}
        </p>
      </div>
    </Link>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────── */
function EmptyState({ icon, title, sub, cta, href }: {
  icon: string; title: string; sub: string; cta: string; href: string;
}) {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <p style={{ fontSize: 15, fontWeight: 400, color: T.ink }}>{title}</p>
      <p style={{ fontSize: 13, fontWeight: 300, color: T.muted, marginTop: 6, maxWidth: 240, lineHeight: 1.5 }}>{sub}</p>
      <Link
        href={href}
        className="mt-6 px-5 py-3 rounded-[14px] text-white text-sm transition active:scale-95"
        style={{ background: T.accent, fontWeight: 400, fontFamily: DM }}
      >
        {cta}
      </Link>
    </div>
  );
}
