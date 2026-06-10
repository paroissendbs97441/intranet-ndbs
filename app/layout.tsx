// app/layout.tsx
export const metadata = {
  title: "Intranet Paroisse Notre Dame du Bon Secours",
  description: "Portail des applications de la paroisse",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f3f4f6" }}>
        {children}
      </body>
    </html>
  );
}
