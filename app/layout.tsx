import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { HeaderNav } from "./components/navigation/HeaderNav";
import { AuthProvider } from "./components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pottsville Fire",
  description: "Pottsville Fire & Rescue Department",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://identity.netlify.com/v1/netlify-identity-widget.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.netlifyIdentity) {
                window.netlifyIdentity.on("init", function(user) {
                  if (!user) {
                    window.netlifyIdentity.on("login", function() {
                      document.location.href = "/members/run-log";
                    });
                  }
                });
                window.netlifyIdentity.init();
              }
            `,
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider>
          <AuthProvider>
            <HeaderNav />
            <main style={{ paddingTop: 56 }}>{children}</main>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
