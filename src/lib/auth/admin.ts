import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("user_id, business_id, role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return adminUser ? { user, adminUser } : null;
}
