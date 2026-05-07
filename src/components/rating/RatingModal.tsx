"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

interface RatingModalProps {
  reservation: Reservation;
  ratedName: string;
  role: "sharer" | "finder"; // rôle de la personne à noter
  onClose: () => void;
}

export default function RatingModal({ reservation, ratedName, role, onClose }: RatingModalProps) {
  const profile = useMapStore((s) => s.profile);
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (score === 0) {
      toast.error("Choisissez une note");
      return;
    }
    if (!profile) return;

    setLoading(true);
    const supabase = createClient();

    const ratedId = role === "sharer" ? reservation.sharer_id : reservation.finder_id;

    const { error } = await supabase.from("ratings").insert({
      reservation_id: reservation.id,
      rater_id: profile.id,
      rated_id: ratedId,
      score,
      comment: comment.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("Vous avez déjà noté cette transaction");
      } else {
        toast.error("Erreur lors de la notation");
      }
      setLoading(false);
      return;
    }

    toast.success("Merci pour votre évaluation ⭐");
    onClose();
  }

  const LABELS = ["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent !"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Évaluer</h2>
            <p className="text-sm text-gray-500">{ratedName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Étoiles */}
        <div className="flex justify-center gap-3 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform active:scale-110"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  s <= (hovered || score)
                    ? "fill-swiftcoin-400 text-swiftcoin-400 scale-110"
                    : "text-gray-200"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Label dynamique */}
        <p className="text-center text-sm font-semibold text-brand-600 mb-5 h-5">
          {LABELS[hovered || score]}
        </p>

        {/* Commentaire */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Un commentaire ? (optionnel)"
          rows={3}
          maxLength={200}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm resize-none mb-4"
        />

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm"
          >
            Plus tard
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || score === 0}
            className="flex-2 flex-[2] py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold
              rounded-2xl text-sm transition disabled:opacity-40"
          >
            {loading ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
