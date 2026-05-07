"use client";

import { useState } from "react";
import { Star, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RatingModalProps {
  reservationId: string;
  spotAddress?: string | null;
  sharerId: string;
  onClose: () => void;
}

const TAGS_GOOD = ["Exact 📍", "Rapide ⚡", "Bien expliqué 👌", "Spot facile 🚗"];
const TAGS_BAD  = ["Déjà pris 😤", "Mauvaise adresse 🗺️", "Trop loin 📏", "Expiré ⏰"];

export default function RatingModal({ reservationId, spotAddress, sharerId, onClose }: RatingModalProps) {
  const { profile } = useMapStore();
  const [stars, setStars]     = useState(0);
  const [hovered, setHovered] = useState(0);
  const [tags, setTags]       = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const isGood = stars >= 4;
  const availableTags = stars > 0 ? (isGood ? TAGS_GOOD : TAGS_BAD) : [];

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit() {
    if (stars === 0) { toast.error("Donne au moins 1 étoile"); return; }
    if (!profile) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("ratings").insert({
      reservation_id: reservationId,
      rater_id: profile.id,
      rated_id: sharerId,
      stars, tags,
      comment: comment.trim() || null,
    }).then(() => {});
    // Mettre à jour le score moyen du partageur
    const { data: existing } = await supabase
      .from("profiles").select("rating_avg, rating_count").eq("id", sharerId).single();
    if (existing) {
      const count = (existing.rating_count ?? 0) + 1;
      const avg   = ((existing.rating_avg ?? 0) * (count - 1) + stars) / count;
      await supabase.from("profiles")
        .update({ rating_avg: Math.round(avg * 10) / 10, rating_count: count })
        .eq("id", sharerId);
    }
    toast.success(stars >= 4 ? "Merci pour ton retour ! ⭐" : "Retour enregistré");
    onClose();
  }

  return (
    <>
      <div className="absolute inset-0 z-[900] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 z-[910] bg-white rounded-t-[28px] shadow-[0_-20px_60px_rgba(0,0,0,.15)] animate-in slide-in-from-bottom-4">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-5 pb-10 pt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-gray-900">Évalue l&apos;info</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X className="w-4 h-4" /></button>
          </div>
          {spotAddress && <p className="text-xs text-gray-400 mb-5">{spotAddress.split(",").slice(0, 2).join(",")}</p>}
          <div className="flex justify-center gap-2 mb-5">
            {[1,2,3,4,5].map((s) => (
              <button key={s} onClick={() => { setStars(s); setTags([]); }} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} className="transition active:scale-90">
                <Star className={cn("w-10 h-10 transition-colors", s <= (hovered || stars) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200")} />
              </button>
            ))}
          </div>
          {stars > 0 && (
            <div className={cn("flex items-center justify-center gap-2 py-2 px-4 rounded-2xl mx-auto w-fit mb-4 text-sm font-bold", isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>
              {isGood ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
              {stars===5?"Parfait !":stars===4?"Très bien":stars===3?"Correct":stars===2?"Décevant":"Mauvais"}
            </div>
          )}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {availableTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition active:scale-95", tags.includes(tag) ? "bg-[#22956b] text-white border-[#22956b]" : "bg-gray-50 text-gray-600 border-gray-200")}>{tag}</button>
              ))}
            </div>
          )}
          {stars > 0 && <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un commentaire ? (optionnel)" rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:border-[#22956b] resize-none mb-4 transition" />}
          <button onClick={handleSubmit} disabled={stars===0||loading} className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 disabled:opacity-40 transition active:scale-[.98]">
            {loading ? "Envoi…" : "Envoyer mon avis"}
          </button>
        </div>
      </div>
    </>
  );
}
