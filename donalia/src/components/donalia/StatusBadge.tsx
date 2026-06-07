import { STATUS_META } from "@/lib/donalia/constants";
import type { NeedStatus } from "@/lib/donalia/types";

export function StatusBadge({ status }: { status: NeedStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}
