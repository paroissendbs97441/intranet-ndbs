// app/admin/suivi-rh/page.tsx — Suivi RH des salariés (soldes + historique)
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

  async function charger(tk: string, an: number) {
    setChargement(true);
    const r = await fetch("/api/admin-suivi-rh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suivi", access_token: tk, annee: an }) }).then(r => r.json());
    setChargement(false);
    if (r.ok) setSalaries(r.salaries);
  }

  function changerAnnee(an: number) { setAnnee(an); setOuvert(null); charger(token, an); }

  if (autorise === null) return <p style={{ padding: 40 }}>Chargement…</p>;
  if (autorise === false) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Accès refusé</h1>
      <p>Cette page est réservée aux administrateurs et à la comptable CPAE.</p>
      <a href="/" style={{ color: "#2563eb" }}>← Retour à l'intranet</a>
    </div>
  );

  const num = (n: number) => (Math.round(n * 100) / 100).toString().replace(".", ",");
  const frDate = (s: string) => s ? s.split("-").reverse().join("/") : "";
  const badgeStatut = (st: string) => {
    const map: any = {
      validee: { t: "Validée", bg: "#dcfce7", c: "#15803d" },
      en_attente: { t: "En attente", bg: "#fef3c7", c: "#92400e" },
    };
    const x = map[st] ?? { t: st, bg: "#eee", c: "#555" };
    return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: x.bg, color: x.c }}>{x.t}</span>;
  };
  const moment = (m: string) => m === "matin" ? " (matin)" : m === "apres-midi" ? " (après-midi)" : "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f4f6" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, width: "100%", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{ fontSize: 20 }}>Suivi RH des salariés<br />
            <span style={{ fontSize: 14, color: "#555" }}>Soldes de congés et historique des demandes</span></h1>
          <img src="/logo.png" alt="Logo" style={{ height: 60 }} />
        </div>
        <div style={{ margin: "8px 0" }}>
          <a href="/" style={{ ...lien, textDecoration: "none", marginRight: 14 }}>⌂ Intranet</a>
          <a href="/admin" style={{ ...lien, textDecoration: "none" }}>← Administration</a>
        </div>

        <div style={carte}>
          <label style={{ fontSize: 13, color: "#555", fontWeight: 600, marginRight: 8 }}>Année</label>
          <select style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc" }} value={annee} onChange={(e) => changerAnnee(Number(e.target.value))}>
            {annees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {chargement && <div style={carte}><p style={{ color: "#777" }}>Chargement…</p></div>}
        {!chargement && salaries.length === 0 && <div style={carte}><p style={{ color: "#777" }}>Aucun salarié trouvé.</p></div>}

        {!chargement && salaries.map((s) => (
          <div key={s.id} style={carte}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ fontSize: 16 }}>{s.nom_complet}</b>
                {s.poste && <span style={{ color: "#777", fontSize: 13 }}> — {s.poste}</span>}
              </div>
            </div>

            {s.lignes.length === 0 ? (
              <p style={{ color: "#999", fontSize: 13, margin: "8px 0 0" }}>Aucun solde ni congé pour cette année.</p>
            ) : (
              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#eff6ff", textAlign: "left" }}>
                      <th style={th}>Catégorie</th>
                      <th style={{ ...th, textAlign: "right" }}>Acquis</th>
                      <th style={{ ...th, textAlign: "right" }}>Pris</th>
                      <th style={{ ...th, textAlign: "right" }}>Restant</th>
                      <th style={{ ...th, textAlign: "right" }}>En attente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.lignes.map((l: any) => (
                      <tr key={l.type_conge_id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={td}>{l.type_libelle}</td>
                        <td style={{ ...td, textAlign: "right" }}>{num(l.acquis)}</td>
                        <td style={{ ...td, textAlign: "right", color: "#b45309" }}>{num(l.pris)}</td>
                        <td style={{ ...td, textAlign: "right", fontWeight: 700, color: l.restant < 0 ? "#b91c1c" : "#15803d" }}>{num(l.restant)}</td>
                        <td style={{ ...td, textAlign: "right", color: "#92400e" }}>{l.enAttente > 0 ? num(l.enAttente) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Restant = Acquis − Pris (les demandes en attente ne sont pas encore déduites).</p>
              </div>
            )}

            <button style={{ ...lien, marginTop: 10, fontSize: 13 }} onClick={() => setOuvert(ouvert === s.id ? null : s.id)}>
              {ouvert === s.id ? "▲ Masquer" : "▼ Voir"} l'historique des demandes ({s.historique.length})
            </button>
            {ouvert === s.id && (
              <div style={{ marginTop: 8, background: "#fafafa", borderRadius: 8, padding: 10 }}>
                {s.historique.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Aucune demande cette année.</p>}
                {s.historique.map((d: any) => (
                  <div key={d.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <b>{d.type_libelle}</b> · {frDate(d.date_debut)}{moment(d.moment_debut)} → {frDate(d.date_fin)}{moment(d.moment_fin)}
                        <span style={{ color: "#555" }}> · {num(d.nb_jours)} j</span>
                        {d.motif && <span style={{ color: "#999" }}> — {d.motif}</span>}
                      </div>
                      {badgeStatut(d.statut)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <footer style={{ textAlign: "center", padding: 14, fontSize: 12, color: "#999" }}>Alexandre FAMARE © 2026</footer>
    </div>
  );
}

const carte: React.CSSProperties = { background: "#fff", padding: 18, borderRadius: 12, margin: "12px 0", boxShadow: "0 1px 4px rgba(0,0,0,.08)" };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14, padding: 0 };
const th: React.CSSProperties = { padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "#334155" };
const td: React.CSSProperties = { padding: "8px 10px" };
