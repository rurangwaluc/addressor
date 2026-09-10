"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";

const navigation = [
  {
    href: "/account",
    label: "Home",
    icon: Home,
  },
  {
    href: "/account/bookings",
    label: "Bookings",
    icon: CalendarDays,
  },
  {
    href: "/account/orders",
    label: "Orders",
    icon: ShoppingBag,
  },
  {
    href: "/account/profile",
    label: "Profile",
    icon: UserRound,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/account") {
    return pathname === "/account";
  }

  return pathname.startsWith(href);
}

export default function AccountShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <div className="imigongo-pattern pointer-events-none fixed inset-0 opacity-[0.18]" />

      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "var(--bg)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/account"
            className="min-w-0 shrink-0 whitespace-nowrap text-lg font-black tracking-[-0.04em]"
          >
            Addressor
          </Link>

          <nav className="ml-5 hidden items-center gap-1 md:flex">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);

              return (
                <Link
                  key={href}
                  href={href}
                  className="flex whitespace-nowrap items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition"
                  style={{
                    background: active
                      ? "var(--surface-strong)"
                      : "transparent",
                    color: active ? "var(--text)" : "var(--muted)",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="hidden whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-sm font-black transition hover:scale-[1.01] sm:inline-flex sm:items-center sm:gap-2"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-strong)",
                color: "var(--text)",
              }}
            >
              <Search size={16} />
              Find places
            </Link>

            <LogoutButton className="hidden lg:inline-flex" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12 lg:px-8">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
        style={{
          background: "var(--bg)",
          borderColor: "var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className="relative flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[11px] font-black"
                style={{
                  background: active
                    ? "var(--surface-strong)"
                    : "transparent",
                  color: active ? "var(--text)" : "var(--muted)",
                }}
              >
                <Icon size={19} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
