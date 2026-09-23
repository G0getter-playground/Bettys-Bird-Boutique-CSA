import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Betty's Bird Brain — Customer Service",
  description:
    "A friendly AI assistant for Betty's Bird Boutique. Ask about prices, store hours, or bird care.",
};

// Tiny script runs before React hydration to apply theme class and avoid FOUC.
const themeBootScript = `(function(){try{var t=localStorage.getItem('betty-theme');if(t==='dark'){document.documentElement.classList.add('theme-dark');}else if(t==='light'){document.documentElement.classList.add('theme-light');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to chat
        </a>
        {children}
      </body>
    </html>
  );
}
