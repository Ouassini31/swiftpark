"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Star, MapPin, LogOut, Edit2, Check,
  Zap, Trophy, TrendingUp, Wallet, ChevronRight, Loader2, FileText,
} from "lucide-react";
import Link from "next/link";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/types/database";
import VehicleSelector from "@/components/profile/VehicleSelector";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Badge { emoji: string; label: string; unlocked: boolean; }

function getBadges(profile: Profile): Badge[] {
  return [
    { emoji: "🏆", label: "1ère place",    unlocked: profile.spots_shared >= 1 },
    { emoji: "⚡", label: "10 partagées",  unlocked: profile.spots_shared >= 10 },
    { emoji: "🔥", label: "50 partagées",  unlocked: profile.spots_shared >= 50 },
    { emoji: "🌟", label: "Note 4.5+",     unlocked: (profile.rating ?? 0) >= 4.5 && profile.rating_count >= 5 },
    { emoji: "🎯", label: "10 trouvées",   unlocked: profile.spots_found >= 10 },
    { emoji: "💎", label: "100 SC gagnés", unlocked: profile.coins_earned >= 100 },
  ];
}

export default function ProfileClient({
  profile, email, userId,
}: {
  profile: Profile | null;
  email: string;
  userId: string;
}) {
  const router = useRouter();
  const [editing, setEditing]   = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving]     = useState(false);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id);

    if (error) toast.error("Erreur lors de la sauvegarde");
    else { toast.success("Profil mis à jour ✅"); setEditing(false); }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/onboarding");
    router.refresh();
  }

  if (!profile) return null;

  const rating  = profile.rating ?? 0;
  const initials = (profile.full_name || profile.username).slice(0, 2).toUpperCase();
  const badges  = getBadges(profile);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-28">

      {/* ── Bandeau hero ────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-8 px-5 relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute top-6 -right-4 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative flex items-start justify-between mb-5">
          <Link href="/map"
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <button
            onClick={editing ? handleSave : () => setEditing(true)}
            disabled={saving}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : editing
                ? <Check className="w-4 h-4" />
                : <Edit2 className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Avatar + infos */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-3xl bg-white/25 flex items-center justify-center">
            <span className="text-3xl font-black text-white">{initials}</span>
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
                className="text-xl font-black text-[#22956b] bg-white rounded-xl px-3 py-1.5 w-full"
              />
            ) : (
              <h2 className="text-xl font-black text-white">
                {profile.full_name || profile.username}
              </h2>
            )}
            <p className="text-white/60 text-sm">@{profile.username}</p>
            <p className="text-white/50 text-xs truncate">{email}</p>
          </div>
        </div>

        {/* Note */}
        {profile.rating_count > 0 ? (
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= Math.round(rating) ? "fill-[#f5a623] text-[#f5a623]" : "text-white/30"}`}
              />
            ))}
            <span className="text-white/70 text-xs ml-1">
              {rating.toFixed(1)} · {profile.rating_count} avis
            </span>
          </div>
        ) : (
          <p className="text-white/50 text-xs">Pas encore évalué</p>
        )}
      </div>

      {/* ── Stats rapides ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-5">
        <StatCard
          icon={<Zap className="w-5 h-5 text-[#f5a623] fill-[#f5a623]" />}
          label="SwiftCoins"
          value={String(profile.coin_balance)}
          bg="bg-white"
        />
        <StatCard
          icon={<MapPin className="w-5 h-5 text-[#22956b]" />}
          label="Partagées"
          value={String(profile.spots_shared)}
          bg="bg-white"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-violet-500" />}
          label="Trouvées"
          value={String(profile.spots_found)}
          bg="bg-white"
        />
      </div>

      <div className="px-4 space-y-4 mt-5">

        {/* ── Badges ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Badges</h3>
            <span className="text-xs text-gray-400">{unlockedCount}/{badges.length}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              {badges.map((b) => (
                <div key={b.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                    b.unlocked ? "bg-[#e8f5ef]" : "bg-gray-50 opacity-40"
                  }`}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <p className="text-[10px] text-center font-semibold text-gray-700 leading-tight">
                    {b.label}
                  </p>
                  {b.unlocked && (
                    <span className="text-[9px] text-[#22956b] font-bold">Débloqué</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Code de parrainage ───────────────────────────────── */}
        {(profile as { referral_code?: string }).referral_code && (
          <section className="bg-gradient-to-br from-[#22956b] to-[#085041] rounded-2xl p-4 text-white">
            <p className="text-xs font-semibold text-white/70 mb-1">Ton code de parrainage</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black tracking-widest">
                {(profile as { referral_code?: string }).referral_code}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText((profile as { referral_code?: string }).referral_code ?? "");
                  toast.success("Code copié !");
                }}
                className="bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                Copier
              </button>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Partage ce code — vous gagnez chacun 5 SC 🎁
            </p>
          </section>
        )}

        {/* ── Véhicule ─────────────────────────────────────────── */}
        <VehicleSelector
          userId={userId}
          initial={{
            make:      (profile as Record<string, unknown>).vehicle_make as string ?? "",
            model:     (profile as Record<string, unknown>).vehicle_model as string ?? "",
            year:      (profile as Record<string, unknown>).vehicle_year as number | null ?? null,
            color:     (profile as Record<string, unknown>).vehicle_color as string ?? "",
            length_cm: (profile as Record<string, unknown>).vehicle_length_cm as number | null ?? null,
            category:  (profile as Record<string, unknown>).vehicle_category as string | null ?? null,
          }}
        />

        {/* ── Liens rapides ────────────────────────────────────── */}
        <section className="space-y-2">
          <QuickLink
            href="/wallet"
            icon={<Wallet className="w-5 h-5 text-[#22956b]" />}
            label="Wallet SwiftCoins"
            sub={`${profile.coin_balance} SC disponibles`}
            bg="bg-[#e8f5ef]"
          />
          <QuickLink
            href="/leaderboard"
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            label="Classement"
            sub="Voir ton rang"
            bg="bg-yellow-50"
          />
          <QuickLink
            href="/how-it-works"
            icon={<span className="text-xl">💡</span>}
            label="Comment ça marche"
            sub="Guide & questions fréquentes"
            bg="bg-blue-50"
          />
          <QuickLink
            href="/legal"
            icon={<FileText className="w-5 h-5 text-gray-500" />}
            label="Mentions légales & CGU"
            sub="Politique de confidentialité"
            bg="bg-gray-100"
          />
        </section>

        {/* ── Résumé financier ─────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">
            Résumé financier
          </h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <FinRow label="SC gagnés (total)" value={`+${profile.coins_earned} SC`} positive />
            <FinRow label="SC dépensés (total)" value={`-${profile.coins_spent} SC`} />
            <div className="border-t border-gray-100 pt-3">
              <FinRow
                label="Solde net"
                value={`${profile.coin_balance} SC`}
                bold
              />
            </div>
          </div>
        </section>

        {/* ── Déconnexion ──────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 text-red-500 bg-white
            rounded-2xl shadow-sm font-semibold active:scale-95 transition"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

/* ── Sous-composants ─────────────────────────────────────────────────── */

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-2xl p-3.5 shadow-sm text-center`}>
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-lg font-black text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon, label, sub, bg }: {
  href: string; icon: React.ReactNode; label: string; sub: string; bg: string;
}) {
  return (
    <Link href={href}
      className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 shadow-sm"
    >
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </Link>
  );
}

function FinRow({ label, value, positive, bold }: {
  label: string; value: string; positive?: boolean; bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-500"}`}>{label}</p>
      <p className={`text-sm font-black ${positive ? "text-[#22956b]" : bold ? "text-gray-900" : "text-red-500"}`}>
        {value}
      </p>
    </div>
  );
}
