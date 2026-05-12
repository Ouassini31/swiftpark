"use client";

import { useState } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export default function CancelSpotButton({ spotId }: { spotId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Annuler ce signalement ?")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("parking_spots")
      .update({ status: "cancelled" })
      .eq("id", spotId);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Signalement annulé");
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      Annuler
    </button>
  );
}
