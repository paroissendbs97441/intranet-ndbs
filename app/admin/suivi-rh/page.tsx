// app/admin/suivi-rh/page.tsx — Suivi RH des salariés (soldes + historique) — habillage macOS Liquid Glass
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
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [horloge, setHorloge] = useState("");
  const [hover, setHover] = useState<string | null>(null);

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
    if (r.ok) setSalaries(r.salaries);
  }

  function changerAnnee(an: number) { setAnnee(an); setOuvert(null); charger(token, an); }

  const num = (n: number) => (Math.round(n * 100) / 100).toString().replace(".", ",");
  const frDate = (s: string) => s ? s.split("-").reverse().join("/") : "";
  const badgeStatut = (st: string) => {
    const map: any = {
      validee: { t: "Validée", bg: "rgba(52,168,108,.16)", c: "#1b6b44", bd: "rgba(52,168,108,.35)" },
      en_attente: { t: "En attente", bg: "rgba(214,158,46,.18)", c: "#8a5a08", bd: "rgba(214,158,46,.38)" },
    };
    const x = map[st] ?? { t: st, bg: "rgba(120,120,128,.16)", c: "#4b4b52", bd: "rgba(120,120,128,.3)" };
    return <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: x.bg, color: x.c, border: `1px solid ${x.bd}`, fontWeight: 600, whiteSpace: "nowrap" }}>{x.t}</span>;
  };
  const moment = (m: string) => m === "matin" ? " (matin)" : m === "apres-midi" ? " (après-midi)" : "";

  // —— Écrans d'état (chargement / refus) habillés ——
  if (autorise === null) return (
    <div style={pageWrap}>
      <div style={wall} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingTop: 90, color: "#3a3a40", fontSize: 15 }}>Chargement…</div>
    </div>
  );
  if (autorise === false) return (
    <div style={pageWrap}>
      <div style={wall} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 460, margin: "0 auto", padding: "90px 24px" }}>
        <div style={{ ...carte, textAlign: "center" }}>
          <div style={{ fontSize: 38, marginBottom: 6 }}>🔒</div>
          <h1 style={{ fontSize: 20, margin: "0 0 6px", fontWeight: 700, color: "#1d1d1f" }}>Accès refusé</h1>
          <p style={{ color: "#555", fontSize: 14, margin: "0 0 16px" }}>Cette page est réservée aux administrateurs et à la comptable CPAE.</p>
          <a href="/" style={pilule}>← Retour à l'intranet</a>
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

        {/* Barre de menu macOS */}
        <div style={menubar}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <img src="/logo.png" alt="" style={{ height: 18, width: 18, objectFit: "contain" }} /> Paroisse NDBS
          </span>
          <span style={{ marginLeft: "auto", fontWeight: 500, opacity: 0.9 }}>{horloge}</span>
        </div>

        <div style={container}>
          {/* En-tête */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.5px", margin: 0, color: "#1d1d1f" }}>Suivi RH des salariés</h1>
              <p style={{ fontSize: 14.5, color: "#5a5a62", marginTop: 4 }}>Soldes de congés et historique des demandes</p>
            </div>
            <img src="/logo.png" alt="Logo" style={{ height: 58, flexShrink: 0 }} />
          </div>

          {/* Fil d'ariane */}
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <a href="/" style={pilule}>⌂ Intranet</a>
            <a href="/admin" style={pilule}>← Administration</a>
          </div>

          {/* Sélecteur d'année */}
          <div style={{ ...carte, display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontSize: 13.5, color: "#3a3a40", fontWeight: 600 }}>Année</label>
            <select style={selectGlass} value={annee} onChange={(e) => changerAnnee(Number(e.target.value))}>
              {annees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {chargement && <div style={carte}><p style={{ color: "#777", margin: 0 }}>Chargement…</p></div>}
          {!chargement && salaries.length === 0 && <div style={carte}><p style={{ color: "#777", margin: 0 }}>Aucun salarié trouvé.</p></div>}

          {!chargement && salaries.map((s) => (
            <div key={s.id} style={carte}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={avatar}>{(s.nom_complet || "?").trim().charAt(0).toUpperCase()}</span>
                  <div>
                    <b style={{ fontSize: 16, color: "#1d1d1f" }}>{s.nom_complet}</b>
                    {s.poste && <span style={{ color: "#7a7a82", fontSize: 13 }}> — {s.poste}</span>}
                  </div>
                </div>
              </div>

              {s.lignes.length === 0 ? (
                <p style={{ color: "#999", fontSize: 13, margin: "10px 0 0" }}>Aucun solde ni congé pour cette année.</p>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, borderRadius: "10px 0 0 10px", textAlign: "left" }}>Catégorie</th>
                        <th style={{ ...th, textAlign: "right" }}>Acquis</th>
                        <th style={{ ...th, textAlign: "right" }}>Pris</th>
                        <th style={{ ...th, textAlign: "right" }}>Restant</th>
                        <th style={{ ...th, borderRadius: "0 10px 10px 0", textAlign: "right" }}>En attente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.lignes.map((l: any) => (
                        <tr key={l.type_conge_id} style={{ borderBottom: "1px solid rgba(60,60,67,.08)" }}>
                          <td style={td}>{l.type_libelle}</td>
                          <td style={{ ...td, textAlign: "right" }}>{num(l.acquis)}</td>
                          <td style={{ ...td, textAlign: "right", color: "#9a5b0e" }}>{num(l.pris)}</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 700, color: l.restant < 0 ? "#b3261e" : "#1b6b44" }}>{num(l.restant)}</td>
                          <td style={{ ...td, textAlign: "right", color: "#8a5a08" }}>{l.enAttente > 0 ? num(l.enAttente) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ fontSize: 11, color: "#9a9aa2", marginTop: 6 }}>Restant = Acquis - Pris (les demandes en attente ne sont pas encore déduites).</p>
                </div>
              )}

              <button
                style={{ ...lienBtn, marginTop: 12, background: hover === s.id ? "rgba(120,130,170,.16)" : "rgba(120,130,170,.1)" }}
                onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
                onClick={() => setOuvert(ouvert === s.id ? null : s.id)}>
                {ouvert === s.id ? "▲ Masquer" : "▼ Voir"} l'historique des demandes ({s.historique.length})
              </button>

              {ouvert === s.id && (
                <div style={{ marginTop: 10, background: "rgba(255,255,255,.45)", border: "1px solid rgba(255,255,255,.6)", borderRadius: 14, padding: 12 }}>
                  {s.historique.length === 0 && <p style={{ color: "#999", fontSize: 13, margin: 0 }}>Aucune demande cette année.</p>}
                  {s.historique.map((d: any) => (
                    <div key={d.id} style={{ padding: "9px 0", borderBottom: "1px solid rgba(60,60,67,.08)", fontSize: 13 }}>
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
            </div>
          ))}

          <p style={pied}>Alexandre FAMARE © 2026</p>
        </div>
      </div>
    </>
  );
}

const pageWrap: React.CSSProperties = { position: "relative", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#1d1d1f", WebkitFontSmoothing: "antialiased" };
const wall: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 0,
  background: "linear-gradient(160deg, #eef1f7 0%, #e4e9f1 50%, #dbe2ee 100%)",
};
const menubar: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 18,
  height: 30, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#2a2a30",
  background: "rgba(255,255,255,.5)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderBottom: "1px solid rgba(255,255,255,.6)",
};
const container: React.CSSProperties = { position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "28px 20px 50px", width: "100%", boxSizing: "border-box" };
const carte: React.CSSProperties = {
  background: "rgba(255,255,255,.55)", backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.6)", borderRadius: 20, padding: 18, margin: "14px 0",
  boxShadow: "0 10px 34px rgba(60,70,110,.12), inset 0 1px 0 rgba(255,255,255,.7)",
};
const pilule: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#2f3a52", fontSize: 13, fontWeight: 500,
  padding: "7px 14px", borderRadius: 999, background: "rgba(255,255,255,.55)",
  backdropFilter: "blur(18px) saturate(180%)", WebkitBackdropFilter: "blur(18px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 4px 14px rgba(60,70,110,.1)",
};
const lienBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", color: "#2f3a52", fontSize: 13, fontWeight: 600, cursor: "pointer",
  padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.7)", fontFamily: "inherit",
  backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", transition: "background .18s",
};
const selectGlass: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.7)", fontSize: 13.5, color: "#1d1d1f",
  background: "rgba(255,255,255,.6)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", fontFamily: "inherit", cursor: "pointer", outline: "none",
};
const avatar: React.CSSProperties = {
  width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: 700, fontSize: 15, color: "#3a4a6b",
  background: "linear-gradient(160deg, rgba(255,255,255,.9), rgba(214,222,240,.8))",
  border: "1px solid rgba(255,255,255,.8)", boxShadow: "inset 0 1px 2px rgba(255,255,255,.9)",
};
const th: React.CSSProperties = { padding: "9px 12px", fontSize: 12, fontWeight: 700, color: "#3a4a6b", background: "rgba(120,135,180,.14)" };
const td: React.CSSProperties = { padding: "9px 12px", color: "#2a2a30" };
const pied: React.CSSProperties = { textAlign: "center", padding: "36px 14px 0", fontSize: 12, color: "#8a8a92" };
