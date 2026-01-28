import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Takip - Präsentation",
  description: "Takip Media Tracking App Präsentation",
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
