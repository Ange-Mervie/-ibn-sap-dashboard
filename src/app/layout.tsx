import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBN SAP Dashboard : Suivi des incidents",
  description:
    "Tableau de bord de suivi et d'analyse des incidents SAP  D'IBN GROUP SARL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
