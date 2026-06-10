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
  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8"
      style={{ background: "var(--auth-page-bg)" }}
    >
      <div className="imigongo-pattern absolute inset-0 opacity-30" />
      <div
        className="absolute inset-0"
        style={{ background: "var(--auth-page-overlay)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 12%, var(--auth-bg-glow-one), transparent 28%), radial-gradient(circle at 82% 86%, var(--auth-bg-glow-two), transparent 32%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <header
          className="flex items-center justify-between rounded-[1.85rem] border px-4 py-3 shadow-2xl backdrop-blur-2xl sm:rounded-full sm:px-5 sm:py-4"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--surface) 94%, transparent), color-mix(in srgb, var(--surface-strong) 90%, transparent))",
            borderColor: "var(--border)",
            boxShadow:
              "0 24px 70px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <Link href="/" className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl border text-sm font-black"
              style={{
                background: "var(--accent-soft)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              A
            </span>

            <span>
              <span className="block text-lg font-black leading-none tracking-tight">
                Addressor
              </span>
              <span
                className="mt-1 block text-xs font-semibold"
                style={{ color: "var(--muted)" }}
              >
                Trusted Rwanda discovery
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="hidden rounded-full border px-3 py-2 text-[0.64rem] font-black uppercase tracking-[0.2em] sm:inline-flex"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--muted)",
              }}
            >
              Verified access
            </span>

            <ThemeToggle />
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-8 lg:py-6">
          <div
            className="grid w-full overflow-hidden rounded-[2.65rem] border shadow-2xl backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr]"
            style={{
              background:
                "linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--surface) 96%, var(--accent-soft)))",
              borderColor: "var(--border)",
              boxShadow:
                "0 30px 90px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <aside className="relative hidden min-h-[34rem] overflow-hidden p-10 text-[#FFF7ED] lg:flex lg:items-center lg:justify-center">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, var(--auth-panel-gradient-one) 0%, var(--auth-panel-gradient-two) 44%, var(--auth-panel-gradient-three) 100%)",
                }}
              />
              <div className="imigongo-pattern absolute inset-0 opacity-18" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 22% 12%, var(--auth-panel-light), transparent 30%), radial-gradient(circle at 72% 92%, var(--auth-panel-shadow), transparent 44%), linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.42))",
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
                  {panelItems.slice(0, 3).map((item, index) => (
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
              className="relative p-5 sm:p-7 lg:p-10"
              style={{ background: "var(--surface)" }}
            >
              <div className="imigongo-pattern absolute inset-0 opacity-[0.035]" />
              <div className="relative mx-auto max-w-md">
                <div
                  className="rounded-[2rem] border p-5 shadow-sm sm:p-6"
                  style={{
                    background:
                      "linear-gradient(145deg, color-mix(in srgb, var(--surface) 96%, var(--accent-soft)), var(--surface))",
                    borderColor: "var(--border)",
                    boxShadow:
                      "0 18px 50px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.18em] shadow-sm"
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

                  <h1 className="mt-6 text-4xl font-black leading-[0.96] tracking-tight sm:text-5xl">
                    {title}
                  </h1>

                  <p
                    className="mt-4 text-sm font-semibold leading-7 sm:text-base"
                    style={{ color: "var(--muted)" }}
                  >
                    {subtitle}
                  </p>

                  <div
                    className="my-7 h-px w-full"
                    style={{ background: "var(--border)" }}
                  />

                  {children}
                </div>
              </div>
            </section>
          </div>
        </section>

        <footer
          className="pb-3 text-center text-xs font-semibold"
          style={{ color: "var(--muted)" }}
        >
          Built for Rwanda-first discovery, trusted businesses, and verified access.
        </footer>
      </div>
    </main>
  );
}