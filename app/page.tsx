// app/page.tsx
"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

export default function Portail() {
  const [profil, setProfil] = useState<any>(null);
  const [tuiles, setTuiles] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await getSupabase().auth.getUser();
      if (!data.user) { window.location.href = "/login"; return; }
      const { data: p } = await getSupabase().from("profiles").select("nom_complet,roles,poste").eq("id", data.user.id).single();
      setProfil(p);
      const { data: t } = await getSupabase().from("portail_tuiles").select("*").eq("actif", true).order("ordre");
      setTuiles(t ?? []);
      setChargement(false);
    }
    init();
  }, []);

  if (chargement) return <p style={{ padding: 40 }}>Chargement…</p>;

  const roles: string[] = profil?.roles ?? [];
  const aAcces = (autorises: string[]) => (autorises ?? []).some((r) => roles.includes(r));
  const appsVisibles = tuiles.filter((a) => aAcces(a.roles_autorises));

  async function ouvrirApp(a: any) {
    if (a.interne) { window.location.href = a.url; return; }
    const { data } = await getSupabase().auth.getSession();
    const s = data.session;
    if (s?.access_token && s?.refresh_token) {
      const params = new URLSearchParams({ sso_at: s.access_token, sso_rt: s.refresh_token });
      window.location.href = `${a.url}/#${params.toString()}`;
    } else {
      window.location.href = a.url;
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, width: "100%", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, lineHeight: 1.3 }}>
              Intranet paroissial<br />
              <span style={{ fontSize: 15, color: "#555" }}>Paroisse Notre Dame du Bon Secours</span>
            </h1>
            {profil && (
              <div style={{ background: "#eff6ff", padding: "8px 12px", borderRadius: 6, marginTop: 6, fontSize: 14 }}>
                Connecté : <b>{profil.nom_complet}</b>
                {roles.length > 0 && <span> — {roles.map(libelleRole).join(", ")}</span>}
                {roles.includes("salarie") && profil.poste && <span> — {profil.poste}</span>}
              </div>
            )}
          </div>
          <img src="/logo.png" alt="Logo paroisse" style={{ height: 70 }} />
        </div>

        <div style={{ textAlign: "right", margin: "8px 0" }}>
          <button style={lien} onClick={() => getSupabase().auth.signOut().then(() => window.location.href = "/login")}>
            Déconnexion</button>
        </div>

        <h2 style={{ fontSize: 18, marginTop: 20 }}>Mes applications</h2>
        {appsVisibles.length === 0 && (
          <p style={{ color: "#777" }}>Aucune application disponible pour votre profil pour le moment.</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
          {appsVisibles.map((a) => (
            <div key={a.cle} onClick={() => ouvrirApp(a)} style={tuile}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{a.icone}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{a.titre}</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{a.description}</div>
            </div>
          ))}
        </div>
      </div>
      <footer style={pied}>Alexandre FAMARE © 2026</footer>
    </div>
  );
}

function libelleRole(role: string): string {
  return ({
    salarie: "Salarié", secretaire: "Secrétaire", benevole: "Bénévole",
    comptable: "Comptable CPAE", cpae: "Membre CPAE", cure: "Curé",
    vicaire: "Vicaire", diacre: "Diacre", admin: "Administrateur", invite: "Invité",
  } as any)[role] ?? role;
}

const tuile: React.CSSProperties = {
  display: "block", background: "#fff", padding: 24, borderRadius: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,.08)", textDecoration: "none", color: "#111",
  textAlign: "center", transition: "transform .1s", cursor: "pointer",
};
const lien: React.CSSProperties = { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14 };
const pied: React.CSSProperties = { textAlign: "center", padding: 14, fontSize: 12, color: "#999" };
