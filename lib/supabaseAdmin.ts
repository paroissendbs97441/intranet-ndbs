// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!admin) {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return admin;
}

// Vérifie que l'appelant est connecté ET admin. Renvoie l'user si OK, sinon null.
export async function verifierAdmin(access_token?: string) {
  if (!access_token) return null;
  const sb = getSupabaseAdmin();
  const { data: u } = await sb.auth.getUser(access_token);
  if (!u?.user) return null;
  const { data: prof } = await sb.from("profiles").select("roles").eq("id", u.user.id).single();
  const roles: string[] = prof?.roles ?? [];
  if (!roles.includes("admin")) return null;
  return u.user;
}
