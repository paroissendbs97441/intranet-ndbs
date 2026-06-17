// app/admin/page.tsx — Panneau d'administration (réservé au rôle admin) — fenêtre macOS Liquid Glass
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
  const [horloge, setHorloge] = useState("");
  const [zoom, setZoom] = useState(false);

  // Données
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
  const [tuilesAdmin, setTuilesAdmin] = useState<any[]>([]);
  const [nouvTuile, setNouvTuile] = useState({ cle: "", titre: "", description: "", url: "", icone: "", interne: false, ordre: "", roles_autorises: [] as string[], categorie: "" });
  const [editTuile, setEditTuile] = useState<any>(null);

  // Formulaires personnes
  const [nouv, setNouv] = useState({ nom_complet: "", email: "", poste: "", roles: [] as string[] });
  const [editP, setEditP] = useState<any>(null);

  // Formulaires rôles / fériés / types / soldes
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

  useEffect(() => {
    const maj = () => {
      const d = new Date();
      const jours = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
      const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
      setHorloge(`${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}  ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    };
    maj();
    const id = setInterval(maj, 10000);
    return () => clearInterval(id);
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
    const tu = await fetch("/api/admin-parametres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "tuiles_lister", access_token: tk }) }).then(r => r.json());
    if (tu.ok) setTuilesAdmin(tu.tuiles);
  }

  function libelleRole(code: string) {
    return rolesRef.find((r) => r.code === code)?.libelle ?? code;
  }

  function fermer() { window.location.href = "/"; }

  // ===== Actions Personnes =====
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

  // ===== Actions Rôles =====
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

  // ===== Actions Fériés / Types / Soldes =====
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

  async function ajouterTuile() {
    if (!nouvTuile.cle.trim() || !nouvTuile.titre.trim() || !nouvTuile.url.trim()) { setMsg("Clé, titre et URL obligatoires."); return; }
    const j = await appelParam({ action: "tuile_ajouter", ...nouvTuile });
    if (j.ok) { setNouvTuile({ cle: "", titre: "", description: "", url: "", icone: "", interne: false, ordre: "", roles_autorises: [], categorie: "" }); chargerTout(token); }
    else setMsg("Erreur : " + j.error);
  }
  async function enregistrerEditTuile() {
    const j = await appelParam({ action: "tuile_modifier", id: editTuile.id, titre: editTuile.titre, description: editTuile.description, url: editTuile.url, icone: editTuile.icone, interne: editTuile.interne, ordre: editTuile.ordre, roles_autorises: editTuile.roles_autorises, categorie: editTuile.categorie });
    if (j.ok) { setEditTuile(null); chargerTout(token); } else setMsg("Erreur : " + j.error);
  }
  async function basculerTuile(id: string, actif: boolean) {
    const j = await appelParam({ action: "tuile_actif", id, actif });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }
  async function supprimerTuile(id: string) {
    if (!confirm("Supprimer cette tuile ?")) return;
    const j = await appelParam({ action: "tuile_supprimer", id });
    if (j.ok) chargerTout(token); else setMsg("Erreur : " + j.error);
  }

  async function definirModeConges(salarie_id: string, mode: string) {
    setMsg("");
    if (!confirm(`Changer le mode de décompte ? Les soldes de ce salarié seront convertis automatiquement (${mode === "ouvrables" ? "×6/5" : "×5/6"}).`)) return;
    const j = await appelParam({ action: "mode_conges_definir", salarie_id, mode });
    if (j.ok) {
      if (j.inchange) setMsg("Mode déjà défini, aucun changement.");
      else setMsg(`Mode mis à jour ✅ (${j.converties} ligne(s) de solde converties)`);
      chargerTout(token);
    } else setMsg("Erreur : " + j.error);
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

  // —— États habillés ——
  if (autorise === null) return (
    <div style={pageWrap}><div style={wall} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingTop: 100, color: "#3a3a40", fontSize: 15 }}>Chargement…</div>
    </div>
  );
  if (autorise === false) return (
    <div style={pageWrap}><div style={wall} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 440, margin: "0 auto", padding: "100px 24px" }}>
        <div style={fenetre}>
          <div style={titleBar}><span style={feux}><i style={{ ...feu, background: "#ff5f57" }} /><i style={{ ...feu, background: "#febc2e" }} /><i style={{ ...feu, background: "#28c840" }} /></span></div>
          <div style={{ padding: "30px 28px 34px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
            <h1 style={{ fontSize: 20, margin: "0 0 6px", fontWeight: 700, color: "#1d1d1f" }}>Accès refusé</h1>
            <p style={{ color: "#555", fontSize: 14, margin: "0 0 18px" }}>Cette page est réservée aux administrateurs.</p>
            <a href="/" style={pilule}>← Retour à l'intranet</a>
          </div>
        </div>
      </div>
    </div>
  );

  const ongletStyle = (actif: boolean): React.CSSProperties => ({
    flex: "1 1 auto", padding: "8px 14px", border: "none", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit",
    background: actif ? "rgba(255,255,255,.92)" : "transparent",
    color: actif ? "#1d1d1f" : "#5a5a62", borderRadius: 8, fontWeight: actif ? 600 : 500,
    boxShadow: actif ? "0 1px 4px rgba(50,55,65,.16)" : "none", transition: "background .15s",
  });

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={pageWrap}>
        <div style={wall} />

        {/* Barre de menu système */}
        <div style={menubar}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <img src="/logo.png" alt="" style={{ height: 17, width: 17, objectFit: "contain" }} /> Administration
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <a href="/" style={menuLien}>⌂ Intranet</a>
            <span style={{ opacity: 0.9 }}>{horloge}</span>
          </span>
        </div>

        {/* Fenêtre d'application macOS */}
        <div style={{ ...fenetreWrap, maxWidth: zoom ? "100%" : 920, padding: zoom ? "12px 12px 50px" : "30px 20px 50px", transition: "max-width .3s ease, padding .3s ease" }}>
          <div style={fenetre}>
            {/* Title bar */}
            <div style={titleBar}>
              <span style={feux}>
                <i title="Fermer" onClick={fermer} style={{ ...feu, background: "#ff5f57", cursor: "pointer" }} />
                <i title="Retour à l'accueil" onClick={fermer} style={{ ...feu, background: "#febc2e", cursor: "pointer" }} />
                <i title="Plein écran" onClick={() => setZoom(!zoom)} style={{ ...feu, background: "#28c840", cursor: "pointer" }} />
              </span>
              <span style={titreFenetre}>Administration</span>
              <img src="/logo.png" alt="" style={{ marginLeft: "auto", height: 26, objectFit: "contain" }} />
            </div>

            {/* Contenu */}
            <div style={corps}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1d1d1f", letterSpacing: "-.4px" }}>Administration</h1>

              {/* Segmented control */}
              <div style={segmented}>
                <button style={ongletStyle(onglet === "personnes")} onClick={() => setOnglet("personnes")}>Personnes</button>
                <button style={ongletStyle(onglet === "roles")} onClick={() => setOnglet("roles")}>Rôles</button>
                <button style={ongletStyle(onglet === "conges")} onClick={() => setOnglet("conges")}>Congés</button>
                <button style={ongletStyle(onglet === "salles")} onClick={() => setOnglet("salles")}>Salles</button>
                <button style={ongletStyle(onglet === "emails")} onClick={() => setOnglet("emails")}>Emails</button>
                <button style={ongletStyle(onglet === "tuiles")} onClick={() => setOnglet("tuiles")}>Tuiles</button>
              </div>

              {msg && <div style={infoMsg}>{msg}</div>}

              {onglet === "personnes" && (
                <>
                  <div style={carte}>
                    <h2 style={h2}>Créer une personne</h2>
                    <p style={{ color: "#8a8a92", fontSize: 13 }}>Un mail d'invitation sera envoyé pour définir le mot de passe.</p>
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
                    <h2 style={h2}>Personnes ({personnes.length})</h2>
                    {personnes.map((p) => (
                      <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(60,60,67,.08)" }}>
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
                              <b style={{ color: "#1d1d1f" }}>{p.nom_complet}</b> <span style={{ color: "#8a8a92", fontSize: 13 }}>· {p.email}</span><br />
                              <span style={{ fontSize: 13, color: "#5a5a62" }}>
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
                  <h2 style={h2}>Rôles</h2>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="code (ex. tresorier)" value={nouvRole.code} onChange={(e) => setNouvRole({ ...nouvRole, code: e.target.value })} />
                    <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Libellé (ex. Trésorier)" value={nouvRole.libelle} onChange={(e) => setNouvRole({ ...nouvRole, libelle: e.target.value })} />
                    <button style={btn} onClick={ajouterRole}>Ajouter</button>
                  </div>
                  {rolesRef.map((r) => (
                    <div key={r.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(60,60,67,.08)" }}>
                      <div>
                        <input defaultValue={r.libelle} style={{ ...inp, width: 200, margin: 0, display: "inline-block" }}
                          onBlur={(e) => { if (e.target.value !== r.libelle) renommerRole(r.code, e.target.value); }} />
                        <span style={{ color: "#8a8a92", fontSize: 12, marginLeft: 8 }}>({r.code})</span>
                      </div>
                      <button style={{ ...btnMini, background: "#b91c1c" }} onClick={() => supprimerRole(r.code)}>Supprimer</button>
                    </div>
                  ))}
                  <p style={{ color: "#8a8a92", fontSize: 12, marginTop: 8 }}>Astuce : modifiez un libellé puis cliquez ailleurs pour enregistrer.</p>
                </div>
              )}

              {onglet === "conges" && (
                <>
                  <div style={carte}>
                    <h2 style={h2}>Jours fériés</h2>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <input style={{ ...inp, width: "auto", margin: 0 }} type="date" value={nouvFerie.date_ferie} onChange={(e) => setNouvFerie({ ...nouvFerie, date_ferie: e.target.value })} />
                      <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Libellé (ex. Toussaint)" value={nouvFerie.libelle} onChange={(e) => setNouvFerie({ ...nouvFerie, libelle: e.target.value })} />
                      <button style={btn} onClick={ajouterFerie}>Ajouter</button>
                    </div>
                    {feries.map((f) => (
                      <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(60,60,67,.08)", fontSize: 14 }}>
                        <span>{f.date_ferie} {f.libelle ? `— ${f.libelle}` : ""}</span>
                        <button style={{ ...lien, color: "#b91c1c" }} onClick={() => supprimerFerie(f.id)}>Supprimer</button>
                      </div>
                    ))}
                  </div>

                  <div style={carte}>
                    <h2 style={h2}>Types de congés</h2>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="code (ex. cp)" value={nouvType.code} onChange={(e) => setNouvType({ ...nouvType, code: e.target.value })} />
                      <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Libellé (ex. Congés payés)" value={nouvType.libelle} onChange={(e) => setNouvType({ ...nouvType, libelle: e.target.value })} />
                      <button style={btn} onClick={ajouterType}>Ajouter</button>
                    </div>
                    {types.map((t) => (
                      <div key={t.id} style={{ padding: "6px 0", borderBottom: "1px solid rgba(60,60,67,.08)", fontSize: 14 }}>
                        <b style={{ color: "#1d1d1f" }}>{t.libelle}</b> <span style={{ color: "#8a8a92", fontSize: 12 }}>({t.code})</span>
                      </div>
                    ))}
                  </div>

                  <div style={carte}>
                    <h2 style={h2}>Soldes (jours acquis)</h2>
                    <p style={{ color: "#8a8a92", fontSize: 13 }}>Créer ou ajuster les jours acquis d'un salarié, par type et par année.</p>
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

                  <div style={carte}>
                    <h2 style={h2}>Mode de décompte des congés</h2>
                    <p style={{ color: "#8a8a92", fontSize: 13 }}>
                      Ouvrés = lundi à vendredi. Ouvrables = lundi à samedi. Changer le mode convertit
                      automatiquement les soldes du salarié (arrondi au demi-jour).
                    </p>
                    {personnes.filter((p) => p.roles?.includes("salarie")).map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(60,60,67,.08)" }}>
                        <div>
                          <b style={{ color: "#1d1d1f" }}>{p.nom_complet}</b><br />
                          <span style={{ fontSize: 13, color: "#5a5a62" }}>
                            Mode actuel : {p.mode_conges === "ouvrables" ? "Ouvrables (lun-sam)" : "Ouvrés (lun-ven)"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={{ ...btnMini, background: p.mode_conges !== "ouvrables" ? "#2563eb" : "rgba(120,120,128,.4)", color: "#fff" }}
                            onClick={() => definirModeConges(p.id, "ouvres")}>Ouvrés</button>
                          <button style={{ ...btnMini, background: p.mode_conges === "ouvrables" ? "#2563eb" : "rgba(120,120,128,.4)", color: "#fff" }}
                            onClick={() => definirModeConges(p.id, "ouvrables")}>Ouvrables</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {onglet === "salles" && (
                <>
                  <div style={carte}>
                    <h2 style={h2}>Ajouter une salle</h2>
                    <input style={inp} placeholder="Lieu (ex. Salle Paroissiale Quartier-Français)" value={nouvSalle.lieu} onChange={(e) => setNouvSalle({ ...nouvSalle, lieu: e.target.value })} />
                    <input style={inp} placeholder="Nom (ex. Salle 6)" value={nouvSalle.nom} onChange={(e) => setNouvSalle({ ...nouvSalle, nom: e.target.value })} />
                    <input style={inp} type="number" placeholder="Ordre d'affichage (ex. 9)" value={nouvSalle.ordre} onChange={(e) => setNouvSalle({ ...nouvSalle, ordre: e.target.value })} />
                    <button style={btn} onClick={ajouterSalle}>Ajouter la salle</button>
                  </div>

                  <div style={carte}>
                    <h2 style={h2}>Salles ({salles.length})</h2>
                    {salles.map((s) => (
                      <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(60,60,67,.08)" }}>
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
                              <b style={{ color: "#1d1d1f" }}>{s.nom}</b> {!s.actif && <span style={{ color: "#b91c1c", fontSize: 12 }}>(désactivée)</span>}<br />
                              <span style={{ fontSize: 13, color: "#5a5a62" }}>{s.lieu} · ordre {s.ordre}</span>
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
                    <h2 style={h2}>Approbateurs des congés</h2>
                    <p style={{ color: "#8a8a92", fontSize: 13 }}>Reçoivent les demandes de congés avec le lien de validation/refus.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Nom" value={nouvAppro.nom} onChange={(e) => setNouvAppro({ ...nouvAppro, nom: e.target.value })} />
                      <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Email" value={nouvAppro.email} onChange={(e) => setNouvAppro({ ...nouvAppro, email: e.target.value })} />
                      <button style={btn} onClick={() => ajouterDest("approbateurs", nouvAppro.nom, nouvAppro.email)}>Ajouter</button>
                    </div>
                    {approbateurs.map((a) => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(60,60,67,.08)" }}>
                        <div style={{ opacity: a.actif ? 1 : 0.5 }}>
                          <b style={{ color: "#1d1d1f" }}>{a.nom}</b> <span style={{ color: "#8a8a92", fontSize: 13 }}>· {a.email}</span>
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
                    <h2 style={h2}>Membres CPAE (en copie)</h2>
                    <p style={{ color: "#8a8a92", fontSize: 13 }}>Reçoivent les demandes de congés en copie (information, sans action).</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Nom" value={nouvCpae.nom} onChange={(e) => setNouvCpae({ ...nouvCpae, nom: e.target.value })} />
                      <input style={{ ...inp, width: "auto", margin: 0 }} placeholder="Email" value={nouvCpae.email} onChange={(e) => setNouvCpae({ ...nouvCpae, email: e.target.value })} />
                      <button style={btn} onClick={() => ajouterDest("cpae", nouvCpae.nom, nouvCpae.email)}>Ajouter</button>
                    </div>
                    {membresCpae.map((a) => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(60,60,67,.08)" }}>
                        <div style={{ opacity: a.actif ? 1 : 0.5 }}>
                          <b style={{ color: "#1d1d1f" }}>{a.nom}</b> <span style={{ color: "#8a8a92", fontSize: 13 }}>· {a.email}</span>
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

              {onglet === "tuiles" && (
                <>
                  <div style={carte}>
                    <h2 style={h2}>Ajouter une tuile</h2>
                    <input style={inp} placeholder="Clé unique (ex. caisse)" value={nouvTuile.cle} onChange={(e) => setNouvTuile({ ...nouvTuile, cle: e.target.value })} />
                    <input style={inp} placeholder="Titre (ex. Caisse du jour)" value={nouvTuile.titre} onChange={(e) => setNouvTuile({ ...nouvTuile, titre: e.target.value })} />
                    <input style={inp} placeholder="Description" value={nouvTuile.description} onChange={(e) => setNouvTuile({ ...nouvTuile, description: e.target.value })} />
                    <input style={inp} placeholder="URL (https://… ou /admin pour interne)" value={nouvTuile.url} onChange={(e) => setNouvTuile({ ...nouvTuile, url: e.target.value })} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}><label style={lbl}>Icône (emoji)</label>
                        <input style={inp} placeholder="🔗" value={nouvTuile.icone} onChange={(e) => setNouvTuile({ ...nouvTuile, icone: e.target.value })} /></div>
                      <div style={{ flex: 1 }}><label style={lbl}>Ordre</label>
                        <input style={inp} type="number" value={nouvTuile.ordre} onChange={(e) => setNouvTuile({ ...nouvTuile, ordre: e.target.value })} /></div>
                    </div>
                    <div><label style={lbl}>Famille</label>
                      <select style={inp} value={nouvTuile.categorie} onChange={(e) => setNouvTuile({ ...nouvTuile, categorie: e.target.value })}>
                        <option value="">— Aucune (rangée dans « Autres ») —</option>
                        <option value="rh">Ressources humaines</option>
                        <option value="finances">Finances & Comptabilité</option>
                        <option value="vie">Vie paroissiale</option>
                        <option value="admin">Outils d'administration</option>
                      </select>
                    </div>
                    <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
                      <input type="checkbox" checked={nouvTuile.interne} onChange={(e) => setNouvTuile({ ...nouvTuile, interne: e.target.checked })} />
                      Lien interne (même domaine, pas de SSO par URL)
                    </label>
                    <label style={lbl}>Rôles autorisés</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "4px 0 10px" }}>
                      {rolesRef.map((r) => (
                        <label key={r.code} style={chip(nouvTuile.roles_autorises.includes(r.code))}>
                          <input type="checkbox" style={{ marginRight: 4 }} checked={nouvTuile.roles_autorises.includes(r.code)}
                            onChange={(e) => {
                              if (e.target.checked) setNouvTuile({ ...nouvTuile, roles_autorises: [...nouvTuile.roles_autorises, r.code] });
                              else setNouvTuile({ ...nouvTuile, roles_autorises: nouvTuile.roles_autorises.filter((x) => x !== r.code) });
                            }} />
                          {r.libelle}
                        </label>
                      ))}
                    </div>
                    <button style={btn} onClick={ajouterTuile}>Ajouter la tuile</button>
                  </div>

                  <div style={carte}>
                    <h2 style={h2}>Tuiles ({tuilesAdmin.length})</h2>
                    {tuilesAdmin.map((t) => (
                      <div key={t.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(60,60,67,.08)" }}>
                        {editTuile?.id === t.id ? (
                          <div>
                            <input style={inp} placeholder="Titre" value={editTuile.titre} onChange={(e) => setEditTuile({ ...editTuile, titre: e.target.value })} />
                            <input style={inp} placeholder="Description" value={editTuile.description ?? ""} onChange={(e) => setEditTuile({ ...editTuile, description: e.target.value })} />
                            <input style={inp} placeholder="URL" value={editTuile.url} onChange={(e) => setEditTuile({ ...editTuile, url: e.target.value })} />
                            <div style={{ display: "flex", gap: 10 }}>
                              <div style={{ flex: 1 }}><label style={lbl}>Icône</label>
                                <input style={inp} value={editTuile.icone ?? ""} onChange={(e) => setEditTuile({ ...editTuile, icone: e.target.value })} /></div>
                              <div style={{ flex: 1 }}><label style={lbl}>Ordre</label>
                                <input style={inp} type="number" value={editTuile.ordre} onChange={(e) => setEditTuile({ ...editTuile, ordre: e.target.value })} /></div>
                            </div>
                            <div><label style={lbl}>Famille</label>
                              <select style={inp} value={editTuile.categorie ?? ""} onChange={(e) => setEditTuile({ ...editTuile, categorie: e.target.value })}>
                                <option value="">— Aucune (rangée dans « Autres ») —</option>
                                <option value="rh">Ressources humaines</option>
                                <option value="finances">Finances & Comptabilité</option>
                                <option value="vie">Vie paroissiale</option>
                                <option value="admin">Outils d'administration</option>
                              </select>
                            </div>
                            <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
                              <input type="checkbox" checked={editTuile.interne} onChange={(e) => setEditTuile({ ...editTuile, interne: e.target.checked })} />
                              Lien interne
                            </label>
                            <label style={lbl}>Rôles autorisés</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "4px 0 10px" }}>
                              {rolesRef.map((r) => (
                                <label key={r.code} style={chip(editTuile.roles_autorises?.includes(r.code))}>
                                  <input type="checkbox" style={{ marginRight: 4 }} checked={editTuile.roles_autorises?.includes(r.code) ?? false}
                                    onChange={(e) => {
                                      const cur = editTuile.roles_autorises ?? [];
                                      if (e.target.checked) setEditTuile({ ...editTuile, roles_autorises: [...cur, r.code] });
                                      else setEditTuile({ ...editTuile, roles_autorises: cur.filter((x: string) => x !== r.code) });
                                    }} />
                                  {r.libelle}
                                </label>
                              ))}
                            </div>
                            <button style={btn} onClick={enregistrerEditTuile}>Enregistrer</button>
                            <button style={{ ...lien, marginLeft: 10 }} onClick={() => setEditTuile(null)}>Annuler</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ opacity: t.actif ? 1 : 0.5 }}>
                              <b style={{ color: "#1d1d1f" }}>{t.icone} {t.titre}</b> {!t.actif && <span style={{ color: "#b91c1c", fontSize: 12 }}>(désactivée)</span>}<br />
                              <span style={{ fontSize: 12, color: "#8a8a92" }}>{t.url} · ordre {t.ordre}</span><br />
                              <span style={{ fontSize: 12, color: "#5a5a62" }}>{(t.roles_autorises ?? []).map(libelleRole).join(", ")}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
                              <button style={btnMini} onClick={() => setEditTuile({ id: t.id, titre: t.titre, description: t.description, url: t.url, icone: t.icone, interne: t.interne, ordre: t.ordre, roles_autorises: t.roles_autorises ?? [], categorie: t.categorie ?? "" })}>Modifier</button>
                              <button style={{ ...btnMini, background: t.actif ? "#b45309" : "#15803d" }} onClick={() => basculerTuile(t.id, !t.actif)}>{t.actif ? "Désactiver" : "Réactiver"}</button>
                              <button style={{ ...btnMini, background: "#b91c1c" }} onClick={() => supprimerTuile(t.id)}>Supprimer</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <p style={pied}>Alexandre FAMARE © 2026</p>
        </div>
      </div>
    </>
  );
}

const pageWrap: React.CSSProperties = { position: "relative", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#1d1d1f", WebkitFontSmoothing: "antialiased" };
const wall: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 0,
  background: "radial-gradient(circle at 16% 16%, #d3d7df 0%, rgba(211,215,223,0) 46%), radial-gradient(circle at 84% 14%, #dadee5 0%, rgba(218,222,229,0) 48%), radial-gradient(circle at 82% 88%, #cdd2db 0%, rgba(205,210,219,0) 46%), linear-gradient(160deg, #e8ebf0 0%, #dde1e8 55%, #d2d7e0 100%)",
};
const menubar: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 18,
  height: 28, padding: "0 16px", fontSize: 12.5, fontWeight: 500, color: "#2a2a30",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderBottom: "1px solid rgba(255,255,255,.55)",
};
const menuLien: React.CSSProperties = { color: "#2a2a30", textDecoration: "none", fontWeight: 500 };
const fenetreWrap: React.CSSProperties = { position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto", padding: "30px 20px 50px", width: "100%", boxSizing: "border-box" };
const fenetre: React.CSSProperties = {
  borderRadius: 16, overflow: "hidden",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.6)",
  boxShadow: "0 30px 80px rgba(50,55,70,.24), 0 4px 14px rgba(50,55,70,.13), inset 0 1px 0 rgba(255,255,255,.7)",
};
const titleBar: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 14, height: 46, padding: "0 16px",
  background: "rgba(255,255,255,.4)", borderBottom: "1px solid rgba(60,60,67,.1)",
};
const feux: React.CSSProperties = { display: "flex", gap: 8, flexShrink: 0 };
const feu: React.CSSProperties = { width: 12, height: 12, borderRadius: "50%", display: "inline-block", boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.12)" };
const titreFenetre: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "#3a3a40", whiteSpace: "nowrap" };
const corps: React.CSSProperties = { padding: "20px 22px", background: "rgba(255,255,255,.3)" };
const segmented: React.CSSProperties = { display: "flex", gap: 4, margin: "16px 0", padding: 4, borderRadius: 12, background: "rgba(110,115,130,.16)", border: "1px solid rgba(255,255,255,.5)", flexWrap: "wrap" };
const carte: React.CSSProperties = {
  background: "rgba(255,255,255,.6)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.7)", borderRadius: 16, padding: 18, margin: "14px 0",
  boxShadow: "0 8px 26px rgba(50,55,70,.1), inset 0 1px 0 rgba(255,255,255,.7)",
};
const h2: React.CSSProperties = { fontSize: 16.5, fontWeight: 700, margin: "0 0 8px", color: "#1d1d1f" };
const inp: React.CSSProperties = { display: "block", width: "100%", padding: 10, margin: "4px 0 8px", borderRadius: 10, border: "1px solid rgba(60,60,67,.18)", boxSizing: "border-box", fontSize: 14, fontFamily: "inherit", background: "rgba(255,255,255,.7)", color: "#1d1d1f", outline: "none" };
const lbl: React.CSSProperties = { fontSize: 13, color: "#5a5a62", fontWeight: 600 };
const btn: React.CSSProperties = { padding: "10px 18px", background: "linear-gradient(180deg,#5c6470,#444b56)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", boxShadow: "0 4px 12px rgba(68,75,86,.3)" };
const btnMini: React.CSSProperties = { padding: "6px 11px", background: "linear-gradient(180deg,#5c6470,#444b56)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#444b56", cursor: "pointer", fontSize: 14, fontFamily: "inherit", padding: 0, fontWeight: 600 };
const pied: React.CSSProperties = { textAlign: "center", padding: "20px 14px 0", fontSize: 12, color: "#8a8a92" };
const infoMsg: React.CSSProperties = { background: "rgba(80,90,110,.12)", color: "#3a4452", border: "1px solid rgba(80,90,110,.28)", padding: 11, borderRadius: 12, margin: "10px 0", fontSize: 14 };
function chip(actif: boolean): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", padding: "5px 11px", borderRadius: 999, fontSize: 13, cursor: "pointer",
    border: "1px solid " + (actif ? "rgba(70,80,100,.5)" : "rgba(60,60,67,.2)"), background: actif ? "rgba(90,100,120,.18)" : "rgba(255,255,255,.6)", color: actif ? "#3a4452" : "#5a5a62", fontWeight: actif ? 600 : 500 };
}
