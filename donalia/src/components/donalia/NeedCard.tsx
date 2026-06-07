import Link from "next/link";
import type { Need } from "@/lib/donalia/types";
import { CATEGORY_LABEL } from "@/lib/donalia/constants";
import { ProgressBar } from "./ProgressBar";
import { GapBadge, ObjectIcon } from "./signature";

export function NeedCard({ need, categoryKey }: { need: Need; categoryKey?: string }) {
  return (
    <Link href={`/besoin/${need.id}`} className="need">
      <div className="need__media">
        <ObjectIcon category={categoryKey} />
        {categoryKey ? (
          <span className="need__cat">
            <ObjectIcon category={categoryKey} />
            {CATEGORY_LABEL[categoryKey] ?? categoryKey}
          </span>
        ) : null}
      </div>
      <div className="need__body">
        <div className="mb-2.5">
          <GapBadge reason={need.gap_reason} />
        </div>
        <div className="need__title">{need.title}</div>
        <div className="mt-auto pt-2">
          <ProgressBar collectedCents={need.collected_cents} targetCents={need.amount_cents} />
        </div>
      </div>
    </Link>
  );
}
