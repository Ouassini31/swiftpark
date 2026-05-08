"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart2, Users, MapPin,
  ListOrdered, ArrowLeft, Shield, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin",              icon: LayoutDashboard, label: "Dashboard"    },
  { href: "/admin/analytics",    icon: BarChart2,       label: "Analytics"    },
  { href: "/admin/users",        icon: Users,           label: "Utilisateurs" },
  { href: "/admin/spots",        icon: MapPin,          label: "Places"       },
  { href: "/admin/reservations", icon: ListOrdered,     label: "Réservations" },
  { href: "/admin/withdrawals",  icon: Banknote,        label: "Retraits"     },
];

export default function AdminSidebar({
  username, fullName,
}: { username: string; fullName: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-brand-400" />
          <span className="font-black text-lg text-white">SwiftPark</span>
        </div>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + retour */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500">Connecté en tant que</p>
          <p className="text-sm font-semibold text-gray-200 truncate">{fullName ?? username}</p>
        </div>
        <Link
          href="/map"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'app
        </Link>
      </div>
    </aside>
  );
}
