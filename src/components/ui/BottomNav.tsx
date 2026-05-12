"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, UserPlus, Trophy, User, X, Copy, Check, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/store/useMapStore";

const NAV = [
  { href: "/map",           label: "Carte",    icon: Map },
  { href: "/reservations",  label: "Échanges", icon: ArrowLeftRight },
  { href: "#invite",        label: "Inviter",  icon: UserPlus, primary: true },
  { href: "/leaderboard",   label: "Top",      icon: Trophy },
  { href: "/profile",       label: "Profil",   icon: User },
];

function InviteSheet({ onClose, referralCode }: { onClose: () => void; referralCode?: string }) {
  const [copied, setCopied] = useState(false);
  const base = "https://www.swiftpark.fr";
  const link = referralCode ? `${base}/auth/register?ref=${referralCode}` : base;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: "SwiftPark",
        text: "Trouve une place de parking en 1 clic grâce à des conducteurs qui partagent leur place en temps réel 🅿️",
        url: link,
      });
    } else {
      handleCopy();
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[900]" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[910] bg-white rounded-t-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Inviter un ami 🎉</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          Partage SwiftPark à tes amis — vous recevez chacun <span className="font-semibold text-[#22956b]">+5 SC</span> dès leur inscription !
        </p>
        {referralCode && (
          <div className="flex items-center justify-between bg-[#e8f5ef] rounded-2xl px-4 py-3 mb-3">
            <div>
              <p className="text-[10px] font-bold text-[#22956b] uppercase tracking-widest mb-0.5">Ton code perso</p>
              <p className="text-lg font-black tracking-widest text-[#085041]">{referralCode}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#22956b]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        )}

        {/* Lien */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 mb-4 border border-gray-100">
          <span className="flex-1 text-xs text-gray-500 truncate">{link}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-bold text-[#22956b] shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>

        {/* Bouton partager natif */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#22956b]/30"
        >
          📲 Partager via mes apps
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          WhatsApp, SMS, Instagram…
        </p>
      </div>
    </>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const [showInvite, setShowInvite] = useState(false);
  const profile = useMapStore((s) => s.profile);
  const referralCode = (profile as Record<string, unknown>)?.referral_code as string | undefined;

  return (
    <>
      {showInvite && <InviteSheet onClose={() => setShowInvite(false)} referralCode={referralCode} />}

      <nav className="fixed bottom-0 left-0 right-0 z-[850] safe-bottom">
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100/80 shadow-[0_-8px_32px_rgba(0,0,0,.08)]">
          <div className="flex items-center h-16 px-2">
            {NAV.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "#invite" && item.href !== "/map" && pathname.startsWith(item.href)) ||
                (item.href === "/map" && pathname === "/map");
              const Icon = item.icon;

              if (item.primary) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setShowInvite(true)}
                    className="flex-1 flex flex-col items-center justify-center -translate-y-3"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#22956b] to-[#085041] rounded-[18px] flex items-center justify-center shadow-xl shadow-[#22956b]/40 transition active:scale-90">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-[#22956b] mt-1">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-1 transition"
                >
                  <div className={cn(
                    "w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200",
                    isActive ? "bg-[#e8f5ef]" : "bg-transparent"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-[#22956b]" : "text-gray-400"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold transition-colors",
                    isActive ? "text-[#22956b]" : "text-gray-400"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
