import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MapClient from "./MapClient";

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return <MapClient />;
}
