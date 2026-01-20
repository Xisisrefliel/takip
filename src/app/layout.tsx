import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";
import { LastVisitedProvider } from "@/context/LastVisitedContext";
import { MediaProvider } from "@/context/MediaContext";
import "./globals.css";

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
        className="antialiased bg-background text-foreground overflow-x-hidden"
      >
        <SessionProvider>
          <MediaProvider>
            <LastVisitedProvider>
              <Navbar />
              <main className="min-h-screen pt-20 sm:pt-24 pb-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 w-full lg:w-2/3 mx-auto">
                {children}
              </main>
            </LastVisitedProvider>
          </MediaProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
