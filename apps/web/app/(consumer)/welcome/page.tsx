import Link from "next/link";
import AuthBadge from "@/components/AuthBadge";
import ThemeToggle from "@/components/ThemeToggle";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";

export default function WelcomePage() {
  return (
    <RequireAccess mode="auth">
      <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="imigongo-pattern absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,95,42,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(22,17,12,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl">
          <nav
            className="flex items-center justify-between gap-3 rounded-full border px-4 py-3 backdrop-blur-xl"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <Link href="/" className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight">Addressor</p>
              <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
                Verified customer access
              </p>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <LogoutButton className="hidden sm:inline-flex" />
              <ThemeToggle />
            </div>
          </nav>

          <section className="grid min-h-[calc(100vh-7rem)] place-items-center py-12">
            <div
              className="w-full max-w-3xl rounded-[2rem] border p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <AuthBadge>Verified access</AuthBadge>

              <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                Welcome to Addressor.
              </h1>

              <p
                className="mx-auto mt-4 max-w-xl text-sm leading-7 sm:text-base"
                style={{ color: "var(--muted)" }}
              >
                Your verified account is ready. Next, we will connect this access
                to discovery, saved places, bookings, reviews, and the full
                Addressor customer experience.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["Discover", "Save", "Book"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border p-4 text-sm font-black"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="rounded-full px-5 py-3 text-sm font-black transition hover:scale-[1.01]"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-contrast)",
                  }}
                >
                  Explore Addressor
                </Link>

                <LogoutButton className="sm:hidden" />
              </div>
            </div>
          </section>
        </div>
      </main>
    </RequireAccess>
  );
}
