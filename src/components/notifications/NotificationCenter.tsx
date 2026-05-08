"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const NOTIF_ICONS: Record<string, string> = {
  reservation_received:  "🚗",
  reservation_confirmed: "✅",
  reservation_cancelled: "❌",
  reservation_expired:   "⏰",
  payment_received:      "💰",
  spot_validated:        "📍",
};

export default function NotificationCenter() {
  const profile = useMapStore((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    }

    load();

    // Temps réel
    const channel = supabase
      .channel("notif-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  async function markAllRead() {
    if (!profile) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  return (
    <>
      {/* Bouton cloche */}
      <button
        onClick={() => { setOpen(true); if (unreadCount > 0) markAllRead(); }}
        className="relative p-3 bg-white rounded-2xl shadow-lg text-gray-600 active:scale-95 transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau latéral */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-12 pb-3 border-b border-gray-100">
              <h2 className="font-black text-gray-900">Notifications</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-brand-600 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tout lire
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto py-2">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotifRow
                    key={notif.id}
                    notif={notif}
                    onDelete={async () => {
                      const supabase = createClient();
                      await supabase.from("notifications").delete().eq("id", notif.id);
                      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                    }}
                    onClose={() => setOpen(false)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NotifRow({ notif, onDelete, onClose }: {
  notif: Notification;
  onDelete: () => void;
  onClose: () => void;
}) {
  const url = (notif as { url?: string }).url;

  function handleClick() {
    if (url) { onClose(); window.location.href = url; }
  }

  return (
    <div className={`px-4 py-3 border-b border-gray-50 ${!notif.is_read ? "bg-brand-50/50" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">
          {NOTIF_ICONS[notif.type] ?? "🔔"}
        </span>

        {/* Contenu cliquable */}
        <button
          onClick={handleClick}
          className={`flex-1 min-w-0 text-left ${url ? "cursor-pointer" : "cursor-default"}`}
        >
          <p className={`text-sm ${!notif.is_read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
            {notif.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
          <p className="text-[10px] text-gray-400 mt-1">
            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
          </p>
          {url && (
            <p className="text-[10px] text-brand-600 font-semibold mt-1">Voir →</p>
          )}
        </button>

        {/* Supprimer */}
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 hover:bg-red-100 transition mt-0.5"
        >
          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
