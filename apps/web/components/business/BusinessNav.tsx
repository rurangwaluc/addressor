"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Camera,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Store,
  Users,
} from "lucide-react";

const businessLinks = [
  { label: "Dashboard", href: "/business-dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/business-profile", icon: Store },
  { label: "Menu", href: "/business-menu", icon: BookOpen },
  { label: "Bookings", href: "/business-bookings", icon: Calendar },
  { label: "Reviews", href: "/business-reviews", icon: MessageSquare },
  { label: "Subscribers", href: "/business-subscribers", icon: Users },
  { label: "Photos", href: "/business-photos", icon: Camera },
  { label: "Settings", href: "/business-settings", icon: Settings },
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
      className="rounded-[1.25rem] border p-1.5 sm:rounded-[1.5rem] sm:p-2 lg:sticky lg:top-5 lg:p-3"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <button
        type="button"
        onClick={() => setMobileOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-[0.9rem] border px-3 py-2 text-left text-sm font-black lg:hidden"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
        aria-expanded={mobileOpen}
        aria-controls="business-mobile-menu"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="shrink-0 text-[0.6rem] uppercase tracking-[0.16em]"
            style={{ color: "var(--accent)" }}
          >
            Business menu
          </span>
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>·</span>
          <span className="truncate whitespace-nowrap">{activeLink.label}</span>
        </span>

        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm"
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
        className={`mt-1.5 grid-cols-3 gap-1.5 min-[380px]:grid-cols-4 sm:mt-2 sm:gap-2 lg:mt-0 lg:grid lg:grid-cols-1 ${
          mobileOpen ? "grid" : "hidden"
        } lg:!grid`}
        aria-label="Business pages"
      >
        {businessLinks.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onMouseEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              onClick={() => setMobileOpen(false)}
              className="flex flex-col items-center justify-center gap-1 rounded-[0.8rem] px-1 py-2 whitespace-nowrap text-[0.65rem] font-black transition hover:bg-[var(--surface-strong)] sm:flex-row sm:gap-2 sm:rounded-[1rem] sm:px-3 sm:py-3 sm:text-sm lg:justify-start lg:hover:scale-[1.01]"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "var(--accent-contrast)" : "var(--text)",
                border: "1px solid transparent",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
