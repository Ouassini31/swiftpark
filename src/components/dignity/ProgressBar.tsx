import { formatEUR } from "@/lib/dignity/format";

export function ProgressBar({
  collected,
  requested,
  showLabels = true,
}: {
  collected: number;
  requested: number;
  showLabels?: boolean;
}) {
  const pct =
    requested > 0
      ? Math.max(0, Math.min(100, Math.round((collected / requested) * 100)))
      : 0;

  return (
    <div className="space-y-1.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-700">
            {formatEUR(collected)} collectés
          </span>
          <span className="text-stone-500">sur {formatEUR(requested)}</span>
        </div>
      )}
    </div>
  );
}
