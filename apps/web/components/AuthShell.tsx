import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type PanelItem = {
  title: string;
  text?: string;
};

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  eyebrow?: string;
  panelTitle?: string;
  panelSubtitle?: string;
  panelItems?: PanelItem[];
};

export default function AuthShell({
  title,
  subtitle,
  children,
  eyebrow = "Rwanda-first",
  panelTitle = "Discover, book, and trust better places.",
  panelSubtitle = "Addressor connects locals, visitors, and serious businesses through verified access, real discovery, and trusted actions.",
  panelItems = [
    { title: "Verified access", text: "Trust starts before action." },
    { title: "Real bookings", text: "Move from discovery to plans." },
    { title: "Trusted Rwanda", text: "Built for local confidence." },
  ],
}: AuthShellProps) {
  const visiblePanelItems = panelItems.slice(0, 3);

  return (
    <main
      className="relative min-h-dvh overflow-x-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 lg:px-8"
      style={{ background: "var(--auth-page-bg)" }}
    >
      <div className="imigongo-pattern pointer-events-none absolute inset-0 opacity-25" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--auth-page-overlay)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 16% 10%, rgba(255,255,255,0.045), transparent 28%), radial-gradient(circle at 88% 92%, rgba(0,0,0,0.18), transparent 34%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-[73rem] flex-col">
        <header className="flex items-center justify-between gap-3 py-2.5 sm:py-4">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-full transition hover:opacity-90"
            aria-label="Go to Addressor home"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-[1.15rem] border text-sm font-black shadow-xl transition group-hover:scale-[1.02] sm:h-12 sm:w-12"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in srgb, var(--surface) 92%, white), var(--surface))",
                borderColor: "var(--border)",
                color: "var(--text)",
                boxShadow:
                  "0 18px 42px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              A
            </span>

            <span className="min-w-0">
              <span className="block truncate text-lg font-black leading-none tracking-tight sm:text-xl">
                Addressor
              </span>
              <span
                className="mt-1 block truncate text-[0.7rem] font-bold leading-none sm:text-xs"
                style={{ color: "var(--muted)" }}
              >
                Rwanda discovery access
              </span>
            </span>
          </Link>

          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full border p-1.5 backdrop-blur-2xl sm:gap-2"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--surface) 92%, transparent), color-mix(in srgb, var(--surface-strong) 86%, transparent))",
              borderColor: "var(--border)",
              boxShadow:
                "0 18px 55px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="hidden rounded-full px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.22em] md:inline-flex"
              style={{
                background: "var(--surface)",
                color: "var(--muted)",
              }}
            >
              Secure portal
            </span>

            <ThemeToggle />
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-4 sm:py-6 lg:py-7">
          <div
            className="grid w-full overflow-hidden rounded-[1.7rem] border shadow-2xl backdrop-blur-xl sm:rounded-[2.1rem] lg:grid-cols-[0.92fr_1.08fr] lg:rounded-[2.65rem]"
            style={{
              background:
                "linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--surface) 96%, var(--accent-soft)))",
              borderColor: "var(--border)",
              boxShadow:
                "0 30px 90px rgba(0,0,0,0.17), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <aside className="relative hidden min-h-[34rem] overflow-hidden p-10 text-[#FFF7ED] lg:flex lg:items-center lg:justify-center">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(145deg, #252525 0%, #171717 48%, #070707 100%)",
                }}
              />
              <div className="imigongo-pattern absolute inset-0 opacity-[0.09]" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 18% 10%, rgba(255,255,255,0.08), transparent 26%), radial-gradient(circle at 78% 92%, rgba(0,0,0,0.38), transparent 42%), linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.52))",
                }}
              />

              <div className="relative w-full max-w-md text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.2em] text-white backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  {eyebrow}
                </span>

                <h2 className="mt-8 text-5xl font-black leading-[0.94] tracking-tight text-white">
                  {panelTitle}
                </h2>

                <p className="mx-auto mt-6 max-w-sm text-sm font-semibold leading-7 text-white/78">
                  {panelSubtitle}
                </p>

                <div className="mx-auto mt-8 grid max-w-sm gap-3 text-left">
                  {visiblePanelItems.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="flex items-start gap-4 rounded-[1.4rem] border border-white/13 bg-white/[0.08] px-4 py-3.5 backdrop-blur-md"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/12 text-[0.68rem] font-black text-white ring-1 ring-white/12">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span>
                        <span className="block text-sm font-black text-white">
                          {item.title}
                        </span>
                        {item.text ? (
                          <span className="mt-1 block text-xs font-semibold leading-5 text-white/64">
                            {item.text}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section
              className="relative px-3 py-4 sm:p-6 lg:p-10"
              style={{ background: "var(--surface)" }}
            >
              <div className="imigongo-pattern pointer-events-none absolute inset-0 opacity-[0.035]" />

              <div className="relative mx-auto w-full max-w-md">
                <div className="mb-3 rounded-[1.35rem] border p-3.5 text-left lg:hidden"
                  style={{
                    background:
                      "linear-gradient(145deg, color-mix(in srgb, var(--surface) 94%, white), var(--surface))",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.18em]"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--accent)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                    {eyebrow}
                  </span>

                  <h2 className="mt-3 text-xl font-black leading-[1.02] tracking-tight sm:text-2xl">
                    {panelTitle}
                  </h2>

                  <p
                    className="mt-2 text-xs font-semibold leading-5 sm:text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    {panelSubtitle}
                  </p>
                </div>

                <div
                  className="rounded-[1.65rem] border p-4 shadow-sm sm:rounded-[2rem] sm:p-6"
                  style={{
                    background:
                      "linear-gradient(145deg, color-mix(in srgb, var(--surface) 96%, var(--accent-soft)), var(--surface))",
                    borderColor: "var(--border)",
                    boxShadow:
                      "0 18px 50px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.64rem] font-black uppercase tracking-[0.18em] shadow-sm"
                    style={{
                      background: "var(--accent-soft)",
                      borderColor: "var(--border)",
                      color: "var(--accent)",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                    Secure access
                  </span>

                  <h1 className="mt-5 text-[2.35rem] font-black leading-[0.96] tracking-tight sm:mt-6 sm:text-5xl">
                    {title}
                  </h1>

                  <p
                    className="mt-3 text-sm font-semibold leading-6 sm:mt-4 sm:text-base sm:leading-7"
                    style={{ color: "var(--muted)" }}
                  >
                    {subtitle}
                  </p>

                  <div
                    className="my-5 h-px w-full sm:my-7"
                    style={{ background: "var(--border)" }}
                  />

                  {children}
                </div>
              </div>
            </section>
          </div>
        </section>

        <footer
          className="pb-2 text-center text-[0.68rem] font-semibold leading-5 sm:text-xs"
          style={{ color: "var(--muted)" }}
        >
          Built for Rwanda-first discovery, trusted businesses, and verified access.
        </footer>
      </div>
    </main>
  );
}
