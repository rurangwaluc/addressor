import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "../styles/globals.css";


const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Addressor",
  description: "Rwanda discovery made visual.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={quicksand.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}