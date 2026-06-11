// app/api/assistance/route.ts
import { NextResponse } from "next/server";
import { envoyerMail } from "../../../lib/mailer";

const GMAIL_PAROISSE = process.env.GMAIL_USER!;

export async function POST(req: Request) {
  try {
    const { nom, email, objet, message } = await req.json();

    if (!nom?.trim() || !email?.trim() || !objet?.trim() || !message?.trim()) {
      return NextResponse.json({ ok: false, error: "Tous les champs sont obligatoires" }, { status: 400 });
    }

    await envoyerMail({
      to: [GMAIL_PAROISSE],
      subject: `[Assistance Intranet] ${objet} — ${nom}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px">
          <h2>Demande d'assistance (Intranet)</h2>
          <p><b>De :</b> ${nom} (${email})</p>
          <p><b>Objet :</b> ${objet}</p>
          <hr/>
          <p style="white-space:pre-wrap">${message}</p>
        </div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
