import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE() {
  // Vérifier que l'utilisateur est authentifié
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Utiliser le service role pour supprimer le compte
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Supprimer le profil (cascade supprimera les données liées)
  await admin.from("profiles").delete().eq("id", user.id);

  // Supprimer l'utilisateur auth
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[delete-account]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
