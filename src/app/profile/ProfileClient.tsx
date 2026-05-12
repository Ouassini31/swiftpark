"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Star, LogOut, Edit2, Check,
  Zap, Trophy, ChevronRight, Loader2, FileText, Camera, History, ArrowLeftRight, Trash2, X,
} from "lucide-react";
import Link from "next/link";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/types/database";
import VehicleSelector from "@/components/profile/VehicleSelector";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const DM = "var(--font-dm-sans), system-ui, sans-serif";

interface Badge { emoji: string; label: string; unlocked: boolean; }

function getBadges(profile: Profile): Badge[] {
  return [
    { emoji: "🏆", label: "1er signal",     unlocked: profile.spots_shared >= 1 },
    { emoji: "⚡", label: "10 signalées",  unlocked: profile.spots_shared >= 10 },
    { emoji: "🔥", label: "50 signalées",  unlocked: profile.spots_shared >= 50 },
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
  const [editing, setEditing]     = useState(false);
  const [fullName, setFullName]   = useState(profile?.full_name ?? "");
  const [saving, setSaving]       = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext  = file.name.split(".").pop();
      const path = `avatars/${profile.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
      setAvatarUrl(url);
      toast.success("Photo mise à jour ✅");
    } catch {
      toast.error("Erreur lors de l'upload");
    }
    setUploading(false);
  }

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

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/onboarding");
    } catch {
      toast.error("Erreur lors de la suppression du compte");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (!profile) return null;

  const rating     = profile.rating ?? 0;
  const nameParts  = (profile.full_name || profile.username).trim().split(/\s+/);
  const initials   = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : nameParts[0].slice(0, 2).toUpperCase();
  const badges         = getBadges(profile);
  const unlockedCount  = badges.filter(b => b.unlocked).length;
  const referralCode   = (profile as { referral_code?: string }).referral_code;
  const p              = profile as Record<string, unknown>;

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f5f5f2", fontFamily: DM }}>

      {/* ── Photo de voiture — pleine largeur ── */}
      <div className="relative w-full" style={{ height: 260 }}>

        {/* Image ou placeholder */}
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Ma voiture" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg, #085041 0%, #22956b 100%)" }}>
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <Camera className="w-7 h-7 text-white/70" />
            </div>
            <p className="text-white/60 text-sm">Ajoute la photo de ta voiture</p>
          </div>
        )}

        {/* Gradient overlay bas */}
        <div className="absolute inset-x-0 bottom-0 h-32"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }} />

        {/* Bouton retour */}
        <Link href="/map"
          className="absolute top-12 left-4 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>

        {/* Bouton upload photo */}
        <label className="absolute top-12 right-4 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.35)" }}>
            {uploading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Camera className="w-4 h-4 text-white" />}
          </div>
        </label>

        {/* Nom + username + étoiles en bas de la photo */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                  className="text-xl font-black bg-white/20 backdrop-blur-md text-white rounded-xl px-3 py-1.5 w-full border border-white/30"
                  style={{ fontFamily: DM }}
                />
              ) : (
                <h1 className="text-xl font-black text-white leading-tight truncate"
                  style={{ letterSpacing: "-0.02em" }}>
                  {profile.full_name || profile.username}
                </h1>
              )}
              <p className="text-white/60 text-xs mt-0.5">@{profile.username}</p>
              {profile.rating_count > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "fill-[#f5a623] text-[#f5a623]" : "text-white/30"}`} />
                  ))}
                  <span className="text-white/60 text-[10px] ml-0.5">{rating.toFixed(1)} · {profile.rating_count} avis</span>
                </div>
              )}
            </div>
            {/* Bouton édition nom */}
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{ background: editing ? "#22956b" : "rgba(0,0,0,0.35)" }}
            >
              {saving
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : editing
                  ? <Check className="w-4 h-4 text-white" />
                  : <Edit2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
        {[
          { value: profile.coin_balance, label: "SwiftCoins", color: "#f5a623" },
          { value: profile.spots_shared, label: "Signalées",  color: "#22956b" },
          { value: profile.spots_found,  label: "Trouvées",   color: "#7c3aed" },
        ].map(({ value, label, color }) => (
          <div key={label} className="flex flex-col items-center py-4 px-2">
            <span className="text-2xl font-black" style={{ color, letterSpacing: "-0.03em" }}>{value}</span>
            <span className="text-[11px] text-gray-400 mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-3 mt-4">

        {/* ── Badges ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Badges</span>
            <span className="text-xs font-semibold" style={{ color: "#22956b" }}>{unlockedCount}/{badges.length}</span>
          </div>
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
            {badges.map((b) => (
              <div key={b.label}
                className="shrink-0 flex flex-col items-center gap-1 px-3 py-3 rounded-2xl"
                style={{
                  background: b.unlocked ? "#e8f5ef" : "#f5f5f2",
                  opacity: b.unlocked ? 1 : 0.5,
                  minWidth: 72,
                }}>
                <span className="text-2xl">{b.emoji}</span>
                <p className="text-[10px] text-center font-semibold text-gray-700 leading-tight whitespace-nowrap">
                  {b.label}
                </p>
                {b.unlocked && (
                  <span className="text-[9px] font-bold" style={{ color: "#22956b" }}>Débloqué</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Parrainage ── */}
        {referralCode && (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parrainage</span>
              <span className="text-xs text-gray-400">+5 SC chacun</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black tracking-widest" style={{ color: "#1a1a16", letterSpacing: "0.12em" }}>
                {referralCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode ?? "");
                  toast.success("Code copié !");
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: "#e8f5ef", color: "#22956b" }}
              >
                Copier
              </button>
            </div>
          </div>
        )}

        {/* ── Véhicule ── */}
        <VehicleSelector
          userId={userId}
          initial={{
            make:      p.vehicle_make as string ?? "",
            model:     p.vehicle_model as string ?? "",
            year:      p.vehicle_year as number | null ?? null,
            color:     p.vehicle_color as string ?? "",
            length_cm: p.vehicle_length_cm as number | null ?? null,
            category:  p.vehicle_category as string | null ?? null,
            plate:     p.vehicle_plate as string ?? "",
          }}
        />

        {/* ── Menu ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { href: "/wallet",       icon: <Zap className="w-4 h-4" />,             label: "Wallet SwiftCoins",    sub: `${profile.coin_balance} SC disponibles`, color: "#f5a623" },
            { href: "/reservations", icon: <ArrowLeftRight className="w-4 h-4" />,  label: "Mes échanges",         sub: "Infos trouvées & départs signalés",      color: "#22956b" },
            { href: "/history",      icon: <History className="w-4 h-4" />,         label: "Historique",           sub: "Timeline de tes déplacements",           color: "#3b82f6" },
            { href: "/leaderboard",  icon: <Trophy className="w-4 h-4" />,          label: "Classement",           sub: "Voir ton rang",                          color: "#f5a623" },
            { href: "/how-it-works", icon: <span className="text-sm">💡</span>,     label: "Comment ça marche",    sub: "Guide & FAQ",                            color: "#3b82f6" },
            { href: "/legal",        icon: <FileText className="w-4 h-4" />,        label: "CGU & Confidentialité",sub: "Mentions légales",                       color: "#94a3b8" },
          ].map(({ href, icon, label, sub, color }, i, arr) => (
            <Link key={href} href={href}
              className="flex items-center gap-3.5 px-4 py-4 active:bg-gray-50 transition"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid #f5f5f2" : "none" }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, color }}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>

        {/* ── Déconnexion ── */}
        <button
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm active:scale-95 transition"
          style={{ background: "#fff2f2", color: "#ef4444" }}
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>

        {/* Supprimer le compte */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-3 flex items-center justify-center gap-2 text-xs font-medium text-gray-400 active:text-red-400 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer mon compte
        </button>

        {/* Email en bas, discret */}
        <p className="text-center text-[11px] text-gray-400 pb-2">{email}</p>

      </div>

      {/* ── Modal confirmation suppression ── */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[900]" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[910] bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Supprimer mon compte</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 mb-5">
              <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Action irréversible</p>
              <p className="text-xs text-red-600 leading-relaxed">
                Ton profil, tes SwiftCoins, ton historique et tes données personnelles seront définitivement supprimés.
                Cette action ne peut pas être annulée.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
                {deleting ? "Suppression…" : "Oui, supprimer définitivement"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
