import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role, username, full_name")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as { role: string; username: string; full_name: string } | null;

  if (!profile || profile.role !== "admin") redirect("/map");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar username={profile.username} fullName={profile.full_name} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
