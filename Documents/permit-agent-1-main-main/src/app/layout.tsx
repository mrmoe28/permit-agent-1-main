import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MapsProvider } from "@/components/providers/maps-provider";
import { AuthProvider } from "@/components/providers/session-provider";
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
  title: "PermitAgent - Find Permit Information for Any Address",
  description: "Discover local permit requirements, fees, and application procedures for any property address. Streamline your permit research with AI-powered data extraction from government websites.",
  keywords: "permits, building permits, construction permits, local government, contractors, project managers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <MapsProvider>
            {children}
          </MapsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
