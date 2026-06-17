// app/page.tsx
"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

const FAMILLES: { code: string; libelle: string }[] = [
  { code: "rh", libelle: "Ressources humaines" },
  { code: "finances", libelle: "Finances & Comptabilité" },
  { code: "vie", libelle: "Vie paroissiale" },
  { code: "admin", libelle: "Outils d'administration" },
  { code: "autres", libelle: "Autres" },
];

export default function Portail() {
  const [profil, setProfil] = useState<any>(null);
  const [tuiles, setTuiles] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const [focusSearch, setFocusSearch] = useState(false);

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

  const roles: string[] = profil?.roles ?? [];
  const aAcces = (autorises: string[]) => (autorises ?? []).some((r) => roles.includes(r));

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

  if (chargement) return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center", display: "flex" }}>
      <Scene />
      <p style={{ position: "relative", zIndex: 1, color: "#475569" }}>Chargement…</p>
    </div>
  );

  let appsVisibles = tuiles.filter((a) => aAcces(a.roles_autorises));
  const q = recherche.trim().toLowerCase();
  if (q) {
    appsVisibles = appsVisibles.filter((a) =>
      (a.titre || "").toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q)
    );
  }
  const parFamille = (code: string) =>
    appsVisibles.filter((a) => {
      const cat = a.categorie || "autres";
      return code === "autres" ? !FAMILLES.slice(0, -1).some((f) => f.code === cat) : cat === code;
    });

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={page}>
        <Scene />
        <div style={container}>
          {/* En-tête en verre */}
          <div style={topbar}>
            <img src="/logo.png" alt="Logo paroisse" style={logoImg} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1f3a", lineHeight: 1.2 }}>Intranet paroissial</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Paroisse Notre-Dame du Bon Secours</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right", fontSize: 13, color: "#475569" }}>
              {profil && (
                <>
                  <div>Connecté : <b style={{ color: "#0f1f3a" }}>{profil.nom_complet}</b></div>
                  <div style={{ fontSize: 12 }}>
                    {roles.map(libelleRole).join(", ")}
                    {roles.includes("salarie") && profil.poste ? ` — ${profil.poste}` : ""}
                  </div>
                  <button style={lien} onClick={() => getSupabase().auth.signOut().then(() => window.location.href = "/login")}>Déconnexion</button>
                </>
              )}
            </div>
          </div>

          {/* Recherche */}
          <input
            style={{ ...search, borderColor: focusSearch ? "rgba(200,160,78,.7)" : "rgba(255,255,255,.7)", boxShadow: focusSearch ? "0 6px 20px rgba(30,58,95,.10), 0 0 0 4px rgba(200,160,78,.15)" : "0 6px 20px rgba(30,58,95,.08), inset 0 1px 0 rgba(255,255,255,.8)" }}
            placeholder="🔍  Rechercher une application…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onFocus={() => setFocusSearch(true)} onBlur={() => setFocusSearch(false)}
          />

          {appsVisibles.length === 0 && (
            <p style={{ color: "#64748b", marginTop: 10 }}>
              {q ? "Aucune application ne correspond à votre recherche." : "Aucune application disponible pour votre profil pour le moment."}
            </p>
          )}

          {FAMILLES.map((fam) => {
            const apps = parFamille(fam.code);
            if (apps.length === 0) return null;
            return (
              <div key={fam.code} style={{ marginTop: 28 }}>
                <h2 style={titreFamille}><span style={traitDore} />{fam.libelle}</h2>
                <div style={grid}>
                  {apps.map((a) => (
                    <div key={a.cle} onClick={() => ouvrirApp(a)}
                      onMouseEnter={() => setHover(a.cle)} onMouseLeave={() => setHover(null)}
                      style={{ ...tuile, transform: hover === a.cle ? "translateY(-4px)" : "none", boxShadow: hover === a.cle ? "0 16px 40px rgba(30,58,95,.16), inset 0 1px 0 rgba(255,255,255,.9)" : "0 8px 26px rgba(30,58,95,.10), inset 0 1px 0 rgba(255,255,255,.85)" }}>
                      <div style={pastille}>{a.icone}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#0f1f3a" }}>{a.titre}</div>
                      {a.description && <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>{a.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <p style={pied}>Alexandre FAMARE © 2026</p>
        </div>
      </div>
    </>
  );
}

function Scene() {
  return (
    <div style={scene}>
      <div style={{ ...blob, width: 520, height: 520, background: "rgba(120,160,230,.40)", top: -130, left: -100 }} />
      <div style={{ ...blob, width: 460, height: 460, background: "rgba(227,200,120,.34)", bottom: -150, right: -90 }} />
      <div style={{ ...blob, width: 360, height: 360, background: "rgba(160,200,250,.34)", top: "45%", left: "60%" }} />
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

const page: React.CSSProperties = { position: "relative", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflow: "hidden" };
const scene: React.CSSProperties = { position: "fixed", inset: 0, background: "linear-gradient(135deg,#eef3fb 0%,#f7f2ec 50%,#eaf0fa 100%)", overflow: "hidden", zIndex: 0 };
const blob: React.CSSProperties = { position: "absolute", borderRadius: "50%", filter: "blur(80px)" };
const container: React.CSSProperties = { position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "24px 20px 50px", width: "100%", boxSizing: "border-box" };
const topbar: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 22, marginBottom: 22,
  background: "rgba(255,255,255,.55)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)",
  border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 8px 30px rgba(30,58,95,.10), inset 0 1px 0 rgba(255,255,255,.8)",
};
const logoImg: React.CSSProperties = { height: 56, width: 56, objectFit: "contain", borderRadius: 14, border: "1.5px solid rgba(227,200,120,.6)", padding: 3, background: "rgba(255,255,255,.5)", boxSizing: "border-box" };
const search: React.CSSProperties = {
  width: "100%", padding: "15px 20px", borderRadius: 18, fontSize: 15, fontFamily: "inherit", color: "#1e293b", boxSizing: "border-box",
  background: "rgba(255,255,255,.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,.7)", outline: "none", transition: "box-shadow .2s, border-color .2s",
};
const titreFamille: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "#334155", letterSpacing: ".3px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 };
const traitDore: React.CSSProperties = { width: 18, height: 3, borderRadius: 2, background: "linear-gradient(90deg,#c8a04e,#e3c878)", display: "inline-block" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18 };
const tuile: React.CSSProperties = {
  padding: "24px 20px", borderRadius: 22, textAlign: "center", cursor: "pointer",
  background: "rgba(255,255,255,.55)", backdropFilter: "blur(18px) saturate(150%)", WebkitBackdropFilter: "blur(18px) saturate(150%)",
  border: "1px solid rgba(255,255,255,.75)", transition: "transform .18s, box-shadow .18s",
};
const pastille: React.CSSProperties = {
  width: 62, height: 62, margin: "0 auto 12px", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
  background: "linear-gradient(160deg, rgba(255,255,255,.9), rgba(225,235,250,.65))",
  border: "1px solid rgba(255,255,255,.9)",
  boxShadow: "0 6px 16px rgba(30,58,95,.14), inset 0 1px 0 rgba(255,255,255,.95), inset 0 -2px 6px rgba(160,180,220,.25)",
};
const lien: React.CSSProperties = { background: "none", border: "none", color: "#1a2f54", cursor: "pointer", fontSize: 13, padding: "4px 0 0", fontFamily: "inherit", textDecoration: "underline" };
const pied: React.CSSProperties = { textAlign: "center", padding: "30px 14px 0", fontSize: 12, color: "#94a3b8" };
