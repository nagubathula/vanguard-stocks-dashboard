import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personalised Recommendations // Multi-Agent Stock Scoring Engine",
  description: "Institutional-grade market scoring system utilizing multi-agent analysis for Nifty 50 stocks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
