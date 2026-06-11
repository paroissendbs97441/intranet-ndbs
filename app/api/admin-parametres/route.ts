// app/api/admin-parametres/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, verifierAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    const body = await req.json();
    const { access_token, action } = body;

    const admin = await verifierAdmin(access_token);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // ===== RÔLES (roles_ref) =====
    if (action === "roles_lister") {
      const { data } = await sb.from("roles_ref").select("*").order("ordre");
      return NextResponse.json({ ok: true, roles: data ?? [] });
    }
    if (action === "role_ajouter") {
      const { code, libelle } = body;
      if (!code?.trim() || !libelle?.trim()) return NextResponse.json({ ok: false, error: "Code et libellé obligatoires." }, { status: 400 });
      const { data: max } = await sb.from("roles_ref").select("ordre").order("ordre", { ascending: false }).limit(1).single();
      const ordre = (max?.ordre ?? 0) + 1;
      const { error } = await sb.from("roles_ref").insert({ code: code.trim().toLowerCase(), libelle: libelle.trim(), ordre });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "role_renommer") {
      const { code, libelle } = body;
      const { error } = await sb.from("roles_ref").update({ libelle: libelle.trim() }).eq("code", code);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "role_supprimer") {
      const { code } = body;
      const { data: users } = await sb.from("profiles").select("id").contains("roles", [code]).limit(1);
      if (users && users.length > 0) {
        return NextResponse.json({ ok: false, error: "Ce rôle est encore attribué à au moins une personne. Retirez-le d'abord." }, { status: 400 });
      }
      const { error } = await sb.from("roles_ref").delete().eq("code", code);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // ===== JOURS FÉRIÉS =====
    if (action === "feries_lister") {
      const { data } = await sb.from("jours_feries").select("*").order("date_ferie");
      return NextResponse.json({ ok: true, feries: data ?? [] });
    }
    if (action === "ferie_ajouter") {
      const { date_ferie, libelle } = body;
      if (!date_ferie) return NextResponse.json({ ok: false, error: "Date obligatoire." }, { status: 400 });
      const { error } = await sb.from("jours_feries").insert({ date_ferie, libelle: libelle?.trim() || null });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "ferie_supprimer") {
      const { id } = body;
      const { error } = await sb.from("jours_feries").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // ===== TYPES DE CONGÉS =====
    if (action === "types_lister") {
      const { data } = await sb.from("types_conges").select("*").order("id");
      return NextResponse.json({ ok: true, types: data ?? [] });
    }
    if (action === "type_ajouter") {
      const { code, libelle } = body;
      if (!code?.trim() || !libelle?.trim()) return NextResponse.json({ ok: false, error: "Code et libellé obligatoires." }, { status: 400 });
      const { error } = await sb.from("types_conges").insert({ code: code.trim(), libelle: libelle.trim() });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "type_modifier") {
      const { id, code, libelle } = body;
      const { error } = await sb.from("types_conges").update({ code: code.trim(), libelle: libelle.trim() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // ===== SALLES =====
    if (action === "salles_lister") {
      const { data } = await sb.from("salles_salles").select("*").order("ordre");
      return NextResponse.json({ ok: true, salles: data ?? [] });
    }
    if (action === "salle_ajouter") {
      const { lieu, nom, ordre } = body;
      if (!lieu?.trim() || !nom?.trim()) return NextResponse.json({ ok: false, error: "Lieu et nom obligatoires." }, { status: 400 });
      const { error } = await sb.from("salles_salles").insert({ lieu: lieu.trim(), nom: nom.trim(), ordre: Number(ordre) || 0, actif: true });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "salle_modifier") {
      const { id, lieu, nom, ordre } = body;
      const { error } = await sb.from("salles_salles").update({ lieu: lieu?.trim(), nom: nom?.trim(), ordre: Number(ordre) || 0 }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "salle_actif") {
      const { id, actif } = body;
      const { error } = await sb.from("salles_salles").update({ actif }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // ===== SOLDES =====
    if (action === "soldes_lister") {
      const { annee } = body;
      let q = sb.from("soldes").select("*, types_conges(libelle), profiles(nom_complet)");
      if (annee) q = q.eq("annee", annee);
      const { data } = await q;
      return NextResponse.json({ ok: true, soldes: data ?? [] });
    }
    if (action === "solde_enregistrer") {
      const { salarie_id, type_conge_id, jours_acquis, annee } = body;
      if (!salarie_id || !type_conge_id || annee == null) {
        return NextResponse.json({ ok: false, error: "Salarié, type et année obligatoires." }, { status: 400 });
      }
      const { data: exist } = await sb.from("soldes").select("id")
        .eq("salarie_id", salarie_id).eq("type_conge_id", type_conge_id).eq("annee", annee).limit(1);
      if (exist && exist.length > 0) {
        const { error } = await sb.from("soldes").update({ jours_acquis }).eq("id", exist[0].id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("soldes").insert({ salarie_id, type_conge_id, jours_acquis, annee });
        if (error) throw error;
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
