"use client";

import { useState, useEffect } from "react";
import { Bell, X, Loader2 } from "lucide-react";
import { requestPushPermission } from "@/hooks/usePushNotifications";

const STORAGE_KEY = "sp_notif_prompt_dismissed";
const SHOW_DELAY_MS = 20_000; // 20s après ouverture de la carte

export default function NotifPromptBanner({ userId }: { userId: string }) {
  const [visible, setVisible]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Pas de push dispo ou déjà répondu
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  async function handleEnable() {
    setLoading(true);
    const ok = await requestPushPermission(userId);
    setLoading(false);
    if (ok) {
      setAccepted(true);
      setTimeout(dismiss, 1800);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div className="absolute bottom-[88px] left-3 right-3 z-[800] animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 px-4 py-3.5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#22956b]/10 rounded-xl flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-[#22956b]" />
        </div>

        <div className="flex-1 min-w-0">
          {accepted ? (
            <p className="text-sm font-bold text-[#22956b]">✓ Notifications activées !</p>
          ) : (
            <>
              <p className="text-sm font-black text-gray-900 leading-tight">Sois alerté en temps réel</p>
              <p className="text-xs text-gray-500 mt-0.5">Reçois un push quand une place est dispo près de toi</p>
            </>
          )}
        </div>

        {!accepted && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-3 py-1.5 bg-[#22956b] text-white text-xs font-black rounded-xl transition active:scale-95 disabled:opacity-60 flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Activer 🔔"}
            </button>
            <button onClick={dismiss} className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
