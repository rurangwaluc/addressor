"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const businessLinks = [
  { label: "Dashboard", href: "/business-dashboard" },
  { label: "Profile", href: "/business-profile" },
  { label: "Photos", href: "/business-photos" },
  { label: "Hours", href: "/business-hours" },
  { label: "Requests", href: "/business-requests" },
  { label: "Settings", href: "/business-settings" },
];

export default function BusinessNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mt-4 grid grid-cols-2 gap-2 rounded-[1.5rem] border p-2 sm:grid-cols-3 lg:grid-cols-6"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
      aria-label="Business pages"
    >
      {businessLinks.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1rem] px-3 py-3 text-center text-sm font-black transition hover:scale-[1.01]"
            style={{
              background: active ? "var(--accent)" : "var(--surface-strong)",
              color: active ? "var(--accent-contrast)" : "var(--text)",
              border: active ? "1px solid transparent" : "1px solid var(--border)",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
