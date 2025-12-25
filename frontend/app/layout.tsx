import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Private Vote Glow | Encrypted Voting System",
  description: "Create and participate in confidential surveys with full privacy guarantees powered by FHEVM fully homomorphic encryption technology. Your votes remain private, always.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 via-white to-slate-100 text-foreground antialiased min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
