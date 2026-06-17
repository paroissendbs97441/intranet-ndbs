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
  const [hoverCta, setHoverCta] = useState(false);

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
    border: focusField === nom ? "1px solid rgba(255,255,255,.9)" : "1px solid rgba(255,255,255,.4)",
    background: focusField === nom ? "rgba(255,255,255,.32)" : "rgba(255,255,255,.25)",
    boxShadow: focusField === nom ? "0 0 0 4px rgba(255,255,255,.18)" : "none",
  });

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={pageWrap}>
        <div style={wall} className="ndbs-wall" />

        <div style={center}>
          <div style={windowGlass}>
            {/* Barre de titre macOS */}
            <div style={titlebar}>
              <span style={{ ...dot, background: "#ff5f57" }} />
              <span style={{ ...dot, background: "#febc2e" }} />
              <span style={{ ...dot, background: "#28c840" }} />
            </div>

            <div style={body}>
              <div style={badge}>
                <img src="/logo.png" alt="Logo paroisse" style={{ width: 84, height: 84, objectFit: "contain", position: "relative", zIndex: 1, borderRadius: 22 }} />
                <span style={badgeGloss} />
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
                  <button style={{ ...cta, transform: hoverCta ? "translateY(-1px)" : "none", boxShadow: hoverCta ? "0 12px 28px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.95)" : "0 8px 22px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.9)" }}
                    onMouseEnter={() => setHoverCta(true)} onMouseLeave={() => setHoverCta(false)}
                    onClick={seConnecter}>Se connecter</button>
                  {msg && <p style={erreur}>{msg}</p>}
                  <div style={links}>
                    <button style={lien} onClick={() => { setMode("oubli"); setMsgOubli(""); }}>Mot de passe oublié ?</button>
                    <span style={sep}>·</span>
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
                  {msgOubli && <p style={{ ...erreur, color: "#dcfce7" }}>{msgOubli}</p>}
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
                  <textarea style={{ ...champ("am"), minHeight: 84, resize: "vertical" }} placeholder="Votre message" value={assist.message}
                    onChange={(e) => setAssist({ ...assist, message: e.target.value })}
                    onFocus={() => setFocusField("am")} onBlur={() => setFocusField("")} />
                  <button style={cta} onClick={envoyerAssist}>Envoyer le message</button>
                  {msgAssist && <p style={{ ...erreur, color: msgAssist.startsWith("Erreur") ? "#fecaca" : "#dcfce7" }}>{msgAssist}</p>}
                  <div style={links}>
                    <button style={lien} onClick={() => { setMode("login"); setMsgAssist(""); }}>← Retour à la connexion</button>
                  </div>
                </>
              )}
            </div>
          </div>
          <p style={pied}>Alexandre FAMARE © 2026</p>
        </div>
      </div>

      <style>{`
        @keyframes ndbsDrift {
          0%   { transform: scale(1) translate(0,0); }
          50%  { transform: scale(1.08) translate(-2%, 1%); }
          100% { transform: scale(1) translate(0,0); }
        }
        .ndbs-wall { animation: ndbsDrift 22s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .ndbs-wall{ animation: none; } }
      `}</style>
    </>
  );
}

const pageWrap: React.CSSProperties = { position: "relative", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflow: "hidden", WebkitFontSmoothing: "antialiased" };
const wall: React.CSSProperties = {
  position: "fixed", inset: "-8%", zIndex: 0,
  background: "radial-gradient(circle at 18% 20%, #7c5cff 0%, rgba(124,92,255,0) 42%), radial-gradient(circle at 82% 22%, #ff6fa8 0%, rgba(255,111,168,0) 45%), radial-gradient(circle at 78% 85%, #ffb15c 0%, rgba(255,177,92,0) 45%), radial-gradient(circle at 22% 82%, #2bc0e4 0%, rgba(43,192,228,0) 48%), linear-gradient(135deg, #5b53e8 0%, #8a4fd6 40%, #c44fc4 70%, #ff7eb3 100%)",
};
const center: React.CSSProperties = { position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 };
const windowGlass: React.CSSProperties = {
  width: "100%", maxWidth: 400, borderRadius: 26, overflow: "hidden",
  background: "rgba(255,255,255,.22)", backdropFilter: "blur(34px) saturate(185%)", WebkitBackdropFilter: "blur(34px) saturate(185%)",
  border: "1px solid rgba(255,255,255,.4)", boxShadow: "0 30px 70px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.6)",
};
const titlebar: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "14px 16px" };
const dot: React.CSSProperties = { width: 12, height: 12, borderRadius: "50%", display: "inline-block" };
const body: React.CSSProperties = { padding: "14px 34px 38px", textAlign: "center", color: "#fff" };
const badge: React.CSSProperties = {
  width: 104, height: 104, borderRadius: 28, margin: "0 auto 20px",
  background: "linear-gradient(160deg, rgba(255,255,255,.9), rgba(235,240,255,.7))",
  border: "1px solid rgba(255,255,255,.8)", display: "flex", alignItems: "center", justifyContent: "center",
  overflow: "hidden", position: "relative", boxSizing: "border-box", padding: 4,
  boxShadow: "0 12px 28px rgba(0,0,0,.22), inset 0 2px 2px rgba(255,255,255,.95), inset 0 -3px 8px rgba(150,160,200,.3)",
};
const badgeGloss: React.CSSProperties = { position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg,rgba(255,255,255,.55),transparent)", borderRadius: "28px 28px 50% 50%" };
const titre: React.CSSProperties = { fontSize: 22, fontWeight: 700, letterSpacing: "-.3px", lineHeight: 1.2, margin: 0, textShadow: "0 1px 10px rgba(0,0,0,.2)" };
const diocese: React.CSSProperties = { fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,.92)", fontWeight: 600, marginTop: 8 };
const sous: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontSize: 14, margin: "16px 0 20px" };
const field: React.CSSProperties = {
  width: "100%", padding: "13px 16px", margin: "9px 0", borderRadius: 14, fontSize: 15, fontFamily: "inherit",
  color: "#fff", outline: "none", boxSizing: "border-box",
  background: "rgba(255,255,255,.25)", border: "1px solid rgba(255,255,255,.4)",
  transition: "border .2s, box-shadow .2s, background .2s",
};
const cta: React.CSSProperties = {
  width: "100%", marginTop: 18, padding: 14, borderRadius: 14, border: "none", cursor: "pointer",
  fontSize: 15, fontWeight: 600, fontFamily: "inherit", color: "#5b3fc4",
  background: "linear-gradient(180deg,#ffffff,#eef0ff)", boxShadow: "0 8px 22px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.9)",
  transition: "transform .12s, box-shadow .2s",
};
const erreur: React.CSSProperties = { fontSize: 14, marginTop: 14, color: "#fecaca", textShadow: "0 1px 6px rgba(0,0,0,.2)" };
const links: React.CSSProperties = { marginTop: 18, fontSize: 13, color: "#fff" };
const lien: React.CSSProperties = { background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, padding: 0, fontFamily: "inherit", opacity: 0.92 };
const sep: React.CSSProperties = { opacity: 0.5, margin: "0 9px" };
const pied: React.CSSProperties = { marginTop: 22, fontSize: 12, color: "rgba(255,255,255,.85)", textShadow: "0 1px 6px rgba(0,0,0,.25)" };
