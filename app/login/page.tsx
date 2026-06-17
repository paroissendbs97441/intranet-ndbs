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
    borderColor: focusField === nom ? "#1a2f54" : "#e2e8f0",
    boxShadow: focusField === nom ? "0 0 0 3px rgba(26,47,84,.12)" : "none",
  });

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={wrap}>
        {/* Panneau de marque */}
        <aside style={marque}>
          <div style={haloOr} />
          <div style={haloBleu} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 380, textAlign: "center" }}>
            <div style={medaillon}>
              <img src="/logo.png" alt="Logo paroisse" style={{ width: 120, height: 120, objectFit: "contain" }} />
            </div>
            <h1 style={titreMarque}>Paroisse Notre-Dame<br />du Bon Secours</h1>
            <div style={filet} />
            <div style={diocese}>Diocèse de La Réunion</div>
            <p style={verset}>« Venez à moi, vous tous qui peinez,<br />et je vous donnerai le repos. »</p>
          </div>
        </aside>

        {/* Panneau formulaire */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
            <div style={{ width: "100%", maxWidth: 380 }}>
              <div style={eyebrow}>Espace réservé</div>

              {mode === "login" && (
                <>
                  <h2 style={titreCarte}>Intranet paroissial</h2>
                  <p style={sous}>Connectez-vous avec votre email et votre mot de passe.</p>
                  <label style={lab}>Email</label>
                  <input style={champ("email")} type="email" placeholder="vous@exemple.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusField("email")} onBlur={() => setFocusField("")}
                    onKeyDown={(e) => { if (e.key === "Enter") seConnecter(); }} />
                  <label style={lab}>Mot de passe</label>
                  <input style={champ("mdp")} type="password" placeholder="••••••••••" value={mdp}
                    onChange={(e) => setMdp(e.target.value)}
                    onFocus={() => setFocusField("mdp")} onBlur={() => setFocusField("")}
                    onKeyDown={(e) => { if (e.key === "Enter") seConnecter(); }} />
                  <button style={bouton} onClick={seConnecter}>Se connecter</button>
                  {msg && <p style={erreur}>{msg}</p>}
                  <div style={liens}>
                    <button style={lien} onClick={() => { setMode("oubli"); setMsgOubli(""); }}>Mot de passe oublié ?</button>
                    <span style={sep}>·</span>
                    <button style={lien} onClick={() => { setMode("assist"); setMsgAssist(""); }}>Besoin d'aide ?</button>
                  </div>
                </>
              )}

              {mode === "oubli" && (
                <>
                  <h2 style={titreCarte}>Mot de passe oublié</h2>
                  <p style={sous}>Saisissez votre email pour recevoir un lien de réinitialisation.</p>
                  <label style={lab}>Email</label>
                  <input style={champ("email")} type="email" placeholder="vous@exemple.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusField("email")} onBlur={() => setFocusField("")}
                    onKeyDown={(e) => { if (e.key === "Enter") envoyerReinit(); }} />
                  <button style={bouton} onClick={envoyerReinit}>Envoyer le lien</button>
                  {msgOubli && <p style={{ ...erreur, color: "#16a34a" }}>{msgOubli}</p>}
                  <div style={liens}>
                    <button style={lien} onClick={() => { setMode("login"); setMsg(""); }}>← Retour à la connexion</button>
                  </div>
                </>
              )}

              {mode === "assist" && (
                <>
                  <h2 style={titreCarte}>Contacter l'assistance</h2>
                  <p style={sous}>Décrivez votre problème, l'assistance vous répondra.</p>
                  <label style={lab}>Votre nom</label>
                  <input style={champ("an")} value={assist.nom}
                    onChange={(e) => setAssist({ ...assist, nom: e.target.value })}
                    onFocus={() => setFocusField("an")} onBlur={() => setFocusField("")} />
                  <label style={lab}>Votre email</label>
                  <input style={champ("ae")} value={assist.email}
                    onChange={(e) => setAssist({ ...assist, email: e.target.value })}
                    onFocus={() => setFocusField("ae")} onBlur={() => setFocusField("")} />
                  <label style={lab}>Objet</label>
                  <input style={champ("ao")} value={assist.objet}
                    onChange={(e) => setAssist({ ...assist, objet: e.target.value })}
                    onFocus={() => setFocusField("ao")} onBlur={() => setFocusField("")} />
                  <label style={lab}>Votre message</label>
                  <textarea style={{ ...champ("am"), minHeight: 90, resize: "vertical" }} value={assist.message}
                    onChange={(e) => setAssist({ ...assist, message: e.target.value })}
                    onFocus={() => setFocusField("am")} onBlur={() => setFocusField("")} />
                  <button style={bouton} onClick={envoyerAssist}>Envoyer le message</button>
                  {msgAssist && <p style={{ ...erreur, color: msgAssist.startsWith("Erreur") ? "#dc2626" : "#16a34a" }}>{msgAssist}</p>}
                  <div style={liens}>
                    <button style={lien} onClick={() => { setMode("login"); setMsgAssist(""); }}>← Retour à la connexion</button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={pied}>Alexandre FAMARE © 2026</div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .ndbs-wrap { grid-template-columns: 1fr !important; }
          .ndbs-verset { display: none !important; }
        }
      `}</style>
    </>
  );
}

const wrap: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#0f172a" };
const marque: React.CSSProperties = {
  position: "relative", overflow: "hidden",
  background: "linear-gradient(155deg,#0c1830 0%,#13284c 55%,#1a3a5f 100%)",
  color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
  padding: "56px 48px", textAlign: "center",
};
const haloOr: React.CSSProperties = { position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(200,160,78,.22),transparent 65%)", top: -120, right: -140 };
const haloBleu: React.CSSProperties = { position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(120,160,220,.18),transparent 65%)", bottom: -120, left: -120 };
const medaillon: React.CSSProperties = { width: 150, height: 150, borderRadius: "50%", margin: "0 auto 28px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(200,160,78,.4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(255,255,255,.03), 0 20px 50px rgba(0,0,0,.35)" };
const titreMarque: React.CSSProperties = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 40, lineHeight: 1.12, letterSpacing: ".5px", margin: 0 };
const filet: React.CSSProperties = { width: 56, height: 2, background: "linear-gradient(90deg,transparent,#c8a04e,transparent)", margin: "20px auto" };
const diocese: React.CSSProperties = { fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: "#e3c878", fontWeight: 500 };
const verset: React.CSSProperties = { marginTop: 34, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 19, color: "rgba(255,255,255,.72)", lineHeight: 1.5 };
const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: 2.5, textTransform: "uppercase", color: "#b8862f", fontWeight: 600, marginBottom: 10 };
const titreCarte: React.CSSProperties = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 32, color: "#0f1f3a", lineHeight: 1.1, margin: "0 0 8px" };
const sous: React.CSSProperties = { color: "#64748b", fontSize: 14.5, marginBottom: 24 };
const lab: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#334155", margin: "16px 0 6px" };
const input: React.CSSProperties = { width: "100%", padding: "13px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 15, fontFamily: "inherit", background: "#fff", boxSizing: "border-box", outline: "none", transition: "border-color .15s, box-shadow .15s" };
const bouton: React.CSSProperties = { width: "100%", marginTop: 26, padding: 14, border: "none", borderRadius: 10, cursor: "pointer", background: "#0f1f3a", color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "inherit", letterSpacing: ".3px", boxShadow: "0 6px 18px rgba(15,31,58,.25)" };
const erreur: React.CSSProperties = { fontSize: 14, textAlign: "center", marginTop: 14, color: "#dc2626" };
const liens: React.CSSProperties = { textAlign: "center", marginTop: 22, fontSize: 14 };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#1a2f54", cursor: "pointer", fontSize: 14, padding: 0 };
const sep: React.CSSProperties = { color: "#cbd5e1", margin: "0 10px" };
const pied: React.CSSProperties = { textAlign: "center", fontSize: 12, color: "#94a3b8", padding: 18 };
