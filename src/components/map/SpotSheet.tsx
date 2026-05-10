"use client";

import { useState, useEffect } from "react";
import { Navigation, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance } from "@/lib/utils";
import { notifyUser } from "@/lib/notify";
import { toast } from "sonner";

/* ── Design tokens (from Claude Design) ──────────────────────────────── */
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
  fontSize: 11, fontWeight: 300,
  letterSpacing: "0.08em", textTransform: "uppercase",
  color: T.muted,
};

/* ── Horizon (temps restant avant départ du sharer) ─────────────────── */
const HORIZON_MAP = [
  { key: "now", label: "Disponible maintenant", tile: "#f0faf6", ink: "#22956b", max: 5 },
  { key: "15",  label: "Dans 15 min",           tile: "#fffbf0", ink: "#a07116", max: 20 },
  { key: "1h",  label: "Dans 1 h",              tile: "#f0f6ff", ink: "#3760c4", max: 75 },
  { key: "2h",  label: "Dans 2 h ou plus",      tile: "#f8f5ff", ink: "#7a4fc4", max: Infinity },
];

function getHorizon(expiresAt: string) {
  const mins = (new Date(expiresAt).getTime() - Date.now()) / 60000;
  return HORIZON_MAP.find((h) => mins <= h.max) ?? HORIZON_MAP[3];
}

function getMinutesLeft(expiresAt: string) {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000));
}

/* ── Compatibilité gabarit ───────────────────────────────────────────── */
const CATEGORY_ORDER = ["citadine", "compacte", "berline", "suv", "grand"];

function getCompatKey(finderCat: string | null, sharerCat: string | null): "ok" | "tight" | "no" {
  if (!finderCat || !sharerCat) return "ok";
  const fi = CATEGORY_ORDER.indexOf(finderCat);
  const si = CATEGORY_ORDER.indexOf(sharerCat);
  if (si >= fi) return "ok";
  if (si === fi - 1) return "tight";
  return "no";
}

const COMPAT_STYLE = {
  ok:    { label: "Compatible",   color: "#22956b" },
  tight: { label: "Place serrée", color: "#a07116" },
  no:    { label: "Trop petite",  color: "#a73838" },
};

const COLORS_FR: Record<string, string> = {
  blanc: "blanche", noir: "noire", gris: "grise", argent: "argentée",
  rouge: "rouge", bleu: "bleue", vert: "verte", jaune: "jaune",
  orange: "orange", marron: "marron", beige: "beige", violet: "violette",
};

const CATEGORY_LABELS: Record<string, { size: string }> = {
  citadine: { size: "XS" }, compacte: { size: "S" },
  berline:  { size: "M"  }, suv:      { size: "L" }, grand: { size: "XL" },
};

/* ── ETA calculation ─────────────────────────────────────────────────── */
function computeEtaMin(distanceM: number): number {
  // Urban crow-flies factor × 1.4 / speed
  if (distanceM < 800) return Math.ceil((distanceM * 1.4) / 80);  // walking 80m/min
  return Math.ceil((distanceM * 1.4) / 350);                       // driving 350m/min ≈ 21km/h
}

function formatFreeAt(expiresAt: string): string {
  const d = new Date(expiresAt);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function matchMessage(etaMin: number, sharerMin: number): { text: string; color: string } | null {
  const diff = sharerMin - etaMin;
  if (sharerMin === 0) return null;
  if (diff >= 2)   return { text: `Tu arrives avant qu'il parte · place libre ✓`, color: "#22956b" };
  if (diff >= -2)  return { text: `Timing parfait · tu vas le croiser 🎯`, color: "#22956b" };
  if (diff >= -6)  return { text: `Il part ~${Math.abs(diff)} min avant toi · mais la place t'attend`, color: "#a07116" };
  return null;
}

interface SharerVehicle {
  vehicle_make:      string | null;
  vehicle_model:     string | null;
  vehicle_color:     string | null;
  vehicle_length_cm: number | null;
  vehicle_category:  string | null;
  spots_shared:      number | null;
  full_name:         string | null;
  username:          string | null;
}

/* ── Component ───────────────────────────────────────────────────────── */
export default function SpotSheet() {
  const { selectedSpot, selectSpot, profile, userLat, userLng } = useMapStore();
  const [loading, setLoading]             = useState(false);
  const [sharerVehicle, setSharerVehicle] = useState<SharerVehicle | null>(null);

  useEffect(() => {
    if (!selectedSpot) return;
    setSharerVehicle(null);
    const supabase = createClient();
    supabase
      .from("profiles" as never)
      .select("vehicle_make, vehicle_model, vehicle_color, vehicle_length_cm, vehicle_category, spots_shared, full_name, username")
      .eq("id", selectedSpot.sharer_id)
      .single()
      .then(({ data }: { data: unknown }) => setSharerVehicle((data as SharerVehicle) ?? null));
  }, [selectedSpot?.id]);

  if (!selectedSpot) return null;

  const horizon   = getHorizon(selectedSpot.expires_at);
  const minsLeft  = getMinutesLeft(selectedSpot.expires_at);
  const freeAt    = formatFreeAt(selectedSpot.expires_at);
  const distance  = userLat && userLng
    ? haversineDistance(userLat, userLng, selectedSpot.lat, selectedSpot.lng)
    : null;
  const timeAgo   = formatDistanceToNow(new Date(selectedSpot.created_at), { addSuffix: true, locale: fr });
  const distLabel = distance != null
    ? distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`
    : null;
  const etaMin    = distance != null ? computeEtaMin(distance) : null;
  const match     = etaMin != null && minsLeft > 0 ? matchMessage(etaMin, minsLeft) : null;

  const finderCat   = (profile as Record<string, unknown>)?.vehicle_category as string | null;
  const compatKey   = getCompatKey(finderCat, sharerVehicle?.vehicle_category ?? null);
  const compatStyle = COMPAT_STYLE[compatKey];

  function openNavigation(lat: number, lng: number) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.location.href = url;
  }

  async function handleContrib() {
    if (!profile) return;
    if (profile.coin_balance < selectedSpot!.coin_price) { toast.error("SwiftCoins insuffisants"); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        spot_id:        selectedSpot!.id,
        finder_id:      profile.id,
        sharer_id:      selectedSpot!.sharer_id,
        coin_amount:    selectedSpot!.coin_price,
        commission:     Math.round(selectedSpot!.coin_price * 0.25),
        sharer_receive: selectedSpot!.coin_price - Math.round(selectedSpot!.coin_price * 0.25),
        status:         "reserved",
        expires_at:     new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).select().single();
    if (error) { toast.error("Erreur lors de l'achat d'info"); setLoading(false); return; }
    await supabase.rpc("process_coin_transaction", {
      p_user_id:        profile.id,
      p_amount:         -selectedSpot!.coin_price,
      p_type:           "spend",
      p_description:    `Info achetée · ${selectedSpot!.address ?? "Place"}`,
      p_reservation_id: reservation.id,
    });
    await supabase.from("parking_spots").update({ status: "reserved" }).eq("id", selectedSpot!.id);
    notifyUser({
      user_id:        selectedSpot!.sharer_id,
      type:           "reservation_received",
      title:          "👀 Ton info a été achetée !",
      message:        "Un conducteur se dirige vers toi. Prépare-toi à partir.",
      reservation_id: reservation.id,
      url:            "/reservations",
    });
    toast.success("✓ Info achetée ! Navigation en cours… 📍");
    openNavigation(selectedSpot!.lat, selectedSpot!.lng);
    selectSpot(null);
    setLoading(false);
  }

  /* ── Address split ───────────────────────────────────────────────── */
  const rawAddr    = selectedSpot.address ?? `${selectedSpot.lat.toFixed(4)}, ${selectedSpot.lng.toFixed(4)}`;
  const addrParts  = rawAddr.split(", ");
  const street     = addrParts[0] ?? rawAddr;
  const postalCity = addrParts.slice(1).join(", ");

  /* ── Detail rows ─────────────────────────────────────────────────── */
  type Row = [string, React.ReactNode];
  const rows: Row[] = [];

  if (distLabel) {
    rows.push(["Distance", (
      <>
        <span style={{ color: T.ink }}>{distLabel}</span>
        {etaMin && <span style={{ color: T.muted }}> · ~{etaMin} min{distance != null && distance < 800 ? " à pied" : " en voiture"}</span>}
      </>
    )]);
  }

  if (sharerVehicle?.vehicle_make) {
    const colorFR = sharerVehicle.vehicle_color
      ? (COLORS_FR[sharerVehicle.vehicle_color] ?? sharerVehicle.vehicle_color)
      : null;
    const size = sharerVehicle.vehicle_category
      ? (CATEGORY_LABELS[sharerVehicle.vehicle_category]?.size ?? "")
      : "";
    rows.push(["Véhicule", (
      <>
        <span style={{ color: T.ink }}>{sharerVehicle.vehicle_make} {sharerVehicle.vehicle_model}</span>
        <span style={{ color: T.muted }}>
          {size ? ` · ${size}` : ""}
          {colorFR ? ` · ${colorFR}` : ""}
        </span>
      </>
    )]);
  }

  if (sharerVehicle?.vehicle_category && finderCat) {
    rows.push(["Compatibilité", (
      <span style={{ color: compatStyle.color, fontWeight: 400 }}>{compatStyle.label}</span>
    )]);
  }

  // Trust signal — sharer name + confirmed contributions
  const sharerName = sharerVehicle?.full_name ?? sharerVehicle?.username;
  const sharerCount = sharerVehicle?.spots_shared;
  rows.push(["Partageur", (
    <span style={{ color: T.ink }}>
      {sharerName ?? "Anonyme"}
      {sharerCount && sharerCount > 0
        ? <span style={{ color: T.muted, fontWeight: 300 }}> · {sharerCount} partagée{sharerCount > 1 ? "s" : ""} ✓</span>
        : null}
    </span>
  )]);

  rows.push(["Partagé", (
    <span style={{ color: T.muted }}>{timeAgo}</span>
  )]);

  if (profile) {
    rows.push(["Ton solde", (
      <span style={{ color: T.accent, fontWeight: 400 }}>⚡ {profile.coin_balance} SC</span>
    )]);
  }

  const canBuy = !!profile && profile.coin_balance >= selectedSpot.coin_price;

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 z-[900]"
        style={{ background: "rgba(26,26,22,0.35)" }}
        onClick={() => selectSpot(null)}
      />

      {/* Sheet */}
      <section
        role="dialog"
        aria-label="Détails de la place"
        className="absolute bottom-0 left-0 right-0 z-[910] flex flex-col animate-in slide-in-from-bottom-4"
        style={{
          fontFamily: DM,
          background: T.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "92dvh",
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <button
          type="button"
          onClick={() => selectSpot(null)}
          aria-label="Fermer"
          className="pt-3 pb-2 flex justify-center"
        >
          <span
            className="block w-9 rounded-full"
            style={{ height: 3, background: T.divider }}
          />
        </button>

        {/* Scrollable body */}
        <div className="px-5 pt-2 pb-3 overflow-y-auto flex-1">

          {/* Address */}
          <h2 style={{ color: T.ink, fontSize: 17, fontWeight: 400, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
            {street}
          </h2>
          {postalCity && (
            <p style={{ ...label, marginTop: 4 }}>{postalCity}</p>
          )}

          {/* Horizon-tinted price block */}
          <div
            className="mt-5 flex flex-col"
            style={{ background: horizon.tile, borderRadius: 14, padding: "18px 20px" }}
          >
            {/* Horizon label + pulsing dot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ ...label, color: horizon.ink }}>
                <span className="relative flex" style={{ width: 6, height: 6 }}>
                  {horizon.key === "now" && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping opacity-50"
                      style={{ background: horizon.ink }}
                    />
                  )}
                  <span className="relative rounded-full" style={{ width: 6, height: 6, background: horizon.ink }} />
                </span>
                {horizon.key === "now" ? "Disponible maintenant" : minsLeft > 0 ? `Dans ${minsLeft} min` : "Disponible"}
              </div>
              {/* "Libre à HH:mm" — heure concrète */}
              <span style={{ ...label, color: horizon.ink, opacity: 0.75 }}>
                Libre à {freeAt}
              </span>
            </div>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-2">
              <span style={{
                fontSize: 58, fontWeight: 300, color: T.ink,
                lineHeight: 1, letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums",
              }}>
                {selectedSpot.coin_price}
              </span>
              <span style={{ fontSize: 16, fontWeight: 300, color: T.muted, letterSpacing: "0.02em" }}>SC</span>
            </div>

            <p style={{ ...label, color: horizon.ink, opacity: 0.85, marginTop: 6 }}>
              Contribution
            </p>

            {/* ETA match window */}
            {match && (
              <div
                className="mt-3 px-3 py-2 rounded-[10px]"
                style={{ background: "rgba(255,255,255,0.6)" }}
              >
                <p style={{ fontSize: 12, fontWeight: 300, color: match.color, letterSpacing: "-0.005em" }}>
                  {match.text}
                </p>
                {etaMin && (
                  <p style={{ ...label, marginTop: 3, color: T.muted }}>
                    Ton ETA : ~{etaMin} min
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Detail rows */}
          <dl className="mt-3">
            {rows.map(([key, val]) => (
              <div
                key={key as string}
                className="flex items-center justify-between py-2.5"
                style={{ borderTop: `1px solid ${T.divider}`, fontSize: 13, fontWeight: 300 }}
              >
                <dt style={label}>{key as string}</dt>
                <dd className="text-right" style={{ maxWidth: "60%" }}>{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* CTA */}
        <div
          className="px-4 pt-3"
          style={{
            background: T.bg,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
            borderTop: `1px solid ${T.divider}`,
          }}
        >
          <button
            type="button"
            onClick={handleContrib}
            disabled={loading || !canBuy}
            className="w-full flex items-center justify-center gap-2 transition active:scale-[0.995]"
            style={{
              height: 48,
              borderRadius: 14,
              background: canBuy ? T.accent : T.surface,
              color: canBuy ? "#fff" : T.muted,
              fontSize: 14.5,
              fontWeight: 400,
              letterSpacing: "-0.005em",
              fontFamily: DM,
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Navigation className="w-4 h-4" style={{ opacity: canBuy ? 1 : 0.4 }} />
                {canBuy
                  ? `Obtenir l'info · ${selectedSpot.coin_price} SC`
                  : profile
                    ? `Solde insuffisant (${profile.coin_balance} SC)`
                    : "Connecte-toi pour contribuer"}
              </>
            )}
          </button>
          {!profile && (
            <p className="text-center mt-2" style={{ fontSize: 11, color: T.muted }}>
              Tu accèdes à une information partagée par un conducteur
            </p>
          )}
        </div>
      </section>
    </>
  );
}
