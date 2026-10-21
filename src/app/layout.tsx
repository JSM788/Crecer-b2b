import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/shared/lib/auth-context";
import { DemoStoreProvider } from "@/shared/state/demo-store";

export const metadata: Metadata = {
  title: "Aquamundo — Plataforma B2B Comercial",
  description: "Gestión comercial B2B para clientes, pedidos, visitas y cobranzas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AuthProvider>
          <DemoStoreProvider>{children}</DemoStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
