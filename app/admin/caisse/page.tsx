// app/admin/caisse/page.tsx — Gestion des catégories et moyens de paiement de la caisse — fenêtre macOS Liquid Glass
"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getSupabase } from "../../../lib/supabaseClient";

export default function AdminCaisse() {
  const [token, setToken] = useState("");
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [moyens, setMoyens] = useState<any[]>([]);
  const [nouvCat, setNouvCat] = useState("");
  const [nouvMoy, setNouvMoy] = useState("");
  const [editCat, setEditCat] = useState<{ id: string; libelle: string } | null>(null);
  const [editMoy, setEditMoy] = useState<{ id: string; libelle: string } | null>(null);
  const [horloge, setHorloge] = useState("");
  const [zoom, setZoom] = useState(false);

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
      charger(tk);
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

  async function charger(tk: string) {
    const r = await fetch("/api/admin-caisse", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "tout_charger", access_token: tk }),
    }).then((r) => r.json());
    if (r.ok) { setCategories(r.categories); setMoyens(r.moyens); }
  }

  async function appel(action: string, params: any = {}) {
    setMsg("");
    const r = await fetch("/api/admin-caisse", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, access_token: token, ...params }),
    }).then((r) => r.json());
    if (r.ok) { charger(token); return true; }
    setMsg("Erreur : " + r.error); return false;
  }

  function fermer() { window.location.href = "/"; }

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
            <img src="/logo.png" alt="" style={{ height: 17, width: 17, objectFit: "contain" }} /> Gestion caisse
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <a href="/" style={menuLien}>⌂ Intranet</a>
            <a href="/admin" style={menuLien}>← Administration</a>
            <span style={{ opacity: 0.9 }}>{horloge}</span>
          </span>
        </div>

        {/* Fenêtre d'application macOS */}
        <div style={{ ...fenetreWrap, maxWidth: zoom ? "100%" : 820, padding: zoom ? "12px 12px 50px" : "30px 20px 50px", transition: "max-width .3s ease, padding .3s ease" }}>
          <div style={fenetre}>
            {/* Title bar */}
            <div style={titleBar}>
              <span style={feux}>
                <i title="Fermer" onClick={fermer} style={{ ...feu, background: "#ff5f57", cursor: "pointer" }} />
                <i title="Retour à l'accueil" onClick={fermer} style={{ ...feu, background: "#febc2e", cursor: "pointer" }} />
                <i title="Plein écran" onClick={() => setZoom(!zoom)} style={{ ...feu, background: "#28c840", cursor: "pointer" }} />
              </span>
              <span style={titreFenetre}>Gestion de la caisse</span>
              <img src="/logo.png" alt="" style={{ marginLeft: "auto", height: 26, objectFit: "contain" }} />
            </div>

            {/* Contenu */}
            <div style={corps}>
              <div style={{ marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1d1d1f", letterSpacing: "-.4px" }}>Gestion de la caisse</h1>
                <p style={{ fontSize: 14, color: "#5a5a62", margin: "3px 0 0" }}>Catégories et moyens de paiement</p>
              </div>

              {msg && <div style={errBox}>{msg}</div>}

              {/* Catégories */}
              <div style={carte}>
                <h2 style={h2}>Catégories</h2>
                <p style={{ fontSize: 12.5, color: "#8a8a92", margin: "0 0 6px" }}>Catégories proposées lors de la saisie d'une opération (entrée ou sortie).</p>
                <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
                  <input style={inp} placeholder="Nouvelle catégorie (ex. Pèlerinage)" value={nouvCat}
                    onChange={(e) => setNouvCat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && nouvCat.trim()) { appel("cat_ajouter", { libelle: nouvCat }); setNouvCat(""); } }} />
                  <button style={btn} onClick={() => { if (nouvCat.trim()) { appel("cat_ajouter", { libelle: nouvCat }); setNouvCat(""); } }}>Ajouter</button>
                </div>
                {categories.map((c, i) => (
                  <div key={c.id} style={ligneStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <button style={fleche} disabled={i === 0} onClick={() => appel("cat_deplacer", { id: c.id, sens: "haut" })}>▲</button>
                      <button style={fleche} disabled={i === categories.length - 1} onClick={() => appel("cat_deplacer", { id: c.id, sens: "bas" })}>▼</button>
                    </div>
                    {editCat && editCat.id === c.id ? (
                      <>
                        <input style={{ ...inp, flex: 1 }} value={editCat.libelle} onChange={(e) => setEditCat({ ...editCat, libelle: e.target.value })} />
                        <button style={btnMini} onClick={async () => { const lib = editCat.libelle; if (await appel("cat_renommer", { id: c.id, libelle: lib })) setEditCat(null); }}>OK</button>
                        <button style={{ ...btnMini, ...btnGris }} onClick={() => setEditCat(null)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, color: c.actif ? "#1d1d1f" : "#aaa", textDecoration: c.actif ? "none" : "line-through" }}>{c.libelle}</span>
                        <button style={btnMini} onClick={() => setEditCat({ id: c.id, libelle: c.libelle })}>Renommer</button>
                        <button style={{ ...btnMini, ...(c.actif ? btnAmbre : btnVert) }} onClick={() => appel("cat_actif", { id: c.id, actif: !c.actif })}>
                          {c.actif ? "Désactiver" : "Activer"}</button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Moyens de paiement */}
              <div style={carte}>
                <h2 style={h2}>Moyens de paiement</h2>
                <p style={{ fontSize: 12.5, color: "#8a8a92", margin: "0 0 6px" }}>Moyens proposés lors de la saisie. Note : le moyen « Chèque » d'origine déclenche le champ n° de chèque ; un nouveau moyen ajouté fonctionne pour la saisie et les totaux sans logique spéciale.</p>
                <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
                  <input style={inp} placeholder="Nouveau moyen (ex. Prélèvement)" value={nouvMoy}
                    onChange={(e) => setNouvMoy(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && nouvMoy.trim()) { appel("moy_ajouter", { libelle: nouvMoy }); setNouvMoy(""); } }} />
                  <button style={btn} onClick={() => { if (nouvMoy.trim()) { appel("moy_ajouter", { libelle: nouvMoy }); setNouvMoy(""); } }}>Ajouter</button>
                </div>
                {moyens.map((m) => (
                  <div key={m.id} style={ligneStyle}>
                    {editMoy && editMoy.id === m.id ? (
                      <>
                        <input style={{ ...inp, flex: 1 }} value={editMoy.libelle} onChange={(e) => setEditMoy({ ...editMoy, libelle: e.target.value })} />
                        <button style={btnMini} onClick={async () => { const lib = editMoy.libelle; if (await appel("moy_renommer", { id: m.id, libelle: lib })) setEditMoy(null); }}>OK</button>
                        <button style={{ ...btnMini, ...btnGris }} onClick={() => setEditMoy(null)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, color: m.actif ? "#1d1d1f" : "#aaa", textDecoration: m.actif ? "none" : "line-through" }}>
                          {m.libelle} <span style={{ fontSize: 11, color: "#b0b0b8" }}>({m.code})</span>
                        </span>
                        <button style={btnMini} onClick={() => setEditMoy({ id: m.id, libelle: m.libelle })}>Renommer</button>
                        <button style={{ ...btnMini, ...(m.actif ? btnAmbre : btnVert) }} onClick={() => appel("moy_actif", { id: m.id, actif: !m.actif })}>
                          {m.actif ? "Désactiver" : "Activer"}</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
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
  background: "radial-gradient(circle at 16% 16%, #f0e3c8 0%, rgba(240,227,200,0) 45%), radial-gradient(circle at 84% 14%, #efdcc4 0%, rgba(239,220,196,0) 48%), radial-gradient(circle at 82% 86%, #ecdfcb 0%, rgba(236,223,203,0) 46%), linear-gradient(160deg, #f4eee1 0%, #ece2cf 55%, #e4d8c2 100%)",
};
const menubar: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 18,
  height: 28, padding: "0 16px", fontSize: 12.5, fontWeight: 500, color: "#2a2a30",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderBottom: "1px solid rgba(255,255,255,.55)",
};
const menuLien: React.CSSProperties = { color: "#2a2a30", textDecoration: "none", fontWeight: 500 };
const fenetreWrap: React.CSSProperties = { position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "30px 20px 50px", width: "100%", boxSizing: "border-box" };
const fenetre: React.CSSProperties = {
  borderRadius: 16, overflow: "hidden",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.6)",
  boxShadow: "0 30px 80px rgba(90,70,40,.24), 0 4px 14px rgba(90,70,40,.13), inset 0 1px 0 rgba(255,255,255,.7)",
};
const titleBar: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 14, height: 46, padding: "0 16px",
  background: "rgba(255,255,255,.4)", borderBottom: "1px solid rgba(60,60,67,.1)",
};
const feux: React.CSSProperties = { display: "flex", gap: 8, flexShrink: 0 };
const feu: React.CSSProperties = { width: 12, height: 12, borderRadius: "50%", display: "inline-block", boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.12)" };
const titreFenetre: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "#3a3a40", whiteSpace: "nowrap" };
const corps: React.CSSProperties = { padding: "20px 22px", background: "rgba(255,255,255,.3)" };
const carte: React.CSSProperties = {
  background: "rgba(255,255,255,.6)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.7)", borderRadius: 16, padding: 18, margin: "14px 0",
  boxShadow: "0 8px 26px rgba(90,70,40,.1), inset 0 1px 0 rgba(255,255,255,.7)",
};
const h2: React.CSSProperties = { fontSize: 16.5, fontWeight: 700, margin: "0 0 4px", color: "#1d1d1f" };
const inp: React.CSSProperties = { padding: 10, borderRadius: 10, border: "1px solid rgba(60,60,67,.18)", boxSizing: "border-box", flex: 1, fontSize: 14, fontFamily: "inherit", background: "rgba(255,255,255,.7)", color: "#1d1d1f", outline: "none" };
const btn: React.CSSProperties = { padding: "10px 18px", background: "linear-gradient(180deg,#c08a2e,#a6711a)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", boxShadow: "0 4px 12px rgba(166,113,26,.3)", whiteSpace: "nowrap" };
const btnMini: React.CSSProperties = { padding: "6px 12px", background: "linear-gradient(180deg,#c08a2e,#a6711a)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" };
const btnGris: React.CSSProperties = { background: "rgba(120,120,128,.55)" };
const btnAmbre: React.CSSProperties = { background: "linear-gradient(180deg,#c98a2e,#a86f18)" };
const btnVert: React.CSSProperties = { background: "linear-gradient(180deg,#4a8c5e,#3a7a4e)" };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#a6711a", cursor: "pointer", fontSize: 14, fontFamily: "inherit", padding: 0 };
const ligneStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: "1px solid rgba(60,60,67,.08)" };
const fleche: React.CSSProperties = { padding: "1px 6px", fontSize: 9, background: "rgba(255,255,255,.7)", border: "1px solid rgba(60,60,67,.18)", borderRadius: 5, cursor: "pointer", lineHeight: 1.3, color: "#5a5a62" };
const errBox: React.CSSProperties = { background: "rgba(214,69,62,.12)", color: "#b3261e", border: "1px solid rgba(214,69,62,.3)", padding: 11, borderRadius: 12, margin: "10px 0", fontSize: 14 };
const pied: React.CSSProperties = { textAlign: "center", padding: "20px 14px 0", fontSize: 12, color: "#8a8a92" };
const pilule: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#a6711a", fontSize: 13, fontWeight: 500,
  padding: "7px 14px", borderRadius: 999, background: "rgba(255,255,255,.6)",
  backdropFilter: "blur(18px) saturate(180%)", WebkitBackdropFilter: "blur(18px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 4px 14px rgba(90,70,40,.12)",
};
