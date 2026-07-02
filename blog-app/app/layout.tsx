import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.SITE_URL || "https://blog.songghost.com";
const SITE_NAME = "Song Ghost — The Pit";
const SITE_DESC = "Songwriting craft, AI music tools, and the stories behind the songs.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESC,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/rss.xml", title: SITE_NAME }] },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESC },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container-wide row">
            <div className="brand"><a href="/">Song Ghost · The Pit</a></div>
            <nav>
              <a href="https://www.songghost.com">App</a>
              <a href="/rss.xml">RSS</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container-wide row">
            <div>© {new Date().getFullYear()} Song Ghost. All rights reserved.</div>
            <div>
              <a href="https://www.songghost.com">songghost.com</a>
              {" · "}
              <a href="/rss.xml">RSS</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
