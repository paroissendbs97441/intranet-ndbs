// app/admin/suivi-rh/page.tsx — Suivi RH des salariés — fenêtre d'app macOS Liquid Glass
"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getSupabase } from "../../../lib/supabaseClient";

const ROLES_OK = ["admin", "comptable"];

export default function SuiviRH() {
  const [token, setToken] = useState("");
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [annees, setAnnees] = useState<number[]>([]);
  const [annee, setAnnee] = useState<number>(new Date().getFullYear());
  const [salaries, setSalaries] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [ouvertHist, setOuvertHist] = useState(false);
  const [horloge, setHorloge] = useState("");
  const [hoverNav, setHoverNav] = useState<string | null>(null);

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
      if (!ROLES_OK.some((r) => roles.includes(r))) { setAutorise(false); return; }
      setAutorise(true);
      const ra = await fetch("/api/admin-suivi-rh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "annees", access_token: tk }) }).then(r => r.json());
      if (ra.ok && ra.annees.length) { setAnnees(ra.annees); setAnnee(ra.annees[0]); charger(tk, ra.annees[0]); }
      else { setAnnees([new Date().getFullYear()]); charger(tk, new Date().getFullYear()); }
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

  async function charger(tk: string, an: number) {
    setChargement(true);
    const r = await fetch("/api/admin-suivi-rh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suivi", access_token: tk, annee: an }) }).then(r => r.json());
    setChargement(false);
    if (r.ok) {
      setSalaries(r.salaries);
      setSelId(r.salaries.length ? r.salaries[0].id : null);
      setOuvertHist(false);
    }
  }

  function changerAnnee(an: number) { setAnnee(an); charger(token, an); }
  function choisir(id: string) { setSelId(id); setOuvertHist(false); }

  const num = (n: number) => (Math.round(n * 100) / 100).toString().replace(".", ",");
  const frDate = (s: string) => s ? s.split("-").reverse().join("/") : "";
  const initiale = (nom: string) => (nom || "?").trim().charAt(0).toUpperCase();
  const badgeStatut = (st: string) => {
    const map: any = {
      validee: { t: "Validée", bg: "rgba(52,168,108,.16)", c: "#1b6b44", bd: "rgba(52,168,108,.4)" },
      en_attente: { t: "En attente", bg: "rgba(214,158,46,.18)", c: "#8a5a08", bd: "rgba(214,158,46,.42)" },
    };
    const x = map[st] ?? { t: st, bg: "rgba(120,120,128,.16)", c: "#4b4b52", bd: "rgba(120,120,128,.34)" };
    return <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: x.bg, color: x.c, border: `1px solid ${x.bd}`, fontWeight: 600, whiteSpace: "nowrap" }}>{x.t}</span>;
  };
  const moment = (m: string) => m === "matin" ? " (matin)" : m === "apres-midi" ? " (après-midi)" : "";

  const sel = salaries.find((s) => s.id === selId) || null;

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
            <p style={{ color: "#555", fontSize: 14, margin: "0 0 18px" }}>Réservé aux administrateurs et à la comptable CPAE.</p>
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
            <img src="/logo.png" alt="" style={{ height: 17, width: 17, objectFit: "contain" }} /> Suivi RH
          </span>
          <span style={{ marginLeft: "auto", fontWeight: 500, opacity: 0.9 }}>{horloge}</span>
        </div>

        {/* Fenêtre d'application macOS */}
        <div style={fenetreWrap}>
          <div style={fenetre}>
            {/* Title bar : feux + titre + toolbar */}
            <div style={titleBar}>
              <span style={feux}>
                <i style={{ ...feu, background: "#ff5f57" }} /><i style={{ ...feu, background: "#febc2e" }} /><i style={{ ...feu, background: "#28c840" }} />
              </span>
              <span style={titreFenetre}>Suivi RH des salariés — {annee}</span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <select style={selectGlass} value={annee} onChange={(e) => changerAnnee(Number(e.target.value))}>
                  {annees.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </span>
            </div>

            {/* Corps : sidebar + contenu */}
            <div style={corps}>
              {/* Sidebar salariés */}
              <aside style={sidebar}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8a92", textTransform: "uppercase", letterSpacing: ".5px", padding: "4px 10px 8px" }}>Salariés</div>
                {chargement && <div style={{ padding: "8px 10px", color: "#999", fontSize: 13 }}>Chargement…</div>}
                {!chargement && salaries.length === 0 && <div style={{ padding: "8px 10px", color: "#999", fontSize: 13 }}>Aucun salarié.</div>}
                {!chargement && salaries.map((s) => {
                  const actif = s.id === selId;
                  return (
                    <div key={s.id} onClick={() => choisir(s.id)}
                      onMouseEnter={() => setHoverNav(s.id)} onMouseLeave={() => setHoverNav(null)}
                      style={{ ...navItem, background: actif ? "rgba(80,120,220,.85)" : hoverNav === s.id ? "rgba(120,140,190,.16)" : "transparent", color: actif ? "#fff" : "#2a2a30" }}>
                      <span style={{ ...navAvatar, background: actif ? "rgba(255,255,255,.28)" : "linear-gradient(160deg,rgba(255,255,255,.9),rgba(214,222,240,.85))", color: actif ? "#fff" : "#3a4a6b" }}>{initiale(s.nom_complet)}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, display: "block", lineHeight: 1.2 }}>{s.nom_complet}</span>
                        {s.poste && <span style={{ fontSize: 11.5, opacity: actif ? 0.85 : 0.6 }}>{s.poste}</span>}
                      </span>
                    </div>
                  );
                })}
              </aside>

              {/* Contenu principal */}
              <main style={contenu}>
                {!sel ? (
                  <div style={{ color: "#999", fontSize: 14, padding: 30, textAlign: "center" }}>Sélectionnez un salarié dans la liste.</div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
                      <span style={avatarGros}>{initiale(sel.nom_complet)}</span>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#1d1d1f" }}>{sel.nom_complet}</h2>
                        {sel.poste && <span style={{ color: "#7a7a82", fontSize: 13.5 }}>{sel.poste}</span>}
                      </div>
                    </div>

                    {sel.lignes.length === 0 ? (
                      <p style={{ color: "#999", fontSize: 14 }}>Aucun solde ni congé pour cette année.</p>
                    ) : (
                      <>
                        {/* Cartes-stats récap */}
                        <div style={statsGrid}>
                          {sel.lignes.map((l: any) => (
                            <div key={l.type_conge_id} style={statCard}>
                              <div style={{ fontSize: 12.5, color: "#5a5a62", fontWeight: 600, marginBottom: 8 }}>{l.type_libelle}</div>
                              <div style={{ fontSize: 26, fontWeight: 700, color: l.restant < 0 ? "#b3261e" : "#1b6b44", lineHeight: 1 }}>{num(l.restant)}<span style={{ fontSize: 13, fontWeight: 500, color: "#8a8a92" }}> j restants</span></div>
                              <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 12, color: "#5a5a62" }}>
                                <span>Acquis <b style={{ color: "#2a2a30" }}>{num(l.acquis)}</b></span>
                                <span>Pris <b style={{ color: "#9a5b0e" }}>{num(l.pris)}</b></span>
                                {l.enAttente > 0 && <span>Attente <b style={{ color: "#8a5a08" }}>{num(l.enAttente)}</b></span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: "#9a9aa2", marginTop: 10 }}>Restant = Acquis - Pris (les demandes en attente ne sont pas encore déduites).</p>
                      </>
                    )}

                    {/* Historique repliable */}
                    <button style={{ ...lienBtn, marginTop: 18 }} onClick={() => setOuvertHist(!ouvertHist)}>
                      {ouvertHist ? "▲ Masquer" : "▼ Voir"} l'historique des demandes ({sel.historique.length})
                    </button>
                    {ouvertHist && (
                      <div style={{ marginTop: 12, background: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.65)", borderRadius: 14, padding: 14 }}>
                        {sel.historique.length === 0 && <p style={{ color: "#999", fontSize: 13, margin: 0 }}>Aucune demande cette année.</p>}
                        {sel.historique.map((d: any) => (
                          <div key={d.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(60,60,67,.08)", fontSize: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <div style={{ color: "#3a3a40" }}>
                                <b style={{ color: "#1d1d1f" }}>{d.type_libelle}</b> · {frDate(d.date_debut)}{moment(d.moment_debut)} → {frDate(d.date_fin)}{moment(d.moment_fin)}
                                <span style={{ color: "#5a5a62" }}> · {num(d.nb_jours)} j</span>
                                {d.motif && <span style={{ color: "#9a9aa2" }}> — {d.motif}</span>}
                              </div>
                              {badgeStatut(d.statut)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </main>
            </div>
          </div>

          {/* Fil d'ariane sous la fenêtre */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <a href="/" style={pilule}>⌂ Intranet</a>
            <a href="/admin" style={pilule}>← Administration</a>
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
  background: "radial-gradient(circle at 15% 18%, #cdd9ee 0%, rgba(205,217,238,0) 45%), radial-gradient(circle at 85% 12%, #e3d8ee 0%, rgba(227,216,238,0) 48%), radial-gradient(circle at 80% 88%, #d4e4e2 0%, rgba(212,228,226,0) 46%), linear-gradient(160deg, #e9edf5 0%, #dfe6f0 55%, #d6dfec 100%)",
};
const menubar: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 18,
  height: 28, padding: "0 16px", fontSize: 12.5, fontWeight: 500, color: "#2a2a30",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderBottom: "1px solid rgba(255,255,255,.55)",
};
const fenetreWrap: React.CSSProperties = { position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "30px 20px 50px", width: "100%", boxSizing: "border-box" };
const fenetre: React.CSSProperties = {
  borderRadius: 16, overflow: "hidden",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.6)",
  boxShadow: "0 30px 80px rgba(40,50,90,.28), 0 4px 14px rgba(40,50,90,.14), inset 0 1px 0 rgba(255,255,255,.7)",
};
const titleBar: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 14, height: 46, padding: "0 16px",
  background: "rgba(255,255,255,.4)", borderBottom: "1px solid rgba(60,60,67,.1)",
};
const feux: React.CSSProperties = { display: "flex", gap: 8, flexShrink: 0 };
const feu: React.CSSProperties = { width: 12, height: 12, borderRadius: "50%", display: "inline-block", boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.12)" };
const titreFenetre: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "#3a3a40", whiteSpace: "nowrap" };
const corps: React.CSSProperties = { display: "flex", minHeight: 460 };
const sidebar: React.CSSProperties = {
  width: 230, flexShrink: 0, padding: 8, borderRight: "1px solid rgba(60,60,67,.1)",
  background: "rgba(245,247,251,.45)", display: "flex", flexDirection: "column", gap: 2,
};
const navItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", transition: "background .15s" };
const navAvatar: React.CSSProperties = { width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, border: "1px solid rgba(255,255,255,.6)" };
const contenu: React.CSSProperties = { flex: 1, padding: "24px 26px", minWidth: 0, background: "rgba(255,255,255,.3)" };
const avatarGros: React.CSSProperties = {
  width: 50, height: 50, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: 700, fontSize: 20, color: "#3a4a6b",
  background: "linear-gradient(160deg, rgba(255,255,255,.92), rgba(214,222,240,.85))",
  border: "1px solid rgba(255,255,255,.8)", boxShadow: "inset 0 1px 2px rgba(255,255,255,.9)",
};
const statsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 };
const statCard: React.CSSProperties = {
  background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.7)", borderRadius: 16, padding: "16px 18px",
  boxShadow: "0 6px 20px rgba(60,70,110,.1), inset 0 1px 0 rgba(255,255,255,.7)",
};
const pilule: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#2f3a52", fontSize: 13, fontWeight: 500,
  padding: "7px 14px", borderRadius: 999, background: "rgba(255,255,255,.55)",
  backdropFilter: "blur(18px) saturate(180%)", WebkitBackdropFilter: "blur(18px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 4px 14px rgba(60,70,110,.1)",
};
const lienBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", color: "#2f3a52", fontSize: 13, fontWeight: 600, cursor: "pointer",
  padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,.7)", fontFamily: "inherit",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
};
const selectGlass: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,.7)", fontSize: 13, color: "#1d1d1f",
  background: "rgba(255,255,255,.65)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", fontFamily: "inherit", cursor: "pointer", outline: "none",
};
const pied: React.CSSProperties = { textAlign: "center", padding: "20px 14px 0", fontSize: 12, color: "#8a8a92" };
