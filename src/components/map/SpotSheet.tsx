"use client";

import { useState, useEffect } from "react";
import { X, Navigation, Clock, MapPin, Car } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance } from "@/lib/utils";
import { notifyUser } from "@/lib/notify";
import { toast } from "sonner";

const HORIZON = [
  { key: "now", label: "Maintenant", bg: "from-emerald-400 to-emerald-600", badge: "bg-emerald-100 text-emerald-700", max: 5 },
  { key: "15",  label: "~15 min",    bg: "from-amber-400 to-amber-500",     badge: "bg-amber-100 text-amber-700",   max: 20 },
  { key: "1h",  label: "~1 heure",   bg: "from-blue-400 to-blue-600",       badge: "bg-blue-100 text-blue-700",     max: 75 },
  { key: "2h",  label: "2h+",        bg: "from-violet-400 to-violet-600",   badge: "bg-violet-100 text-violet-700", max: Infinity },
];

function getHorizon(expiresAt: string) {
  const mins = (new Date(expiresAt).getTime() - Date.now()) / 60000;
  return HORIZON.find((h) => mins <= h.max) ?? HORIZON[3];
}

function getMinutesLeft(expiresAt: string) {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000));
}

// Gabarits — taille textuelle (XS→XL) pour ne pas confondre
// avec le code couleur de l'horizon temporel sur la carte
const CATEGORY_LABELS: Record<string, { label: string; size: string; bg: string; text: string }> = {
  citadine: { label: "Citadine",      size: "XS", bg: "bg-slate-100",  text: "text-slate-600"  },
  compacte: { label: "Compacte",      size: "S",  bg: "bg-sky-100",    text: "text-sky-700"    },
  berline:  { label: "Berline",       size: "M",  bg: "bg-indigo-100", text: "text-indigo-700" },
  suv:      { label: "SUV",           size: "L",  bg: "bg-orange-100", text: "text-orange-700" },
  grand:    { label: "Grand gabarit", size: "XL", bg: "bg-rose-100",   text: "text-rose-700"   },
};

// Ordre croissant de taille (index = taille)
const CATEGORY_ORDER = ["citadine", "compacte", "berline", "suv", "grand"];

function getCompatibility(finderCat: string | null, sharerCat: string | null): {
  ok: boolean; warning: boolean; message: string;
} {
  if (!finderCat || !sharerCat) return { ok: true, warning: false, message: "" };
  const fi = CATEGORY_ORDER.indexOf(finderCat);
  const si = CATEGORY_ORDER.indexOf(sharerCat);
  if (si >= fi) return { ok: true, warning: false, message: "✅ Compatible avec ton véhicule" };
  if (si === fi - 1) return { ok: true, warning: true,  message: "⚠️ Place peut-être juste — vérifie bien" };
  return { ok: false, warning: true, message: "❌ Place probablement trop petite pour ton véhicule" };
}

const COLORS_FR: Record<string, string> = {
  blanc: "blanche", noir: "noire", gris: "grise", argent: "argentée",
  rouge: "rouge", bleu: "bleue", vert: "verte", jaune: "jaune",
  orange: "orange", marron: "marron", beige: "beige", violet: "violette",
};

interface SharerVehicle {
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_length_cm: number | null;
  vehicle_category: string | null;
}

export default function SpotSheet() {
  const { selectedSpot, selectSpot, profile, userLat, userLng } = useMapStore();
  const [loading, setLoading]           = useState(false);
  const [sharerVehicle, setSharerVehicle] = useState<SharerVehicle | null>(null);

  // Charger le véhicule du sharer
  useEffect(() => {
    if (!selectedSpot) return;
    const supabase = createClient();
    supabase
      .from("profiles" as never)
      .select("vehicle_make, vehicle_model, vehicle_color, vehicle_length_cm, vehicle_category")
      .eq("id", selectedSpot.sharer_id)
      .single()
      .then(({ data }: { data: unknown }) => setSharerVehicle((data as SharerVehicle) ?? null));
  }, [selectedSpot?.id]);

  if (!selectedSpot) return null;

  const horizon  = getHorizon(selectedSpot.expires_at);
  const minsLeft = getMinutesLeft(selectedSpot.expires_at);
  const distance = userLat && userLng
    ? haversineDistance(userLat, userLng, selectedSpot.lat, selectedSpot.lng)
    : null;
  const timeAgo = formatDistanceToNow(new Date(selectedSpot.created_at), { addSuffix: true, locale: fr });

  function openNavigation(lat: number, lng: number) {
    // iOS → Plans natif, Android/autre → Google Maps
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
        spot_id: selectedSpot!.id, finder_id: profile.id, sharer_id: selectedSpot!.sharer_id,
        coin_amount: selectedSpot!.coin_price,
        commission: Math.round(selectedSpot!.coin_price * 0.25),
        sharer_receive: selectedSpot!.coin_price - Math.round(selectedSpot!.coin_price * 0.25),
        status: "reserved",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).select().single();
    if (error) { toast.error("Erreur lors de l'achat d'info"); setLoading(false); return; }
    await supabase.rpc("process_coin_transaction", {
      p_user_id: profile.id, p_amount: -selectedSpot!.coin_price,
      p_type: "spend", p_description: `Info achetée · ${selectedSpot!.address ?? "Place"}`,
      p_reservation_id: reservation.id,
    });
    await supabase.from("parking_spots").update({ status: "reserved" }).eq("id", selectedSpot!.id);

    // Notifier le Sharer qu'un conducteur a vu son info
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

  return (
    <>
      <div className="absolute inset-0 z-[900] bg-black/40 backdrop-blur-[2px]" onClick={() => selectSpot(null)} />

      <div className="absolute bottom-0 left-0 right-0 z-[910] bg-white rounded-t-[28px] shadow-[0_-20px_60px_rgba(0,0,0,.15)] animate-in slide-in-from-bottom-4">
        {/* Bande de couleur horizon */}
        <div className={`h-1.5 bg-gradient-to-r ${horizon.bg} rounded-t-[28px]`} />

        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-10 pt-2">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${horizon.badge}`}>
                  {horizon.label}
                </span>
                {minsLeft > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    dans {minsLeft} min
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-gray-900 leading-snug">
                {selectedSpot.address ?? `${selectedSpot.lat.toFixed(4)}, ${selectedSpot.lng.toFixed(4)}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
            </div>
            <button onClick={() => selectSpot(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 transition active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <StatCard
              icon={<span className="text-lg">⚡</span>}
              label="Récompense"
              value={`${selectedSpot.coin_price} SC`}
              accent
            />
            <StatCard
              icon={<MapPin className="w-4 h-4 text-blue-500" />}
              label="Distance"
              value={distance != null
                ? distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`
                : "—"}
            />
            <StatCard
              icon={<span className="text-lg">👤</span>}
              label="Partagé"
              value={selectedSpot.sharer_id.slice(0, 6) + "…"}
              small
            />
          </div>

          {/* Véhicule du sharer + compatibilité */}
          {sharerVehicle?.vehicle_make && (
            <div className="mb-4 space-y-2">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Car className="w-4 h-4 text-[#22956b]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-semibold">Voiture qui part</p>
                  <p className="text-sm font-black text-gray-900 truncate">
                    {sharerVehicle.vehicle_make} {sharerVehicle.vehicle_model}
                    {sharerVehicle.vehicle_color && (
                      <span className="font-semibold text-gray-500"> · {COLORS_FR[sharerVehicle.vehicle_color] ?? sharerVehicle.vehicle_color}</span>
                    )}
                  </p>
                </div>
                {sharerVehicle.vehicle_category && (() => {
                  const cat = CATEGORY_LABELS[sharerVehicle.vehicle_category!];
                  return cat ? (
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${cat.bg} ${cat.text}`}>
                        {cat.size}
                      </span>
                      <p className="text-[10px] font-semibold text-gray-400">{cat.label}</p>
                      {sharerVehicle.vehicle_length_cm && (
                        <p className="text-[10px] text-gray-400">{sharerVehicle.vehicle_length_cm} cm</p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Badge compatibilité */}
              {(() => {
                const finderCat = (profile as Record<string, unknown>)?.vehicle_category as string | null;
                if (!finderCat) return null;
                const compat = getCompatibility(finderCat, sharerVehicle.vehicle_category);
                return (
                  <div className={`px-3 py-2 rounded-xl text-xs font-bold ${
                    !compat.warning ? "bg-green-50 text-green-700" :
                    compat.ok      ? "bg-amber-50 text-amber-700" :
                                     "bg-red-50 text-red-600"
                  }`}>
                    {compat.message}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Solde */}
          {profile && (
            <div className="flex justify-between items-center bg-gray-50 rounded-2xl px-4 py-3 mb-4">
              <span className="text-xs font-semibold text-gray-500">Ton solde actuel</span>
              <span className="text-sm font-black text-[#22956b]">⚡ {profile.coin_balance} SC</span>
            </div>
          )}

          {/* Action unique */}
          <button
            onClick={handleContrib}
            disabled={loading || !profile || profile.coin_balance < selectedSpot.coin_price}
            className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#22956b]/30 disabled:opacity-40 transition active:scale-[.98] flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {loading ? "…" : `Obtenir l'info · ${selectedSpot.coin_price} SC`}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            ℹ️ Tu accèdes à une information partagée par un conducteur
          </p>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, accent, small }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-1">
      {icon}
      <p className={`font-black ${small ? "text-xs" : "text-sm"} ${accent ? "text-[#22956b]" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
    </div>
  );
}
