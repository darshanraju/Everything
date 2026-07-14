import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import { AuthSession } from "@/components/auth-session";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ozempic Tracker",
  description:
    "Weekly Ozempic check-ins: dose, weight in kg, and scale photo — track progress over time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="app-shell flex min-h-full flex-col font-sans text-foreground">
        <AuthSession />
        {children}
      </body>
    </html>
  );
}
