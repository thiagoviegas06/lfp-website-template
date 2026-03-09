import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "Self supervised learning for in vivo localization of microelectrode arrays using raw local field potential",
  description: "Lfp2Vec: A Foundation Model for Neural Signal Localization. This research presents a novel self-supervised learning framework that maps raw brain signals (LFP) to specific anatomical locations, automating a critical step in high-density electrode recording analysis.",
  keywords: [
    "LFP",
    "Self Supervised Learning",
    "Transfer Learning",
    "Neuroinformatics",
    "machine learning",
    "computer vision",
    "AI",
  ],
  authors: [
    {
      name:
        "Tianxiao He, Malhar Patel, Chenyi Li, Anna Maslarova, Mihály Vöröslakos, Nalini Ramanathan, Wei-Lun Hung, Gyorgy Buzsáki, and Erdem Varol",
    },
  ],
  openGraph: {
    type: "article",
    siteName: "New York University",
    title:
      "Self supervised learning for in vivo localization of microelectrode arrays using raw local field potential",
    description: "Lfp2Vec: A Foundation Model for Neural Signal Localization. This research presents a novel self-supervised learning framework that maps raw brain signals (LFP) to specific anatomical locations, automating a critical step in high-density electrode recording analysis.",
    url: "https://YOUR_DOMAIN.com/YOUR_PROJECT_PAGE",
    images: [
      {
        url: "https://YOUR_DOMAIN.com/images/social_preview.png",
        width: 1200,
        height: 630,
        alt: "Self supervised learning... - Research Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@YOUR_TWITTER_HANDLE",
    creator: "@AUTHOR_TWITTER_HANDLE",
    title: "PAPER_TITLE",
    description: "Lfp2Vec: A Foundation Model for Neural Signal Localization. This research presents a novel self-supervised learning framework that maps raw brain signals (LFP) to specific anatomical locations, automating a critical step in high-density electrode recording analysis.",
    images: ["https://YOUR_DOMAIN.com/images/social_preview.png"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* CSS (Bulma + your page CSS + plugins) */}
        <link rel="stylesheet" href="/css/bulma.min.css" />
        <link rel="stylesheet" href="/css/index.css" />
        <link rel="stylesheet" href="/css/bulma-carousel.min.css" />
        <link rel="stylesheet" href="/css/bulma-slider.min.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          referrerPolicy="no-referrer"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css"
        />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD: keep from your HTML (optional but good) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ScholarlyArticle",
              headline:
                "Self supervised learning for in vivo localization of microelectrode arrays using raw local field potential",
              description: "Lfp2Vec: A Foundation Model for Neural Signal Localization. This research presents a novel self-supervised learning framework that maps raw brain signals (LFP) to specific anatomical locations, automating a critical step in high-density electrode recording analysis.",
              datePublished: "2025-09-18",
              publisher: {
                "@type": "Organization",
                name: "NeurIPS 2025 posster",
              },
              url: "https://YOUR_DOMAIN.com/YOUR_PROJECT_PAGE",
            }),
          }}
        />
      </head>

      <body>
        {children}

        {/* JS (use next/script so it loads correctly) */}
        <Script
          src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://documentcloud.adobe.com/view-sdk/main.js"
          strategy="afterInteractive"
        />
        <Script src="/js/fontawesome.all.min.js" strategy="afterInteractive" />
        <Script src="/js/bulma-carousel.min.js" strategy="afterInteractive" />
        <Script src="/js/bulma-slider.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}