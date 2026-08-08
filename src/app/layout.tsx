import type { Metadata, Viewport } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundFX } from "@/components/shared/background-fx";
import { TopBanner } from "@/components/shared/top-banner";
import { SiteNavbar } from "@/components/shared/site-navbar";
import { SiteFooter } from "@/components/shared/site-footer";
import { SessionGate } from "@/components/shared/session-gate";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FlockerPlay — игровой маркетплейс",
    template: "%s · FlockerPlay",
  },
  description:
    "FlockerPlay — маркетплейс игровых товаров и услуг: ключи, валюта, буст, донаты и подарочные карты. Мгновенная доставка и безопасные сделки.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#070710",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("fp-theme");if(!t)t="dark";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){document.documentElement.classList.add("dark")}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${unbounded.variable} relative min-h-screen font-sans`}>
        <Providers>
          <SessionGate />
          <BackgroundFX />
          <div className="relative z-10 flex min-h-screen flex-col">
            <TopBanner />
            <SiteNavbar />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
