"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const businessLinks = [
  { label: "Dashboard", href: "/business-dashboard" },
  { label: "Profile", href: "/business-profile" },
  { label: "Menu", href: "/business-menu" },
  { label: "Bookings", href: "/business-bookings" },
  { label: "Reviews", href: "/business-reviews" },
  { label: "Subscribers", href: "/business-subscribers" },
  { label: "Photos", href: "/business-photos" },
  { label: "Settings", href: "/business-settings" },
];

export default function BusinessNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLink =
    businessLinks.find((item) => pathname === item.href) ?? businessLinks[0];

  useEffect(() => {
    businessLinks.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  return (
    <aside
      className="rounded-[1.5rem] border p-2 lg:sticky lg:top-5 lg:p-3"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <button
        type="button"
        onClick={() => setMobileOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-[1rem] border px-4 py-3 text-left text-sm font-black lg:hidden"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
        aria-expanded={mobileOpen}
        aria-controls="business-mobile-menu"
      >
        <span>
          <span
            className="block text-[0.65rem] uppercase tracking-[0.2em]"
            style={{ color: "var(--accent)" }}
          >
            Business menu
          </span>
          <span className="mt-1 block whitespace-nowrap">{activeLink.label}</span>
        </span>

        <span
          className="grid h-9 w-9 place-items-center rounded-full border text-base"
          style={{
            borderColor: "var(--border)",
            color: "var(--accent)",
          }}
          aria-hidden="true"
        >
          {mobileOpen ? "×" : "☰"}
        </span>
      </button>

      <div className="hidden px-3 pb-3 pt-2 lg:block">
        <p
          className="text-xs font-black uppercase tracking-[0.22em]"
          style={{ color: "var(--accent)" }}
        >
          Business menu
        </p>
        <p
          className="mt-2 text-xs font-bold leading-5"
          style={{ color: "var(--muted)" }}
        >
          Manage what customers see, request, review, and follow.
        </p>
      </div>

      <nav
        id="business-mobile-menu"
        className={`mt-2 grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-0 lg:grid lg:grid-cols-1 ${
          mobileOpen ? "grid" : "hidden"
        } lg:!grid`}
        aria-label="Business pages"
      >
        {businessLinks.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onMouseEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              onClick={() => setMobileOpen(false)}
              className="rounded-[1rem] px-3 py-3 text-center whitespace-nowrap text-xs font-black transition hover:scale-[1.01] sm:text-sm lg:text-left"
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
    </aside>
  );
}
