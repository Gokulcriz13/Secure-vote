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
  title: "Secure Voting System",
  description: "A secure and transparent voting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900`}>
        {/* Voting Background */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/indian-flag-bg.jpg') center center / cover no-repeat",
          }}
        />
        {children}
      </body>
    </html>
  );
}
