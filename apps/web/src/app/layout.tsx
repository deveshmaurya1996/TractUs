import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { LoadingOverlay } from "@tractus/ui";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tract-Us | Contract Operations Console",
  description: "Manage contracts efficiently across organizations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Suspense fallback={<LoadingOverlay />}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
