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
    ...field,
    borderColor: focusField === nom ? "rgba(227,200,120,.8)" : "rgba(255,255,255,.22)",
    background: focusField === nom ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.12)",
    boxShadow: focusField === nom ? "0 0 0 4px rgba(227,200,120,.18)" : "none",
  });

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={page}>
        {/* Fond vivant (halos floutés) */}
        <div style={scene}>
          <div style={{ ...blob, width: 560, height: 560, background: "#1d3a6b", top: -140, left: -120 }} />
          <div style={{ ...blob, width: 500, height: 500, background: "#3a5ca0", bottom: -160, right: -100 }} />
          <div style={{ ...blob, width: 380, height: 380, background: "#c8a04e", opacity: 0.32, top: "40%", left: "55%" }} />
          <div style={{ ...blob, width: 300, height: 300, background: "#0e2a55", top: "55%", left: "8%" }} />
        </div>

        <div style={center}>
          <div style={glass}>
            <div style={badge}>
              <img src="/logo.png" alt="Logo paroisse" style={{ width: 74, height: 74, objectFit: "contain" }} />
            </div>
            <h1 style={titre}>Paroisse Notre-Dame<br />du Bon Secours</h1>
            <div style={diocese}>Diocèse de La Réunion</div>

            {mode === "login" && (
              <>
                <p style={sous}>Connectez-vous à votre espace</p>
                <input style={champ("email")} type="email" placeholder="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")} onBlur={() => setFocusField("")}
                  onKeyDown={(e) => { if (e.key === "Enter") seConnecter(); }} />
                <input style={champ("mdp")} type="password" placeholder="Mot de passe" value={mdp}
                  onChange={(e) => setMdp(e.target.value)}
                  onFocus={() => setFocusField("mdp")} onBlur={() => setFocusField("")}
                  onKeyDown={(e) => { if (e.key === "Enter") seConnecter(); }} />
                <button style={cta} onClick={seConnecter}>Se connecter</button>
                {msg && <p style={erreur}>{msg}</p>}
                <div style={links}>
                  <button style={lien} onClick={() => { setMode("oubli"); setMsgOubli(""); }}>Mot de passe oublié ?</button>
                  <span style={dot}>·</span>
                  <button style={lien} onClick={() => { setMode("assist"); setMsgAssist(""); }}>Besoin d'aide ?</button>
                </div>
              </>
            )}

            {mode === "oubli" && (
              <>
                <p style={sous}>Réinitialiser votre mot de passe</p>
                <input style={champ("email")} type="email" placeholder="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")} onBlur={() => setFocusField("")}
                  onKeyDown={(e) => { if (e.key === "Enter") envoyerReinit(); }} />
                <button style={cta} onClick={envoyerReinit}>Envoyer le lien</button>
                {msgOubli && <p style={{ ...erreur, color: "#bff0c4" }}>{msgOubli}</p>}
                <div style={links}>
                  <button style={lien} onClick={() => { setMode("login"); setMsg(""); }}>← Retour à la connexion</button>
                </div>
              </>
            )}

            {mode === "assist" && (
              <>
                <p style={sous}>Contacter l'assistance</p>
                <input style={champ("an")} placeholder="Votre nom" value={assist.nom}
                  onChange={(e) => setAssist({ ...assist, nom: e.target.value })}
                  onFocus={() => setFocusField("an")} onBlur={() => setFocusField("")} />
                <input style={champ("ae")} placeholder="Votre email" value={assist.email}
                  onChange={(e) => setAssist({ ...assist, email: e.target.value })}
                  onFocus={() => setFocusField("ae")} onBlur={() => setFocusField("")} />
                <input style={champ("ao")} placeholder="Objet" value={assist.objet}
                  onChange={(e) => setAssist({ ...assist, objet: e.target.value })}
                  onFocus={() => setFocusField("ao")} onBlur={() => setFocusField("")} />
                <textarea style={{ ...champ("am"), minHeight: 88, resize: "vertical" }} placeholder="Votre message" value={assist.message}
                  onChange={(e) => setAssist({ ...assist, message: e.target.value })}
                  onFocus={() => setFocusField("am")} onBlur={() => setFocusField("")} />
                <button style={cta} onClick={envoyerAssist}>Envoyer le message</button>
                {msgAssist && <p style={{ ...erreur, color: msgAssist.startsWith("Erreur") ? "#ffc9c9" : "#bff0c4" }}>{msgAssist}</p>}
                <div style={links}>
                  <button style={lien} onClick={() => { setMode("login"); setMsgAssist(""); }}>← Retour à la connexion</button>
                </div>
              </>
            )}
          </div>
          <p style={pied}>Alexandre FAMARE © 2026</p>
        </div>
      </div>
    </>
  );
}

const page: React.CSSProperties = { position: "relative", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflow: "hidden" };
const scene: React.CSSProperties = { position: "fixed", inset: 0, background: "#0a1228", overflow: "hidden" };
const blob: React.CSSProperties = { position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.85 };
const center: React.CSSProperties = { position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 };
const glass: React.CSSProperties = {
  width: "100%", maxWidth: 400, padding: "40px 34px", borderRadius: 30, textAlign: "center", color: "#fff",
  background: "rgba(255,255,255,.10)",
  backdropFilter: "blur(30px) saturate(160%)", WebkitBackdropFilter: "blur(30px) saturate(160%)",
  border: "1px solid rgba(255,255,255,.22)",
  boxShadow: "0 20px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.35), inset 0 -1px 0 rgba(255,255,255,.05)",
};
const badge: React.CSSProperties = {
  width: 96, height: 96, borderRadius: 26, margin: "0 auto 22px",
  background: "rgba(255,255,255,.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 8px 24px rgba(0,0,0,.3)",
};
const titre: React.CSSProperties = { fontSize: 23, fontWeight: 700, letterSpacing: "-.3px", lineHeight: 1.2, margin: 0 };
const diocese: React.CSSProperties = { fontSize: 12.5, letterSpacing: 2, textTransform: "uppercase", color: "rgba(227,200,120,.95)", fontWeight: 600, marginTop: 8 };
const sous: React.CSSProperties = { color: "rgba(255,255,255,.7)", fontSize: 14, margin: "18px 0 22px" };
const field: React.CSSProperties = {
  width: "100%", padding: "14px 16px", margin: "9px 0", borderRadius: 14, fontSize: 15, fontFamily: "inherit",
  color: "#fff", outline: "none", border: "1px solid rgba(255,255,255,.22)", background: "rgba(255,255,255,.12)",
  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", boxSizing: "border-box",
  transition: "border-color .2s, box-shadow .2s, background .2s",
};
const cta: React.CSSProperties = {
  width: "100%", marginTop: 20, padding: 15, borderRadius: 14, border: "none", cursor: "pointer",
  fontSize: 15, fontWeight: 600, fontFamily: "inherit", color: "#0a1228",
  background: "linear-gradient(180deg,#f0d99a,#c8a04e)",
  boxShadow: "0 8px 22px rgba(200,160,78,.4), inset 0 1px 0 rgba(255,255,255,.5)",
};
const erreur: React.CSSProperties = { fontSize: 14, marginTop: 14, color: "#ffc9c9" };
const links: React.CSSProperties = { marginTop: 20, fontSize: 13.5 };
const lien: React.CSSProperties = { background: "none", border: "none", color: "rgba(255,255,255,.85)", cursor: "pointer", fontSize: 13.5, padding: 0, fontFamily: "inherit" };
const dot: React.CSSProperties = { color: "rgba(255,255,255,.4)", margin: "0 9px" };
const pied: React.CSSProperties = { marginTop: 22, fontSize: 12, color: "rgba(255,255,255,.5)" };
