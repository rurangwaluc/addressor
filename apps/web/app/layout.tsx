import type { Metadata } from "next";
import "../styles/globals.css";



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
    <html lang="en" className="addressor-font" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}