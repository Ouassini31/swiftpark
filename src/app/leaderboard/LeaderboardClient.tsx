"use client";

import { useState } from "react";
import { ArrowLeft, Star, Trophy, Medal } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeaderUser = any;

const PODIUM_STYLES = [
  { bg: "bg-swiftcoin-400", text: "text-white", size: "text-xl", icon: "🥇", order: "order-2 scale-110" },
  { bg: "bg-gray-200",      text: "text-gray-700", size: "text-lg", icon: "🥈", order: "order-1" },
  { bg: "bg-orange-300",    text: "text-white", size: "text-lg", icon: "🥉", order: "order-3" },
];

export default function LeaderboardClient({
  sharers, finders, currentUserId, currentProfile,
}: {
  sharers: LeaderUser[];
  finders: LeaderUser[];
  currentUserId: string;
  currentProfile: LeaderUser;
}) {
  const [tab, setTab] = useState<"sharers" | "finders">("sharers");

  const list   = tab === "sharers" ? sharers : finders;
  const top3   = list.slice(0, 3);
  const rest   = list.slice(3);

  const myRank = list.findIndex((u: LeaderUser) => u.id === currentUserId) + 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-6 px-5">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/map" className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-white font-black text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              Leaderboard
            </h1>
            <p className="text-white/60 text-xs">Top conducteurs SwiftPark</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/10 rounded-xl p-1">
          {(["sharers", "finders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                tab === t ? "bg-white text-gray-900" : "text-white/60 hover:text-white"
              }`}
            >
              {t === "sharers" ? "🅿️ Partageurs" : "🔍 Finders"}
            </button>
          ))}
        </div>
      </div>

      {/* Ma position */}
      {myRank > 0 && currentProfile && (
        <div className="mx-4 -mt-3 mb-4 bg-[#22956b] rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg shadow-[#22956b]/30">
          <div className="flex items-center gap-2">
            <Medal className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">Ma position</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-black text-lg">#{myRank}</span>
            <span className="text-brand-200 text-xs">
              {tab === "sharers"
                ? `${currentProfile.coins_earned} SC gagnés`
                : `${currentProfile.spots_found} places trouvées`}
            </span>
          </div>
        </div>
      )}

      {/* Podium top 3 */}
      {top3.length >= 3 && (
        <div className="px-4 mb-6">
          <div className="flex items-end justify-center gap-3 pt-2">
            {[top3[1], top3[0], top3[2]].map((user, i) => {
              const style = PODIUM_STYLES[i];
              return (
                <div
                  key={user.id}
                  className={`flex flex-col items-center gap-1 ${style.order}`}
                >
                  <span className="text-2xl">{style.icon}</span>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center font-black text-gray-700 text-lg">
                    {(user.full_name ?? user.username)[0].toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-gray-700 max-w-[72px] truncate text-center">
                    {user.full_name ?? user.username}
                  </p>
                  <div className={`px-2 py-0.5 ${style.bg} ${style.text} rounded-full ${style.size} font-black text-xs`}>
                    {tab === "sharers"
                      ? `${user.coins_earned} SC`
                      : `${user.spots_found} 🔍`}
                  </div>
                  {user.rating && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-swiftcoin-400 text-swiftcoin-400" />
                      {Number(user.rating).toFixed(1)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste rang 4+ */}
      <div className="px-4 space-y-2">
        {rest.map((user: LeaderUser, i: number) => {
          const rank = i + 4;
          const isMe = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                isMe ? "bg-brand-50 border border-brand-200" : "bg-white"
              } shadow-sm`}
            >
              <span className="w-7 text-center text-sm font-black text-gray-400">
                #{rank}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                isMe ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {(user.full_name ?? user.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isMe ? "text-brand-700" : "text-gray-800"}`}>
                  {user.full_name ?? user.username}
                  {isMe && <span className="ml-1 text-xs text-brand-500">(vous)</span>}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {user.rating && (
                    <>
                      <Star className="w-3 h-3 fill-swiftcoin-400 text-swiftcoin-400" />
                      {Number(user.rating).toFixed(1)} ·{" "}
                    </>
                  )}
                  {tab === "sharers"
                    ? `${user.spots_shared} places partagées`
                    : `${user.spots_found} places trouvées`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-swiftcoin-600">
                  {tab === "sharers"
                    ? `${user.coins_earned} SC`
                    : `${user.spots_found} 🔍`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
