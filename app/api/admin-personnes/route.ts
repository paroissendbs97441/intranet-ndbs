// app/api/admin-personnes/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, verifierAdmin } from "../../../lib/supabaseAdmin";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    const body = await req.json();
    const { access_token, action } = body;

    const admin = await verifierAdmin(access_token);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // --- LISTER les personnes ---
    if (action === "lister") {
      const { data, error } = await sb
        .from("profiles")
        .select("id, nom_complet, email, poste, roles")
        .order("nom_complet");
      if (error) throw error;
      return NextResponse.json({ ok: true, personnes: data });
    }

    // --- CRÉER (inviter) une personne ---
    if (action === "creer") {
      const { nom_complet, email, poste, roles } = body;
      if (!nom_complet?.trim() || !email?.trim()) {
        return NextResponse.json({ ok: false, error: "Nom et email obligatoires." }, { status: 400 });
      }
      const { data: inv, error: errInv } = await sb.auth.admin.inviteUserByEmail(email.trim(), {
        redirectTo: `${BASE_URL}/nouveau-mot-de-passe`,
      });
      if (errInv) {
        return NextResponse.json({ ok: false, error: "Création impossible : " + errInv.message }, { status: 400 });
      }
      const newId = inv.user.id;
      const { error: errProf } = await sb.from("profiles").upsert({
        id: newId,
        nom_complet: nom_complet.trim(),
        email: email.trim(),
        poste: poste?.trim() || null,
        roles: Array.isArray(roles) ? roles : [],
      });
      if (errProf) throw errProf;
      return NextResponse.json({ ok: true });
    }

    // --- MODIFIER un profil (nom, poste, rôles) ---
    if (action === "modifier") {
      const { id, nom_complet, poste, roles } = body;
      if (!id) return NextResponse.json({ ok: false, error: "Identifiant manquant." }, { status: 400 });
      const { error } = await sb.from("profiles").update({
        nom_complet: nom_complet?.trim(),
        poste: poste?.trim() || null,
        roles: Array.isArray(roles) ? roles : [],
      }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // --- RÉINITIALISER le mot de passe (envoi d'un mail) ---
    if (action === "reset_mdp") {
      const { email } = body;
      if (!email?.trim()) return NextResponse.json({ ok: false, error: "Email manquant." }, { status: 400 });
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${BASE_URL}/nouveau-mot-de-passe`,
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // --- SUPPRIMER un compte ---
    if (action === "supprimer") {
      const { id } = body;
      if (!id) return NextResponse.json({ ok: false, error: "Identifiant manquant." }, { status: 400 });
      if (id === admin.id) {
        return NextResponse.json({ ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
      }
      await sb.from("profiles").delete().eq("id", id);
      const { error } = await sb.auth.admin.deleteUser(id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
