// app/login/page.tsx
"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { getSupabase } from "../../lib/supabaseClient";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"login" | "oubli" | "assist">("login");
  const [msgOubli, setMsgOubli] = useState("");
  const [assist, setAssist] = useState({ nom: "", email: "", objet: "", message: "" });
  const [msgAssist, setMsgAssist] = useState("");
  const [focusField, setFocusField] = useState("");

  async function seConnecter() {
    setMsg("");
    const { error } = await getSupabase().auth.signInWithPassword({ email, password: mdp });
    if (error) setMsg("Identifiants incorrects.");
    else window.location.href = "/";
  }

  async function envoyerReinit() {
    setMsgOubli("");
    if (!email.trim()) { setMsgOubli("Saisissez votre email d'abord."); return; }
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${BASE_URL}/nouveau-mot-de-passe`,
    });
    if (error) setMsgOubli("Erreur : " + error.message);
    else setMsgOubli("Si cet email existe, un lien de réinitialisation vient d'être envoyé. Pensez à vérifier vos spams.");
  }

  async function envoyerAssist() {
    setMsgAssist("");
    if (!assist.nom.trim() || !assist.email.trim() || !assist.objet.trim() || !assist.message.trim()) {
      setMsgAssist("Merci de remplir tous les champs."); return;
    }
    const res = await fetch("/api/assistance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assist),
    });
    const j = await res.json();
    if (j.ok) { setMsgAssist("Message envoyé ✅"); setAssist({ nom: "", email: "", objet: "", message: "" }); }
    else setMsgAssist("Erreur : " + j.error);
  }

  const champ = (nom: string): React.CSSProperties => ({
    ...input,
    border: focusField === nom ? "1px solid #2563eb" : "1px solid #d1d5db",
    boxShadow: focusField === nom ? "0 0 0 3px rgba(37,99,235,.15)" : "none",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
      {/* Bandeau bleu marine avec logo */}
      <div style={bandeau}>
        <img src="/logo.png" alt="Logo paroisse" style={{ height: 110, flexShrink: 0 }} />
        <span style={titreBandeau}>Paroisse Notre-Dame du Bon Secours<br />
          <span style={{ fontWeight: 400, fontSize: 18, opacity: 0.9 }}>Diocèse de La Réunion</span>
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={card}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, textAlign: "center" }}>Intranet paroissial</h1>
          <div style={{ width: 48, height: 3, background: "#1e3a5f", borderRadius: 2, margin: "12px auto 20px" }} />

          {mode === "login" && (
            <>
              <p style={sousTitre}>Connectez-vous avec votre email et votre mot de passe.</p>
              <input style={champ("email")} placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusField("email")} onBlur={() => setFocusField("")}
                onKeyDown={(e) => { if (e.key === "Enter") seConnecter(); }} />
              <input style={champ("mdp")} type="password" placeholder="Mot de passe" value={mdp}
                onChange={(e) => setMdp(e.target.value)}
                onFocus={() => setFocusField("mdp")} onBlur={() => setFocusField("")}
                onKeyDown={(e) => { if (e.key === "Enter") seConnecter(); }} />
              <button style={btn} onClick={seConnecter}>Se connecter</button>
              {msg && <p style={{ color: "#dc2626", fontSize: 14, textAlign: "center", marginTop: 12 }}>{msg}</p>}
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button style={lien} onClick={() => { setMode("oubli"); setMsgOubli(""); }}>Mot de passe oublié ?</button>
                <span style={{ color: "#cbd5e1", margin: "0 8px" }}>·</span>
                <button style={lien} onClick={() => { setMode("assist"); setMsgAssist(""); }}>Besoin d'aide ?</button>
              </div>
            </>
          )}

          {mode === "oubli" && (
            <>
              <p style={sousTitre}>Saisissez votre email pour recevoir un lien de réinitialisation.</p>
              <input style={champ("email")} placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusField("email")} onBlur={() => setFocusField("")}
                onKeyDown={(e) => { if (e.key === "Enter") envoyerReinit(); }} />
              <button style={btn} onClick={envoyerReinit}>Envoyer le lien</button>
              {msgOubli && <p style={{ color: "#16a34a", fontSize: 14, textAlign: "center", marginTop: 12 }}>{msgOubli}</p>}
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button style={lien} onClick={() => { setMode("login"); setMsg(""); }}>← Retour à la connexion</button>
              </div>
            </>
          )}

          {mode === "assist" && (
            <>
              <p style={sousTitre}>Décrivez votre problème, l'assistance vous répondra.</p>
              <input style={champ("an")} placeholder="Votre nom" value={assist.nom}
                onChange={(e) => setAssist({ ...assist, nom: e.target.value })}
                onFocus={() => setFocusField("an")} onBlur={() => setFocusField("")} />
              <input style={champ("ae")} placeholder="Votre email" value={assist.email}
                onChange={(e) => setAssist({ ...assist, email: e.target.value })}
                onFocus={() => setFocusField("ae")} onBlur={() => setFocusField("")} />
              <input style={champ("ao")} placeholder="Objet" value={assist.objet}
                onChange={(e) => setAssist({ ...assist, objet: e.target.value })}
                onFocus={() => setFocusField("ao")} onBlur={() => setFocusField("")} />
              <textarea style={{ ...champ("am"), minHeight: 90, resize: "vertical" }} placeholder="Votre message" value={assist.message}
                onChange={(e) => setAssist({ ...assist, message: e.target.value })}
                onFocus={() => setFocusField("am")} onBlur={() => setFocusField("")} />
              <button style={btn} onClick={envoyerAssist}>Envoyer le message</button>
              {msgAssist && <p style={{ fontSize: 14, textAlign: "center", marginTop: 12, color: msgAssist.startsWith("Erreur") ? "#dc2626" : "#16a34a" }}>{msgAssist}</p>}
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button style={lien} onClick={() => { setMode("login"); setMsgAssist(""); }}>← Retour à la connexion</button>
              </div>
            </>
          )}
        </div>
      </div>
      <footer style={pied}>Alexandre FAMARE © 2026</footer>
    </div>
  );
}

const bandeau: React.CSSProperties = {
  background: "#1e3a5f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  gap: 20, padding: "20px 24px", textAlign: "center", flexWrap: "wrap",
};
const titreBandeau: React.CSSProperties = { fontSize: 26, fontWeight: 700, lineHeight: 1.25, letterSpacing: 0.3 };
const card: React.CSSProperties = {
  width: "100%", maxWidth: 400, background: "#fff", padding: 36, borderRadius: 16,
  boxShadow: "0 10px 30px rgba(15,23,42,.08), 0 1px 3px rgba(15,23,42,.06)",
};
const sousTitre: React.CSSProperties = { color: "#64748b", fontSize: 14, textAlign: "center", marginBottom: 18 };
const input: React.CSSProperties = { display: "block", width: "100%", padding: "11px 12px", margin: "10px 0", borderRadius: 8, border: "1px solid #d1d5db", boxSizing: "border-box", fontSize: 15, outline: "none", transition: "box-shadow .15s, border-color .15s" };
const btn: React.CSSProperties = { width: "100%", padding: 12, background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 600, marginTop: 10, boxShadow: "0 1px 2px rgba(37,99,235,.4)" };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14, padding: 0 };
const pied: React.CSSProperties = { textAlign: "center", padding: 16, fontSize: 12, color: "#94a3b8" };
