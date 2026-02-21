import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://khatamberdua.site"),
  title: {
    default: "Khatam Berdua — Khatam Al-Qur'an Bersama",
    template: "%s | Khatam Berdua",
  },
  description:
    "Platform khatam Al-Qur'an berdua secara online. Baca Al-Qur'an bersama pasangan, keluarga, atau teman. Tracking progress real-time, reminder harian, dan motivasi saling menguatkan sampai khatam 30 juz.",
  keywords: [
    "khatam quran",
    "khatam berdua",
    "baca quran bersama",
    "khatam alquran online",
    "tantangan khatam",
    "challenge quran",
    "khatam 30 hari",
    "tadarus bersama",
    "tracker quran",
    "membaca alquran",
  ],
  authors: [{ name: "Khatam Berdua" }],
  creator: "Khatam Berdua",
  publisher: "Khatam Berdua",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://khatamberdua.site",
    siteName: "Khatam Berdua",
    title: "Khatam Berdua — Khatam Al-Qur'an Bersama",
    description:
      "Platform khatam Al-Qur'an berdua secara online. Baca Al-Qur'an bersama pasangan, keluarga, atau teman dengan tracking progress real-time.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Khatam Berdua - Khatam Al-Qur'an Bersama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Khatam Berdua — Khatam Al-Qur'an Bersama",
    description:
      "Platform khatam Al-Qur'an berdua secara online. Baca Al-Qur'an bersama dengan tracking progress real-time.",
    images: ["/og-image.png"],
    creator: "@khatamberdua",
  },
  alternates: {
    canonical: "https://khatamberdua.site",
  },
  verification: {
    google: "J-8KNDNTSj8jkPpMd_JHa5xQv861T5_0A6-Y2k1grig",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} antialiased`}>
        {/* Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Khatam Berdua",
              url: "https://khatamberdua.site",
              description:
                "Platform khatam Al-Qur'an berdua secara online. Baca Al-Qur'an bersama pasangan, keluarga, atau teman dengan tracking progress real-time.",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "IDR",
              },
              inLanguage: "id-ID",
            }),
          }}
        />
        <div className="min-h-screen bg-linear-to-b from-emerald-50/80 via-white to-amber-50/30">
          {/* Decorative blobs */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute top-1/3 -left-32 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl" />
            <div className="absolute bottom-20 right-10 h-56 w-56 rounded-full bg-amber-100/30 blur-3xl" />
          </div>

          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-emerald-100/60 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
              <Link href="/" className="group flex items-center gap-2.5">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/50 transition-transform group-hover:scale-105">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
                    {/* Two readers (berdua) */}
                    <circle cx="8" cy="4.5" r="2" strokeWidth="1.8" />
                    <circle cx="16" cy="4.5" r="2" strokeWidth="1.8" />
                    {/* Shared open book */}
                    <path d="M2 9h8.5a1.5 1.5 0 0 1 1.5 1.5V21a1.5 1.5 0 0 0-1.5-1.5H2z" strokeWidth="1.8" />
                    <path d="M22 9h-8.5a1.5 1.5 0 0 0-1.5 1.5V21a1.5 1.5 0 0 1 1.5-1.5H22z" strokeWidth="1.8" />
                    {/* Book spine */}
                    <path d="M12 10.5V21" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-800">
                    Khatam Berdua
                  </h1>
                  <p className="hidden text-[11px] font-medium text-emerald-500/80 sm:block">
                    Khatam Al-Qur&apos;an Bersama
                  </p>
                </div>
              </Link>
            </div>
          </header>

          {/* Main content */}
          <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-100/80 bg-white/60 backdrop-blur-sm">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-1.5 px-4 py-5 sm:flex-row sm:justify-between">
              <p className="text-xs font-medium text-slate-400">
                Khatam Berdua &mdash; Baca Al-Qur&apos;an bersama, saling menguatkan
              </p>
              <p className="text-[11px] text-slate-300">
                Dibuat dengan 💚
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
