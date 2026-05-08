"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function InstallBanner() {
  const [show, setShow]       = useState(false);
  const [isIOS, setIsIOS]     = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Déjà installé → on ne montre rien
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Déjà refusé → on ne montre plus
    if (localStorage.getItem("install_dismissed")) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // iOS : on montre toujours le banner (pas d'event beforeinstallprompt)
      setTimeout(() => setShow(true), 3000);
    } else {
      // Android/Chrome : on attend l'event natif
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShow(true), 3000);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("install_dismissed", "1");
    setShow(false);
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[900] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className="w-12 h-12 bg-gradient-to-br from-[#22956b] to-[#085041] rounded-[14px] flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900">Installe SwiftPark 🚀</p>
          {isIOS ? (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Appuie sur <span className="font-bold">⎙ Partager</span> puis{" "}
              <span className="font-bold">"Sur l'écran d'accueil"</span> pour recevoir les notifications
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Installe l'app pour recevoir les notifications même quand tu n'es pas dessus
            </p>
          )}

          {!isIOS && (
            <button
              onClick={install}
              className="mt-2 px-4 py-1.5 bg-[#22956b] text-white text-xs font-bold rounded-xl"
            >
              Installer
            </button>
          )}
        </div>

        <button onClick={dismiss} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
