import React from "react";
import "@/src/index.css";
import { ThemeProvider } from "@/lib/themeContext";
import { LanguageProvider } from "@/lib/languageContext";

export const metadata = {
  title: "NagarVaani — Infrastructure Intelligence Platform",
  description: "Multilingual AI platform for aggregating citizen infrastructure complaints and surfacing priority recommendations to government policymakers across BRICS nations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen antialiased">
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
