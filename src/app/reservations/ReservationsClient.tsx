"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Star } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCoins } from "@/lib/utils";
import { useCountdown } from "@/hooks/useCountdown";
import RatingModal from "@/components/rating/RatingModal";
import GpsValidation from "@/components/parking/GpsValidation";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const TrackingPanel = dynamic(
  () => import("@/components/tracking/TrackingPanel"),
  { ssr: false }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReservationWithJoins = any;

const STATUS_CONFIG = {
  reserved:  { label: "En cours",  color: "bg-brand-100 text-brand-700",   icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Terminé",   color: "bg-green-100 text-green-700",   icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Annulé",    color: "bg-red-100 text-red-600",       icon: <XCircle className="w-3 h-3" /> },
  expired:   { label: "Expiré",    color: "bg-gray-100 text-gray-500",     icon: <Clock className="w-3 h-3" /> },
};

export default function ReservationsClient({
  reservations, currentUserId,
}: {
  reservations: ReservationWithJoins[];
  currentUserId: string;
}) {
  const [ratingTarget, setRatingTarget] = useState<ReservationWithJoins | null>(null);
  const [gpsTarget, setGpsTarget] = useState<ReservationWithJoins | null>(null);
  const [trackingTarget, setTrackingTarget] = useState<ReservationWithJoins | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");

  const active  = reservations.filter((r: ReservationWithJoins) => r.status === "reserved");
  const history = reservations.filter((r: ReservationWithJoins) => r.status !== "reserved");

  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-5 px-5">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/map"
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-white text-xl">Mes échanges d&apos;info</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/20 rounded-xl p-1">
          {(["active", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t ? "bg-white text-[#22956b] shadow-sm" : "text-white/70"
              }`}
            >
              {t === "active" ? `En cours (${active.length})` : `Historique (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {tab === "active" && (
          <>
            {active.length === 0 ? (
              <EmptyState message="Aucun échange en cours" sub="Trouvez une info sur la carte !" />
            ) : (
              active.map((r: ReservationWithJoins) => (
                <ActiveCard
                  key={r.id}
                  reservation={r}
                  currentUserId={currentUserId}
                  onValidate={() => setGpsTarget(r)}
                  onTrack={() => setTrackingTarget(r)}
                  onCancel={async () => {
                    const supabase = createClient();
                    const res = await fetch(
                      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cancel-reservation`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reservation_id: r.id, user_id: currentUserId }),
                      }
                    );
                    const data = await res.json();
                    if (data.success) {
                      toast.success(`Annulé — ${data.refund_amount} SC remboursés`);
                      window.location.reload();
                    } else {
                      toast.error("Impossible d'annuler");
                    }
                  }}
                />
              ))
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {history.length === 0 ? (
              <EmptyState message="Aucun historique" sub="Vos transactions passées apparaîtront ici." />
            ) : (
              history.map((r: ReservationWithJoins) => (
                <HistoryCard
                  key={r.id}
                  reservation={r}
                  currentUserId={currentUserId}
                  onRate={() => setRatingTarget(r)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Modale Tracking GPS temps réel */}
      {trackingTarget && (
        <div className="fixed inset-0 z-50 bg-[#f5f5f2] flex flex-col">
          <TrackingPanel
            reservationId={trackingTarget.id}
            spotLat={trackingTarget.parking_spots?.lat}
            spotLng={trackingTarget.parking_spots?.lng}
            role={trackingTarget.finder_id === currentUserId ? "finder" : "sharer"}
            finderName={
              trackingTarget.finder_id === currentUserId
                ? undefined
                : trackingTarget.finder?.full_name ?? trackingTarget.finder?.username
            }
            onClose={() => setTrackingTarget(null)}
          />
        </div>
      )}

      {/* Modale GPS */}
      {gpsTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 pb-8 px-4">
          <GpsValidation
            reservation={gpsTarget}
            role={gpsTarget.finder_id === currentUserId ? "finder" : "sharer"}
            spotLat={gpsTarget.parking_spots?.lat}
            spotLng={gpsTarget.parking_spots?.lng}
            onValidated={() => {
              setGpsTarget(null);
              toast.success("Position validée !");
              window.location.reload();
            }}
          />
        </div>
      )}

      {/* Modale Rating */}
      {ratingTarget && (
        <RatingModal
          reservationId={ratingTarget.id}
          spotAddress={ratingTarget.parking_spots?.address ?? null}
          sharerId={ratingTarget.sharer_id}
          onClose={() => setRatingTarget(null)}
        />
      )}
    </div>
  );
}

/* ─── Active Card ─────────────────────────────────────────── */
function ActiveCard({
  reservation, currentUserId, onValidate, onTrack, onCancel,
}: {
  reservation: ReservationWithJoins;
  currentUserId: string;
  onValidate: () => void;
  onTrack: () => void;
  onCancel: () => void;
}) {
  const { formatted, isExpired, isUrgent } = useCountdown(reservation.expires_at);
  const isFinder = reservation.finder_id === currentUserId;
  const other = isFinder ? reservation.sharer : reservation.finder;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Timer */}
      <div className={`px-4 py-2 flex items-center justify-between text-xs font-bold ${
        isExpired ? "bg-red-500 text-white" : isUrgent ? "bg-orange-100 text-orange-700" : "bg-brand-50 text-brand-700"
      }`}>
        <span>{isExpired ? "Expiré" : "Expire dans"}</span>
        <span className="text-base font-black">{formatted}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Adresse */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-700">
            {reservation.parking_spots?.address ?? "Position GPS"}
          </p>
        </div>

        {/* Interlocuteur */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-xs font-black text-brand-600">
            {other?.full_name?.[0]?.toUpperCase() ?? other?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">
              {isFinder ? "Info de" : "Conducteur"} {other?.full_name ?? other?.username}
            </p>
            {other?.rating && (
              <p className="text-xs text-gray-400 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-swiftcoin-400 text-swiftcoin-400" />
                {Number(other.rating).toFixed(1)}
              </p>
            )}
          </div>
          <span className="ml-auto text-sm font-black text-swiftcoin-600">
            {formatCoins(reservation.coin_amount)}
          </span>
        </div>

        {/* Actions */}
        {!isExpired && (
          <div className="space-y-2 pt-1">
            <button
              onClick={onTrack}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              📍 Voir en direct
            </button>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={onValidate}
                className="flex-[2] py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
              >
                ✅ Valider ma position
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── History Card ────────────────────────────────────────── */
function HistoryCard({
  reservation, currentUserId, onRate,
}: {
  reservation: ReservationWithJoins;
  currentUserId: string;
  onRate: () => void;
}) {
  const cfg = STATUS_CONFIG[reservation.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.cancelled;
  const isFinder = reservation.finder_id === currentUserId;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-gray-400">
            {isFinder ? "Finder" : "Sharer"}
          </span>
        </div>
        <span className={`text-sm font-black ${
          isFinder ? "text-red-500" : "text-brand-600"
        }`}>
          {isFinder ? `-${reservation.coin_amount}` : `+${reservation.sharer_receive}`} SC
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="truncate">{reservation.parking_spots?.address ?? "Place partagée"}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {format(new Date(reservation.created_at), "d MMM yyyy · HH:mm", { locale: fr })}
        </span>
        {reservation.status === "completed" && (
          <button
            onClick={onRate}
            className="flex items-center gap-1 px-3 py-1 bg-swiftcoin-50 text-swiftcoin-700 text-xs font-semibold rounded-full hover:bg-swiftcoin-100"
          >
            <Star className="w-3 h-3 fill-swiftcoin-400 text-swiftcoin-400" />
            Noter
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-5xl mb-3">🅿️</div>
      <p className="text-sm font-semibold">{message}</p>
      <p className="text-xs mt-1">{sub}</p>
    </div>
  );
}
