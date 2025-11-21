import type { Metadata } from "next";
import { Manrope, Fraunces, Funnel_Display } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"], // Adding some character
});

const funnelDisplay = Funnel_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Takip - Track your watch history",
  description: "A beautiful way to track movies and series you've watched.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${manrope.variable} ${fraunces.variable} ${funnelDisplay.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
