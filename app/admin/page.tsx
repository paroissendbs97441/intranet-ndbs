// app/admin/page.tsx — Panneau d'administration (réservé au rôle admin)
"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

const ROLE_FALLBACK = [
  { code: "admin", libelle: "Administrateur" }, { code: "benevole", libelle: "Bénévole" },
  { code: "comptable", libelle: "Comptable CPAE" }, { code: "cure", libelle: "Curé" },
  { code: "diacre", libelle: "Diacre" }, { code: "invite", libelle: "Invité" },
  { code: "cpae", libelle: "Membre CPAE" }, { code: "salarie", libelle: "Salarié" },
  { code: "secretaire", libelle: "Secrétaire" }, { code: "vicaire", libelle: "Vicaire" },
];

export default function Admin() {
  const [token, setToken] = useState("");
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [onglet, setOnglet] = useState<"personnes" | "roles" | "conges" | "salles" | "emails" | "tuiles">("personnes");
  const [msg, setMsg] = useState("");

  const [personnes, setPersonnes] = useState<any[]>([]);
  const [rolesRef, setRolesRef] = useState<any[]>([]);
  const [feries, setFeries] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [nouvSalle, setNouvSalle] = useState({ lieu: "", nom: "", ordre: "" });
  const [editSalle, setEditSalle] = useState<any>(null);
  const [approbateurs, setApprobateurs] = useState<any[]>([]);
  const [membresCpae, setMembresCpae] = useState<any[]>([]);
  const [nouvAppro, setNouvAppro] = useState({ nom: "", email: "" });
  const [nouvCpae, setNouvCpae] = useState({ nom: "", email: "" });

  const [nouv, setNouv] = useState({ nom_complet: "", email: "", poste: "", roles: [] as string[] });
  const [editP, setEditP] = useState<any>(null);

  const [nouvRole, setNouvRole] = useState({ code: "", libelle: "" });
  const [nouvFerie, setNouvFerie] = useState({ date_ferie: "", libelle: "" });
  const [nouvType, setNouvType] = useState({ code: "", libelle: "" });
  const [soldeForm, setSoldeForm] = useState({ salarie_id: "", type_conge_id: "", jours_acquis: "", annee: String(new Date().getFullYear()) });

  useEffect(() => {
    async function init() {
      if (typeof window !== "undefined" && window.location.hash.includes("sso_at")) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const at = params.get("sso_at"); const rt = params.get("sso_rt");
        if (at && rt) {
          await getSupabase().auth.setSession({ access_token: at, refresh_token: rt });
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      const { data } = await getSupabase().auth.getUser();
      if (!data.user) { window.location.href = "/login"; return; }
      const { data: sess } = await getSupabase().auth.getSession();
      const tk = sess.session?.access_token ?? "";
      setToken(tk);
      const { data: prof } = await getSupabase().from("profiles").select("roles").eq("id", data.user.id).single();
      const roles: string[] = prof?.roles ?? [];
      if (!roles.includes("admin")) { setAutorise(false); return; }
      setAutorise(true);
      chargerTout(tk);
    }
    init();
  }, []);

  async function appelP(payload: any) {
    const res = await fetch("/api/admin-personnes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: token }),
    });
    return res.json();
  }
  async function appelParam(payload: any) {
    const res = await fetch("/api/admin-parametres", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: token }),
    });
    return res.json();
  }

  async function chargerTout(tk: string) {
    const p = await fetch("/api/admin-personnes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lister", access_token: tk }) }).then(r => r.json());
    if (p.ok) setPersonnes(p.personnes);
    const r = await fetch("/api/admin-parametres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "roles_lister", access_token: tk }) }).then(r => r.json());
    if (r.ok) setRolesRef(r.roles.length ? r.roles : ROLE_FALLBACK);
    const f = await fetch("/api/admin-parametres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "feries_lister", access_token: tk }) }).then(r => r.json());
    if (f.ok) setFeries(f.feries);
    const t = await fetch("/api/admin-parametres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "types_lister", access_token: tk }) }).then(r => r.json());
    if (t.ok) setTypes(t.types);
    const sl = await fetch("/api/admin-parametres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "salles_lister", access_token: tk }) }).then(r => r.json());
    if (sl.ok) setSalles(sl.salles);
    const d = await fetch("/api/admin-parametres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "dest_lister", access_token: tk }) }).then(r => r.json());
    if (d.ok) { setApprobateurs(d.approbateurs); setMembresCpae(d.cpae); }
  }

  function libelleRole(code: string) {
    return rolesRef.find((r) => r.code === code)?.libelle ?? code;
  }

  async function creerPersonne() {
    setMsg("");
    if (!nouv.nom_complet.trim() || !nouv.email.trim()) { setMsg("Nom et email obligatoires."); return; }
    const j = await appelP({ action: "creer", ...nouv });
    if (j.ok) { setMsg("Personne créée — un mail d'invitation a été envoyé ✅"); setNouv({ nom_complet: "", email: "", poste: "", roles: [] }); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }
  async function enregistrerEditP() {
    setMsg("");
    const j = await appelP({ action: "modifier", id: editP.id, nom_complet: editP.nom_complet, poste: editP.poste, roles: editP.roles });
    if (j.ok) { setMsg("Profil modifié ✅"); setEditP(null); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }
  async function resetMdp(email: string) {
    setMsg("");
    const j = await appelP({ action: "reset_mdp", email });
    setMsg(j.ok ? "Mail de réinitialisation envoyé ✅" : "Erreur : " + j.error);
  }
  async function supprimerPersonne(id: string, nom: string) {
    if (!confirm(`Supprimer définitivement le compte de ${nom} ? Cette action est irréversible.`)) return;
    setMsg("");
    const j = await appelP({ action: "supprimer", id });
    if (j.ok) { setMsg("Compte supprimé ✅"); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }

  async function ajouterRole() {
    const j = await appelParam({ action: "role_ajouter", ...nouvRole });
    if (j.ok) { setNouvRole({ code: "", libelle: "" }); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }
  async function renommerRole(code: string, libelle: string) {
    const j = await appelParam({ action: "role_renommer", code, libelle });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }
  async function supprimerRole(code: string) {
    if (!confirm(`Supprimer le rôle "${code}" ?`)) return;
    const j = await appelParam({ action: "role_supprimer", code });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }

  async function ajouterFerie() {
    const j = await appelParam({ action: "ferie_ajouter", ...nouvFerie });
    if (j.ok) { setNouvFerie({ date_ferie: "", libelle: "" }); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }
  async function supprimerFerie(id: string) {
    const j = await appelParam({ action: "ferie_supprimer", id });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }
  async function ajouterType() {
    const j = await appelParam({ action: "type_ajouter", ...nouvType });
    if (j.ok) { setNouvType({ code: "", libelle: "" }); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }

  async function ajouterSalle() {
    const j = await appelParam({ action: "salle_ajouter", ...nouvSalle });
    if (j.ok) { setNouvSalle({ lieu: "", nom: "", ordre: "" }); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }
  async function enregistrerEditSalle() {
    const j = await appelParam({ action: "salle_modifier", id: editSalle.id, lieu: editSalle.lieu, nom: editSalle.nom, ordre: editSalle.ordre });
    if (j.ok) { setEditSalle(null); chargerTout(token); } else setMsg("Erreur : " + j.error);
  }
  async function basculerSalle(id: string, actif: boolean) {
    const j = await appelParam({ action: "salle_actif", id, actif });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }

  async function ajouterDest(table: "approbateurs" | "cpae", nom: string, email: string) {
    const j = await appelParam({ action: "dest_ajouter", table, nom, email });
    if (j.ok) { setNouvAppro({ nom: "", email: "" }); setNouvCpae({ nom: "", email: "" }); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }
  async function basculerDest(table: "approbateurs" | "cpae", id: string, actif: boolean) {
    const j = await appelParam({ action: "dest_actif", table, id, actif });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }
  async function supprimerDest(table: "approbateurs" | "cpae", id: string) {
    if (!confirm("Supprimer ce destinataire ?")) return;
    const j = await appelParam({ action: "dest_supprimer", table, id });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }

  async function enregistrerSolde() {
    setMsg("");
    const j = await appelParam({
      action: "solde_enregistrer",
      salarie_id: soldeForm.salarie_id,
      type_conge_id: Number(soldeForm.type_conge_id),
      jours_acquis: Number(soldeForm.jours_acquis),
      annee: Number(soldeForm.annee),
    });
    if (j.ok) { setMsg("Solde enregistré ✅"); }
    else setMsg("Erreur : " + j.error);
  }

  if (autorise === null) return <p style={{ padding: 40 }}>Chargement…</p>;
  if (autorise === false) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Accès refusé</h1>
      <p>Cette page est réservée aux administrateurs.</p>
      <a href="/" style={{ color: "#2563eb" }}>← Retour à l'intranet</a>
    </div>
  );

  const ongletStyle = (actif: boolean): React.CSSProperties => ({
    padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 15,
    background: actif ? "#2563eb" : "#e5e7eb", color: actif ? "#fff" : "#374151",
    borderRadius: 8, fontWeight: actif ? 600 : 400,
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, width: "100%", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{ fontSize: 22 }}>Administration</h1>
          <img src="/logo.png" alt="Logo paroisse" style={{ height: 70 }} />
        </div>
        <div style={{ textAlign: "right", margin: "8px 0" }}>
          <a href="/" style={{ color: "#2563eb", fontSize: 14, textDecoration: "none" }}>⌂ Retour à l'intranet</a>
        </div>

        <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
          <button style={ongletStyle(onglet === "personnes")} onClick={() => setOnglet("personnes")}>Personnes</button>
          <button style={ongletStyle(onglet === "roles")} onClick={() => setOnglet("roles")}>Rôles</button>
          <button style={ongletStyle(onglet === "conges")} onClick={() => setOnglet("conges")}>Congés</button>
          <button style={ongletStyle(onglet === "salles")} onClick={() => setOnglet("salles")}>Salles</button>
          <button style={ongletStyle(onglet === "emails")} onClick={() => setOnglet("emails")}>Emails</button>
          <button style={ongletStyle(onglet === "tuiles")} onClick={() => setOnglet("tuiles")}>Tuiles</button>
        </div>

        {msg && <div style={{ background: "#eff6ff", color: "#1e40af", padding: 10, borderRadius: 6, margin: "8px 0" }}>{msg}</div>}

        {onglet === "personnes" && (
          <>
            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Créer une personne</h2>
              <p style={{ color: "#666", fontSize: 13 }}>Un mail d'invitation sera envoyé pour définir le mot de passe.</p>
              <input style={inp} placeholder="Nom et prénom" value={nouv.nom_complet} onChange={(e) => setNouv({ ...nouv, nom_complet: e.target.value })} />
              <input style={inp} placeholder="Email" value={nouv.email} onChange={(e) => setNouv({ ...nouv, email: e.target.value })} />
              <input style={inp} placeholder="Poste (si salarié)" value={nouv.poste} onChange={(e) => setNouv({ ...nouv, poste: e.target.value })} />
              <label style={lbl}>Rôles</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "4px 0 10px" }}>
                {rolesRef.map((r) => (
                  <label key={r.code} style={chip(nouv.roles.includes(r.code))}>
                    <input type="checkbox" style={{ marginRight: 4 }} checked={nouv.roles.includes(r.code)}
                      onChange={(e) => {
                        if (e.target.checked) setNouv({ ...nouv, roles: [...nouv.roles, r.code] });
                        else setNouv({ ...nouv, roles: nouv.roles.filter((x) => x !== r.code) });
                      }} />
                    {r.libelle}
                  </label>
                ))}
              </div>
              <button style={btn} onClick={creerPersonne}>Créer et inviter</button>
            </div>

            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Personnes ({personnes.length})</h2>
              {personnes.map((p) => (
                <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  {editP?.id === p.id ? (
                    <div>
                      <input style={inp} value={editP.nom_complet} onChange={(e) => setEditP({ ...editP, nom_complet: e.target.value })} />
                      <input style={inp} placeholder="Poste" value={editP.poste ?? ""} onChange={(e) => setEditP({ ...editP, poste: e.target.value })} />
                      <label style={lbl}>Rôles</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "4px 0 10px" }}>
                        {rolesRef.map((r) => (
                          <label key={r.code} style={chip(editP.roles?.includes(r.code))}>
                            <input type="checkbox" style={{ marginRight: 4 }} checked={editP.roles?.includes(r.code) ?? false}
                              onChange={(e) => {
                                const cur = editP.roles ?? [];
                                if (e.target.checked) setEditP({ ...editP, roles: [...cur, r.code] });
                                else setEditP({ ...editP, roles: cur.filter((x: string) => x !== r.code) });
                              }} />
                            {r.libelle}
                          </label>
                        ))}
                      </div>
                      <button style={btn} onClick={enregistrerEditP}>Enregistrer</button>
                      <button style={{ ...lien, marginLeft: 10 }} onClick={() => setEditP(null)}>Annuler</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <b>{p.nom_complet}</b> <span style={{ color: "#888", fontSize: 13 }}>· {p.email}</span><br />
                        <span style={{ fontSize: 13, color: "#555" }}>
                          {(p.roles ?? []).map(libelleRole).join(", ") || "aucun rôle"}
                          {p.roles?.includes("salarie") && p.poste ? ` — ${p.poste}` : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
                        <button style={btnMini} onClick={() => setEditP({ id: p.id, nom_complet: p.nom_complet, poste: p.poste, roles: p.roles ?? [] })}>Modifier</button>
                        <button style={btnMini} onClick={() => resetMdp(p.email)}>Réinit. mot de passe</button>
                        <button style={{ ...btnMini, background: "#b91c1c" }} onClick={() => supprimerPersonne(p.id, p.nom_complet)}>Supprimer</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {onglet === "roles" && (
          <div style={carte}>
            <h2 style={{ fontSize: 17 }}>Rôles</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="code (ex. tresorier)" value={nouvRole.code} onChange={(e) => setNouvRole({ ...nouvRole, code: e.target.value })} />
              <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Libellé (ex. Trésorier)" value={nouvRole.libelle} onChange={(e) => setNouvRole({ ...nouvRole, libelle: e.target.value })} />
              <button style={btn} onClick={ajouterRole}>Ajouter</button>
            </div>
            {rolesRef.map((r) => (
              <div key={r.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <input defaultValue={r.libelle} style={{ ...inp, width: 200, margin: 0, display: "inline-block" }}
                    onBlur={(e) => { if (e.target.value !== r.libelle) renommerRole(r.code, e.target.value); }} />
                  <span style={{ color: "#999", fontSize: 12, marginLeft: 8 }}>({r.code})</span>
                </div>
                <button style={{ ...btnMini, background: "#b91c1c" }} onClick={() => supprimerRole(r.code)}>Supprimer</button>
              </div>
            ))}
            <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>Astuce : modifiez un libellé puis cliquez ailleurs pour enregistrer.</p>
          </div>
        )}

        {onglet === "conges" && (
          <>
            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Jours fériés</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input style={{ ...inp, width: "auto", margin: 0 }} type="date" value={nouvFerie.date_ferie} onChange={(e) => setNouvFerie({ ...nouvFerie, date_ferie: e.target.value })} />
                <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Libellé (ex. Toussaint)" value={nouvFerie.libelle} onChange={(e) => setNouvFerie({ ...nouvFerie, libelle: e.target.value })} />
                <button style={btn} onClick={ajouterFerie}>Ajouter</button>
              </div>
              {feries.map((f) => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee", fontSize: 14 }}>
                  <span>{f.date_ferie} {f.libelle ? `— ${f.libelle}` : ""}</span>
                  <button style={{ ...lien, color: "#b91c1c" }} onClick={() => supprimerFerie(f.id)}>Supprimer</button>
                </div>
              ))}
            </div>

            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Types de congés</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="code (ex. cp)" value={nouvType.code} onChange={(e) => setNouvType({ ...nouvType, code: e.target.value })} />
                <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Libellé (ex. Congés payés)" value={nouvType.libelle} onChange={(e) => setNouvType({ ...nouvType, libelle: e.target.value })} />
                <button style={btn} onClick={ajouterType}>Ajouter</button>
              </div>
              {types.map((t) => (
                <div key={t.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee", fontSize: 14 }}>
                  <b>{t.libelle}</b> <span style={{ color: "#999", fontSize: 12 }}>({t.code})</span>
                </div>
              ))}
            </div>

            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Soldes (jours acquis)</h2>
              <p style={{ color: "#666", fontSize: 13 }}>Créer ou ajuster les jours acquis d'un salarié, par type et par année.</p>
              <label style={lbl}>Salarié</label>
              <select style={inp} value={soldeForm.salarie_id} onChange={(e) => setSoldeForm({ ...soldeForm, salarie_id: e.target.value })}>
                <option value="">— Choisir —</option>
                {personnes.filter((p) => p.roles?.includes("salarie")).map((p) => <option key={p.id} value={p.id}>{p.nom_complet}</option>)}
              </select>
              <label style={lbl}>Type de congé</label>
              <select style={inp} value={soldeForm.type_conge_id} onChange={(e) => setSoldeForm({ ...soldeForm, type_conge_id: e.target.value })}>
                <option value="">— Choisir —</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Jours acquis</label>
                  <input style={inp} type="number" step="0.5" value={soldeForm.jours_acquis} onChange={(e) => setSoldeForm({ ...soldeForm, jours_acquis: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Année</label>
                  <input style={inp} type="number" value={soldeForm.annee} onChange={(e) => setSoldeForm({ ...soldeForm, annee: e.target.value })} />
                </div>
              </div>
              <button style={btn} onClick={enregistrerSolde}>Enregistrer le solde</button>
            </div>
          </>
        )}

        {onglet === "salles" && (
          <>
            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Ajouter une salle</h2>
              <input style={inp} placeholder="Lieu (ex. Salle Paroissiale Quartier-Français)" value={nouvSalle.lieu} onChange={(e) => setNouvSalle({ ...nouvSalle, lieu: e.target.value })} />
              <input style={inp} placeholder="Nom (ex. Salle 6)" value={nouvSalle.nom} onChange={(e) => setNouvSalle({ ...nouvSalle, nom: e.target.value })} />
              <input style={inp} type="number" placeholder="Ordre d'affichage (ex. 9)" value={nouvSalle.ordre} onChange={(e) => setNouvSalle({ ...nouvSalle, ordre: e.target.value })} />
              <button style={btn} onClick={ajouterSalle}>Ajouter la salle</button>
            </div>

            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Salles ({salles.length})</h2>
              {salles.map((s) => (
                <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  {editSalle?.id === s.id ? (
                    <div>
                      <input style={inp} value={editSalle.lieu} onChange={(e) => setEditSalle({ ...editSalle, lieu: e.target.value })} />
                      <input style={inp} value={editSalle.nom} onChange={(e) => setEditSalle({ ...editSalle, nom: e.target.value })} />
                      <input style={inp} type="number" value={editSalle.ordre} onChange={(e) => setEditSalle({ ...editSalle, ordre: e.target.value })} />
                      <button style={btn} onClick={enregistrerEditSalle}>Enregistrer</button>
                      <button style={{ ...lien, marginLeft: 10 }} onClick={() => setEditSalle(null)}>Annuler</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ opacity: s.actif ? 1 : 0.5 }}>
                        <b>{s.nom}</b> {!s.actif && <span style={{ color: "#b91c1c", fontSize: 12 }}>(désactivée)</span>}<br />
                        <span style={{ fontSize: 13, color: "#555" }}>{s.lieu} · ordre {s.ordre}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
                        <button style={btnMini} onClick={() => setEditSalle({ id: s.id, lieu: s.lieu, nom: s.nom, ordre: s.ordre })}>Modifier</button>
                        <button style={{ ...btnMini, background: s.actif ? "#b45309" : "#15803d" }} onClick={() => basculerSalle(s.id, !s.actif)}>
                          {s.actif ? "Désactiver" : "Réactiver"}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {onglet === "emails" && (
          <>
            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Approbateurs des congés</h2>
              <p style={{ color: "#666", fontSize: 13 }}>Reçoivent les demandes de congés avec le lien de validation/refus.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Nom" value={nouvAppro.nom} onChange={(e) => setNouvAppro({ ...nouvAppro, nom: e.target.value })} />
                <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Email" value={nouvAppro.email} onChange={(e) => setNouvAppro({ ...nouvAppro, email: e.target.value })} />
                <button style={btn} onClick={() => ajouterDest("approbateurs", nouvAppro.nom, nouvAppro.email)}>Ajouter</button>
              </div>
              {approbateurs.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ opacity: a.actif ? 1 : 0.5 }}>
                    <b>{a.nom}</b> <span style={{ color: "#888", fontSize: 13 }}>· {a.email}</span>
                    {!a.actif && <span style={{ color: "#b91c1c", fontSize: 12 }}> (inactif)</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...btnMini, background: a.actif ? "#b45309" : "#15803d" }} onClick={() => basculerDest("approbateurs", a.id, !a.actif)}>{a.actif ? "Désactiver" : "Activer"}</button>
                    <button style={{ ...btnMini, background: "#b91c1c" }} onClick={() => supprimerDest("approbateurs", a.id)}>Suppr.</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={carte}>
              <h2 style={{ fontSize: 17 }}>Membres CPAE (en copie)</h2>
              <p style={{ color: "#666", fontSize: 13 }}>Reçoivent les demandes de congés en copie (information, sans action).</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Nom" value={nouvCpae.nom} onChange={(e) => setNouvCpae({ ...nouvCpae, nom: e.target.value })} />
                <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Email" value={nouvCpae.email} onChange={(e) => setNouvCpae({ ...nouvCpae, email: e.target.value })} />
                <button style={btn} onClick={() => ajouterDest("cpae", nouvCpae.nom, nouvCpae.email)}>Ajouter</button>
              </div>
              {membresCpae.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ opacity: a.actif ? 1 : 0.5 }}>
                    <b>{a.nom}</b> <span style={{ color: "#888", fontSize: 13 }}>· {a.email}</span>
                    {!a.actif && <span style={{ color: "#b91c1c", fontSize: 12 }}> (inactif)</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...btnMini, background: a.actif ? "#b45309" : "#15803d" }} onClick={() => basculerDest("cpae", a.id, !a.actif)}>{a.actif ? "Désactiver" : "Activer"}</button>
                    <button style={{ ...btnMini, background: "#b91c1c" }} onClick={() => supprimerDest("cpae", a.id)}>Suppr.</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <footer style={pied}>Alexandre FAMARE © 2026</footer>
    </div>
  );
}

const carte: React.CSSProperties = { background: "#fff", padding: 20, borderRadius: 12, margin: "12px 0", boxShadow: "0 1px 4px rgba(0,0,0,.08)" };
const inp: React.CSSProperties = { display: "block", width: "100%", padding: 9, margin: "4px 0 8px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: 13, color: "#555", fontWeight: 600 };
const btn: React.CSSProperties = { padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 };
const btnMini: React.CSSProperties = { padding: "6px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14 };
const pied: React.CSSProperties = { textAlign: "center", padding: 14, fontSize: 12, color: "#999" };
function chip(actif: boolean): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 16, fontSize: 13, cursor: "pointer",
    border: "1px solid " + (actif ? "#2563eb" : "#ccc"), background: actif ? "#eff6ff" : "#fff", color: actif ? "#1e40af" : "#374151" };
}
