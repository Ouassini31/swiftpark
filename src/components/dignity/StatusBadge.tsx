import {
  DIGNITY_STATUS_LABELS,
  DIGNITY_STATUS_STYLES,
  type DignityStatus,
} from "@/lib/dignity/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: DignityStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        DIGNITY_STATUS_STYLES[status],
        className
      )}
    >
      {DIGNITY_STATUS_LABELS[status]}
    </span>
  );
}
