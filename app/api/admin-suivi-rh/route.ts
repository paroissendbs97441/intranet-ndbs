// app/api/admin-suivi-rh/route.ts — suivi RH des salariés (soldes + historique)
import { NextResponse } from "next/server";
import { getSupabaseAdmin, verifierRoles } from "../../../lib/supabaseAdmin";

const ROLES_OK = ["admin", "comptable"];

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    const body = await req.json();
    const { access_token, action, annee } = body;

    const auth = await verifierRoles(access_token, ROLES_OK);
    if (!auth) return NextResponse.json({ ok: false, error: "Accès réservé (admin ou comptable CPAE)." }, { status: 403 });

    if (action === "annees") {
      const { data: s } = await sb.from("soldes").select("annee");
      const anneesSoldes = (s ?? []).map((x: any) => x.annee);
      const { data: d } = await sb.from("demandes").select("date_debut");
      const anneesDem = (d ?? []).map((x: any) => Number(String(x.date_debut).slice(0, 4)));
      const set = new Set<number>([new Date().getFullYear(), ...anneesSoldes, ...anneesDem].filter(Boolean));
      const annees = Array.from(set).sort((a, b) => b - a);
      return NextResponse.json({ ok: true, annees });
    }

    if (action === "suivi") {
      const an = Number(annee) || new Date().getFullYear();

      const { data: types } = await sb.from("types_conges").select("*").order("id");
      const typeLib: Record<number, string> = {};
      (types ?? []).forEach((t: any) => { typeLib[t.id] = t.libelle; });

      const { data: salaries } = await sb.from("profiles").select("id, nom_complet, poste, roles");
      const listeSal = (salaries ?? []).filter((p: any) => (p.roles ?? []).includes("salarie"));

      const { data: soldes } = await sb.from("soldes").select("*").eq("annee", an);

      const { data: demandes } = await sb.from("demandes")
        .select("id, salarie_id, type_conge_id, date_debut, date_fin, nb_jours, statut, motif, cree_le, moment_debut, moment_fin")
        .in("statut", ["validee", "en_attente"]);
      const demAnnee = (demandes ?? []).filter((d: any) => String(d.date_debut).slice(0, 4) === String(an));

      const resultat = listeSal.map((sal: any) => {
        const sesSoldes = (soldes ?? []).filter((s: any) => s.salarie_id === sal.id);
        const sesDemandes = demAnnee.filter((d: any) => d.salarie_id === sal.id);

        const typeIds = new Set<number>([
          ...sesSoldes.map((s: any) => s.type_conge_id),
          ...sesDemandes.map((d: any) => d.type_conge_id),
        ]);

        const lignes = Array.from(typeIds).map((tid) => {
          const solde = sesSoldes.find((s: any) => s.type_conge_id === tid);
          const acquis = Number(solde?.jours_acquis ?? 0);
          const pris = sesDemandes.filter((d: any) => d.type_conge_id === tid && d.statut === "validee")
            .reduce((sum: number, d: any) => sum + Number(d.nb_jours), 0);
          const enAttente = sesDemandes.filter((d: any) => d.type_conge_id === tid && d.statut === "en_attente")
            .reduce((sum: number, d: any) => sum + Number(d.nb_jours), 0);
          return {
            type_conge_id: tid,
            type_libelle: typeLib[tid] ?? `Type ${tid}`,
            acquis, pris, enAttente,
            restant: Math.round((acquis - pris) * 100) / 100,
          };
        }).sort((a, b) => a.type_conge_id - b.type_conge_id);

        const historique = sesDemandes
          .map((d: any) => ({
            id: d.id,
            type_libelle: typeLib[d.type_conge_id] ?? `Type ${d.type_conge_id}`,
            date_debut: d.date_debut, date_fin: d.date_fin,
            nb_jours: Number(d.nb_jours), statut: d.statut,
            moment_debut: d.moment_debut, moment_fin: d.moment_fin, motif: d.motif,
          }))
          .sort((a, b) => (a.date_debut < b.date_debut ? 1 : -1));

        return {
          id: sal.id, nom_complet: sal.nom_complet, poste: sal.poste,
          lignes, historique,
        };
      }).sort((a, b) => a.nom_complet.localeCompare(b.nom_complet));

      return NextResponse.json({ ok: true, annee: an, salaries: resultat });
    }

    return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
