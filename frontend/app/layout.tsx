import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ATS Intelligence — AI-Powered Candidate Screening",
  description:
    "Production-grade Applicant Tracking System powered by SBERT embeddings and ensemble ML models. Screen candidates with precision.",
  keywords: ["ATS", "AI recruitment", "candidate screening", "machine learning", "HR tech"],
  openGraph: {
    title: "ATS Intelligence",
    description: "AI-Powered Candidate Screening Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen bg-[#0a0e1a] text-[#e2e8f0] antialiased scanline">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
