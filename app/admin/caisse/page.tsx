// app/admin/caisse/page.tsx — Gestion des catégories et moyens de paiement de la caisse
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

  if (autorise === null) return <p style={{ padding: 40 }}>Chargement…</p>;
  if (autorise === false) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Accès refusé</h1>
      <p>Cette page est réservée aux administrateurs.</p>
      <a href="/" style={{ color: "#2563eb" }}>← Retour à l'intranet</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f4f6" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16, width: "100%", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{ fontSize: 20 }}>Gestion de la caisse<br />
            <span style={{ fontSize: 14, color: "#555" }}>Catégories et moyens de paiement</span></h1>
          <img src="/logo.png" alt="Logo" style={{ height: 60 }} />
        </div>
        <div style={{ margin: "8px 0" }}>
          <a href="/admin" style={{ ...lien, textDecoration: "none", marginRight: 14 }}>← Administration</a>
          <a href="/" style={{ ...lien, textDecoration: "none" }}>⌂ Intranet</a>
        </div>

        {msg && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 10, borderRadius: 6, margin: "8px 0" }}>{msg}</div>}

        <div style={carte}>
          <h2 style={{ fontSize: 16 }}>Catégories</h2>
          <p style={{ fontSize: 12, color: "#777" }}>Catégories proposées lors de la saisie d'une opération (entrée ou sortie).</p>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
            <input style={inp} placeholder="Nouvelle catégorie (ex. Pèlerinage)" value={nouvCat}
              onChange={(e) => setNouvCat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && nouvCat.trim()) { appel("cat_ajouter", { libelle: nouvCat }); setNouvCat(""); } }} />
            <button style={btn} onClick={() => { if (nouvCat.trim()) { appel("cat_ajouter", { libelle: nouvCat }); setNouvCat(""); } }}>Ajouter</button>
          </div>
          {categories.map((c, i) => (
            <div key={c.id} style={ligneStyle}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button style={fleche} disabled={i === 0} onClick={() => appel("cat_deplacer", { id: c.id, sens: "haut" })}>▲</button>
                <button style={fleche} disabled={i === categories.length - 1} onClick={() => appel("cat_deplacer", { id: c.id, sens: "bas" })}>▼</button>
              </div>
              {editCat && editCat.id === c.id ? (
                <>
                  <input style={{ ...inp, flex: 1 }} value={editCat.libelle} onChange={(e) => setEditCat({ ...editCat, libelle: e.target.value })} />
                  <button style={btnMini} onClick={async () => { const lib = editCat.libelle; if (await appel("cat_renommer", { id: c.id, libelle: lib })) setEditCat(null); }}>OK</button>
                  <button style={{ ...btnMini, background: "#888" }} onClick={() => setEditCat(null)}>Annuler</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, color: c.actif ? "#1e293b" : "#aaa", textDecoration: c.actif ? "none" : "line-through" }}>{c.libelle}</span>
                  <button style={btnMini} onClick={() => setEditCat({ id: c.id, libelle: c.libelle })}>Renommer</button>
                  <button style={{ ...btnMini, background: c.actif ? "#b45309" : "#15803d" }} onClick={() => appel("cat_actif", { id: c.id, actif: !c.actif })}>
                    {c.actif ? "Désactiver" : "Activer"}</button>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={carte}>
          <h2 style={{ fontSize: 16 }}>Moyens de paiement</h2>
          <p style={{ fontSize: 12, color: "#777" }}>Moyens proposés lors de la saisie. Note : le moyen « Chèque » d'origine déclenche le champ n° de chèque ; un nouveau moyen ajouté fonctionne pour la saisie et les totaux sans logique spéciale.</p>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
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
                  <button style={{ ...btnMini, background: "#888" }} onClick={() => setEditMoy(null)}>Annuler</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, color: m.actif ? "#1e293b" : "#aaa", textDecoration: m.actif ? "none" : "line-through" }}>
                    {m.libelle} <span style={{ fontSize: 11, color: "#bbb" }}>({m.code})</span>
                  </span>
                  <button style={btnMini} onClick={() => setEditMoy({ id: m.id, libelle: m.libelle })}>Renommer</button>
                  <button style={{ ...btnMini, background: m.actif ? "#b45309" : "#15803d" }} onClick={() => appel("moy_actif", { id: m.id, actif: !m.actif })}>
                    {m.actif ? "Désactiver" : "Activer"}</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <footer style={{ textAlign: "center", padding: 14, fontSize: 12, color: "#999" }}>Alexandre FAMARE © 2026</footer>
    </div>
  );
}

const carte: React.CSSProperties = { background: "#fff", padding: 18, borderRadius: 12, margin: "12px 0", boxShadow: "0 1px 4px rgba(0,0,0,.08)" };
const inp: React.CSSProperties = { padding: 9, borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box", flex: 1 };
const btn: React.CSSProperties = { padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 };
const btnMini: React.CSSProperties = { padding: "5px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14 };
const ligneStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #eee" };
const fleche: React.CSSProperties = { padding: "0 4px", fontSize: 10, background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 4, cursor: "pointer", lineHeight: 1.4 };
