import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  const protocol = incomingHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const metadataBase = host ? new URL(`${protocol}://${host}`) : undefined;

  return {
    title: "AfetLens — Türkiye Deprem Haritası",
    description:
      "Türkiye ve çevresindeki güncel depremleri haritada takip edin; büyüklük, derinlik ve zamana göre inceleyin.",
    metadataBase,
    openGraph: {
      title: "AfetLens — Türkiye'nin sismik hareketlilik görünümü",
      description:
        "Güncel deprem verileri, bölgesel hareketlilik ve anlaşılır istatistikler.",
      images: [{ url: "/og.png", width: 1733, height: 909, alt: "AfetLens" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "AfetLens",
      description: "Türkiye'nin sismik hareketlilik görünümü",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
