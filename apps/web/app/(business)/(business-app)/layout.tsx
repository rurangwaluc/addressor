import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";
import BusinessNav from "@/components/business/BusinessNav";

export default function BusinessAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAccess mode="business">
      <main
        className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg) 82%, transparent)",
          color: "var(--text)",
        }}
      >
        <section className="relative mx-auto w-full max-w-[90rem]">
          <nav
            className="flex flex-col gap-3 rounded-[1.5rem] border p-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <Link href="/" prefetch className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full whitespace-nowrap text-sm font-black"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                }}
              >
                A
              </span>

              <span className="min-w-0">
                <span className="block truncate whitespace-nowrap text-sm font-black">
                  Addressor business
                </span>
                <span
                  className="block truncate text-xs font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  Owner control center
                </span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
              <Link
                href="/business-dashboard"
                prefetch
                className="rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/businesses"
                prefetch
                className="rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                Switch business
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </nav>

          <div className="mt-4 grid gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
            <BusinessNav />
            <div className="min-w-0">{children}</div>
          </div>
        </section>
      </main>
    </RequireAccess>
  );
}
