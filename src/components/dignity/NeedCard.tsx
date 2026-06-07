import Link from "next/link";
import { MapPin } from "lucide-react";
import type { DignityNeed } from "@/lib/dignity/types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";

type NeedCardData = Pick<
  DignityNeed,
  | "id"
  | "title"
  | "category"
  | "country"
  | "city"
  | "amount_requested"
  | "amount_collected"
  | "status"
  | "main_image_url"
>;

export function NeedCard({ need }: { need: NeedCardData }) {
  return (
    <Link
      href={`/dignity/needs/${need.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-blue-50 to-emerald-50">
        {need.main_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={need.main_image_url}
            alt={need.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-blue-900/30">
            <span className="text-4xl font-bold">D</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-blue-950 ring-1 ring-stone-200">
          {need.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-blue-950 group-hover:text-blue-800">
            {need.title}
          </h3>
          <StatusBadge status={need.status} />
        </div>

        <p className="flex items-center gap-1 text-sm text-stone-500">
          <MapPin className="h-3.5 w-3.5" />
          {need.city}, {need.country}
        </p>

        <div className="mt-auto">
          <ProgressBar
            collected={need.amount_collected}
            requested={need.amount_requested}
          />
        </div>

        <span className="mt-1 inline-flex items-center justify-center rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold text-blue-950 transition group-hover:bg-blue-900 group-hover:text-white">
          Voir le besoin
        </span>
      </div>
    </Link>
  );
}
