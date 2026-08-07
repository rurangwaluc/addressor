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
        className="min-h-screen px-4 py-3 sm:px-6 sm:py-5 lg:px-8"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg) 82%, transparent)",
          color: "var(--text)",
        }}
      >
        <section className="relative mx-auto w-full max-w-[90rem]">
          <nav
            className="flex items-center gap-2 rounded-[1.25rem] border p-2.5 sm:gap-3 sm:rounded-[1.5rem] sm:justify-between sm:p-3"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <Link href="/" prefetch className="flex shrink-0 items-center gap-3 sm:min-w-0">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full whitespace-nowrap text-sm font-black sm:h-10 sm:w-10"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                }}
              >
                A
              </span>

              <span className="hidden min-w-0 sm:block">
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

            <div className="ml-auto grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:ml-0 sm:flex sm:flex-none sm:flex-wrap sm:justify-end">
              <Link
                href="/business-dashboard"
                prefetch
                className="hidden rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black sm:inline-flex"
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
                className="inline-flex w-full justify-center rounded-full border px-2.5 py-2.5 whitespace-nowrap text-xs font-black sm:w-auto sm:px-4 sm:py-3 sm:text-sm"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                <span className="sm:hidden">Switch</span>
                <span className="hidden sm:inline">Switch business</span>
              </Link>
              <ThemeToggle />
              <LogoutButton className="whitespace-nowrap" />
            </div>
          </nav>

          <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
            <BusinessNav />
            <div className="min-w-0">{children}</div>
          </div>
        </section>
      </main>
    </RequireAccess>
  );
}
