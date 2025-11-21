import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Takip",
  description: "Minimalist watch history tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} antialiased bg-background text-foreground font-sans transition-colors duration-300`}
      >
        <Navbar />
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-[1200px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
