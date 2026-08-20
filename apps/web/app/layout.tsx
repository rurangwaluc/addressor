import type { Metadata, Viewport } from "next";
import "../styles/globals.css";



export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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
      <body className="addressor-body">{children}</body>
    </html>
  );
}