"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Car, MapPin, LogOut, Edit2, Check } from "lucide-react";
import Link from "next/link";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { formatCoins } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ProfileClient({
  profile, email,
}: {
  profile: Profile | null;
  email: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile!.id);

    if (error) toast.error("Erreur lors de la sauvegarde");
    else {
      toast.success("Profil mis à jour !");
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  if (!profile) return null;

  const rating = profile.rating ?? 0;
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-4 px-5">
        <div className="flex items-center justify-between mb-6">
          <Link href="/map" className="p-2 bg-gray-100 rounded-xl text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-gray-900">Mon profil</h1>
          <button
            onClick={editing ? handleSave : () => setEditing(true)}
            className="p-2 bg-brand-50 rounded-xl text-brand-600"
          >
            {editing
              ? <Check className="w-5 h-5" />
              : <Edit2 className="w-5 h-5" />
            }
          </button>
        </div>

        {/* Avatar + nom */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl font-black text-brand-600">
            {profile.full_name?.[0]?.toUpperCase() ?? profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-lg font-black text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 w-full"
              />
            ) : (
              <h2 className="text-lg font-black text-gray-900">
                {profile.full_name || profile.username}
              </h2>
            )}
            <p className="text-sm text-gray-400">@{profile.username}</p>
            <p className="text-xs text-gray-400">{email}</p>
          </div>
        </div>

        {/* Étoiles */}
        {profile.rating_count > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {stars.map((filled, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${filled ? "fill-swiftcoin-400 text-swiftcoin-400" : "text-gray-200"}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              {rating.toFixed(1)} ({profile.rating_count} avis)
            </span>
          </div>
        )}
      </div>

      <div className="px-4 mt-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="⚡" label="Solde" value={`${profile.coin_balance} SC`} color="text-swiftcoin-600" />
          <StatCard icon="🅿️" label="Partagées" value={String(profile.spots_shared)} color="text-brand-600" />
          <StatCard icon="🔍" label="Trouvées" value={String(profile.spots_found)} color="text-purple-600" />
        </div>

        {/* Gains totaux */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Résumé financier</p>
          <div className="space-y-2">
            <Row icon={<Car className="w-4 h-4 text-brand-500" />} label="Total gagné" value={formatCoins(profile.coins_earned)} positive />
            <Row icon={<MapPin className="w-4 h-4 text-gray-400" />} label="Total dépensé" value={formatCoins(profile.coins_spent)} />
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 text-red-500 bg-white
            rounded-2xl shadow-sm font-semibold hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm font-black ${color}`}>{value}</p>
    </div>
  );
}

function Row({ icon, label, value, positive }: { icon: React.ReactNode; label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        {label}
      </div>
      <span className={`text-sm font-bold ${positive ? "text-brand-600" : "text-gray-700"}`}>{value}</span>
    </div>
  );
}
