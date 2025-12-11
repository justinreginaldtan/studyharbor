import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary"; // Import ErrorBoundary
import { PosthogProvider } from "@/components/analytics/PosthogProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyHarbor",
  description: "A cozy shared space for gentle real-time collaboration in StudyHarbor.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <PosthogProvider />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
