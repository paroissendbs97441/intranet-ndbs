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
  const [horloge, setHorloge] = useState("");
  const [dockHover, setDockHover] = useState<number | null>(null);

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

  const initiale = (profil?.nom_complet || "?").trim().charAt(0).toUpperCase();

  let appsVisibles = tuiles.filter((a) => aAcces(a.roles_autorises));
  const q = recherche.trim().toLowerCase();
  const appsRecherche = q
    ? appsVisibles.filter((a) => (a.titre || "").toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q))
    : appsVisibles;

  const parFamille = (code: string) =>
    appsRecherche.filter((a) => {
      const cat = a.categorie || "autres";
      return code === "autres" ? !FAMILLES.slice(0, -1).some((f) => f.code === cat) : cat === code;
    });

  // Dock : les 6 premières apps accessibles (par ordre), indépendant de la recherche
  const appsDock = appsVisibles.slice(0, 6);

  // Facteur de grossissement façon loupe macOS
  function scaleDock(i: number): number {
    if (dockHover === null) return 1;
    const d = Math.abs(i - dockHover);
    if (d === 0) return 1.5;
    if (d === 1) return 1.25;
    if (d === 2) return 1.1;
    return 1;
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={pageWrap}>
        {/* Wallpaper macOS */}
        <div style={wall} />

        {/* Barre de menu */}
        <div style={menubar}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <img src="/logo.png" alt="" style={{ height: 18, width: 18, objectFit: "contain" }} /> Paroisse NDBS
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center", fontWeight: 500, opacity: 0.95 }}>
            <span>{horloge}</span>
          </span>
        </div>

        {chargement ? (
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff", paddingTop: 80 }}>Chargement…</div>
        ) : (
          <div style={container}>
            <div style={hero}>
              <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.5px", margin: 0 }}>Intranet paroissial</h1>
              <p style={{ fontSize: 15, opacity: 0.92, marginTop: 4 }}>Paroisse Notre-Dame du Bon Secours — Diocèse de La Réunion</p>
            </div>

            {/* Panneau utilisateur + recherche */}
            <div style={panel}>
              <div style={userRow}>
                <span style={avatar}>{initiale}</span>
                {profil && (
                  <span style={{ fontSize: 13 }}>Connecté : <b style={{ fontWeight: 600 }}>{profil.nom_complet}</b>
                    <span style={{ opacity: 0.85 }}> — {roles.map(libelleRole).join(", ")}{roles.includes("salarie") && profil.poste ? ` — ${profil.poste}` : ""}</span>
                  </span>
                )}
                <button style={logout} onClick={() => getSupabase().auth.signOut().then(() => window.location.href = "/login")}>Déconnexion</button>
              </div>
              <input
                style={{ ...search, border: focusSearch ? "1px solid rgba(255,255,255,.85)" : "1px solid rgba(255,255,255,.4)", boxShadow: focusSearch ? "0 0 0 4px rgba(255,255,255,.18)" : "none" }}
                placeholder="🔍  Rechercher une application…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                onFocus={() => setFocusSearch(true)} onBlur={() => setFocusSearch(false)}
              />
            </div>

            {appsRecherche.length === 0 && (
              <p style={{ color: "#fff", textAlign: "center", marginTop: 24, textShadow: "0 1px 8px rgba(0,0,0,.3)" }}>
                {q ? "Aucune application ne correspond à votre recherche." : "Aucune application disponible pour votre profil pour le moment."}
              </p>
            )}

            {FAMILLES.map((fam) => {
              const apps = parFamille(fam.code);
              if (apps.length === 0) return null;
              return (
                <div key={fam.code} style={{ marginTop: 34 }}>
                  <h2 style={titreFamille}><span style={traitBlanc} />{fam.libelle}</h2>
                  <div style={grid}>
                    {apps.map((a) => (
                      <div key={a.cle} onClick={() => ouvrirApp(a)}
                        onMouseEnter={() => setHover(a.cle)} onMouseLeave={() => setHover(null)}
                        style={{ ...appCard, transform: hover === a.cle ? "scale(1.08) translateY(-4px)" : "none" }}>
                        <div style={squircle}>
                          <span style={{ position: "relative", zIndex: 1 }}>{a.icone}</span>
                          <span style={squircleGloss} />
                        </div>
                        <div style={appLabel}>{a.titre}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <p style={pied}>Alexandre FAMARE © 2026</p>
            <div style={{ height: 120 }} />
          </div>
        )}

        {/* DOCK */}
        {!chargement && appsDock.length > 0 && (
          <div style={dockWrap}>
            <div style={dock} onMouseLeave={() => setDockHover(null)}>
              {appsDock.map((a, i) => {
                const s = scaleDock(i);
                return (
                  <div key={a.cle} style={dockItem}
                    onMouseEnter={() => setDockHover(i)}
                    onClick={() => ouvrirApp(a)}>
                    {dockHover === i && <div style={dockTooltip}>{a.titre}</div>}
                    <div style={{ ...dockIcon, transform: `scale(${s}) translateY(${s > 1 ? -(s - 1) * 22 : 0}px)` }}>
                      <span style={{ position: "relative", zIndex: 1 }}>{a.icone}</span>
                      <span style={squircleGloss} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function libelleRole(role: string): string {
  return ({
    salarie: "Salarié", secretaire: "Secrétaire", benevole: "Bénévole",
    comptable: "Comptable CPAE", cpae: "Membre CPAE", cure: "Curé",
    vicaire: "Vicaire", diacre: "Diacre", admin: "Administrateur", invite: "Invité",
  } as any)[role] ?? role;
}

const pageWrap: React.CSSProperties = { position: "relative", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#1d1d1f", WebkitFontSmoothing: "antialiased", overflow: "hidden" };
const wall: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 0,
  background: "radial-gradient(circle at 18% 20%, #7c5cff 0%, rgba(124,92,255,0) 42%), radial-gradient(circle at 82% 22%, #ff6fa8 0%, rgba(255,111,168,0) 45%), radial-gradient(circle at 78% 85%, #ffb15c 0%, rgba(255,177,92,0) 45%), radial-gradient(circle at 22% 82%, #2bc0e4 0%, rgba(43,192,228,0) 48%), linear-gradient(135deg, #5b53e8 0%, #8a4fd6 40%, #c44fc4 70%, #ff7eb3 100%)",
};
const menubar: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 18,
  height: 30, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#fff",
  background: "rgba(255,255,255,.18)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderBottom: "1px solid rgba(255,255,255,.18)",
};
const container: React.CSSProperties = { position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", padding: "40px 24px 60px", width: "100%", boxSizing: "border-box" };
const hero: React.CSSProperties = { textAlign: "center", color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,.25)" };
const panel: React.CSSProperties = {
  margin: "26px auto 0", maxWidth: 560,
  background: "rgba(255,255,255,.22)", backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.35)", borderRadius: 22, padding: 14,
  boxShadow: "0 12px 40px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.5)",
};
const userRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, color: "#fff", fontSize: 13, padding: "4px 8px 12px" };
const avatar: React.CSSProperties = { width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: "1px solid rgba(255,255,255,.4)", flexShrink: 0 };
const logout: React.CSSProperties = { marginLeft: "auto", color: "#fff", opacity: 0.85, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontFamily: "inherit", flexShrink: 0 };
const search: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: 14, background: "rgba(255,255,255,.3)", color: "#fff", fontSize: 14.5, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "box-shadow .2s, border .2s" };
const titreFamille: React.CSSProperties = { color: "#fff", fontSize: 14, fontWeight: 600, letterSpacing: ".4px", marginBottom: 16, textShadow: "0 1px 8px rgba(0,0,0,.2)", display: "flex", alignItems: "center", gap: 9, opacity: 0.96 };
const traitBlanc: React.CSSProperties = { width: 16, height: 3, borderRadius: 2, background: "rgba(255,255,255,.85)", display: "inline-block" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 22 };
const appCard: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", transition: "transform .2s cubic-bezier(.2,.8,.2,1)" };
const squircle: React.CSSProperties = {
  width: 84, height: 84, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42,
  background: "linear-gradient(160deg, rgba(255,255,255,.95), rgba(235,240,255,.78))",
  boxShadow: "0 10px 24px rgba(0,0,0,.22), inset 0 2px 2px rgba(255,255,255,.95), inset 0 -3px 8px rgba(150,160,200,.3)",
  border: ".5px solid rgba(255,255,255,.7)", position: "relative", overflow: "hidden",
};
const squircleGloss: React.CSSProperties = { position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,.55), transparent)", borderRadius: "24px 24px 50% 50%" };
const appLabel: React.CSSProperties = { color: "#fff", fontSize: 13, fontWeight: 500, textAlign: "center", textShadow: "0 1px 6px rgba(0,0,0,.35)", lineHeight: 1.25 };
const pied: React.CSSProperties = { textAlign: "center", padding: "40px 14px 0", fontSize: 12, color: "rgba(255,255,255,.8)", textShadow: "0 1px 6px rgba(0,0,0,.25)" };

const dockWrap: React.CSSProperties = { position: "fixed", left: 0, right: 0, bottom: 16, zIndex: 20, display: "flex", justifyContent: "center", pointerEvents: "none" };
const dock: React.CSSProperties = {
  display: "flex", alignItems: "flex-end", gap: 10, padding: "10px 14px", borderRadius: 24, pointerEvents: "auto",
  background: "rgba(255,255,255,.25)", backdropFilter: "blur(30px) saturate(180%)", WebkitBackdropFilter: "blur(30px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.4)", boxShadow: "0 16px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.55)",
};
const dockItem: React.CSSProperties = { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" };
const dockIcon: React.CSSProperties = {
  width: 52, height: 52, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27,
  background: "linear-gradient(160deg, rgba(255,255,255,.95), rgba(235,240,255,.78))",
  boxShadow: "0 6px 16px rgba(0,0,0,.22), inset 0 2px 2px rgba(255,255,255,.95), inset 0 -3px 8px rgba(150,160,200,.3)",
  border: ".5px solid rgba(255,255,255,.7)", position: "relative", overflow: "hidden",
  transition: "transform .18s cubic-bezier(.2,.8,.2,1)", transformOrigin: "bottom center",
};
const dockTooltip: React.CSSProperties = {
  position: "absolute", bottom: "calc(100% + 14px)", left: "50%", transform: "translateX(-50%)",
  background: "rgba(0,0,0,.72)", color: "#fff", fontSize: 12, fontWeight: 500, padding: "5px 10px", borderRadius: 8,
  whiteSpace: "nowrap", pointerEvents: "none", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
};
