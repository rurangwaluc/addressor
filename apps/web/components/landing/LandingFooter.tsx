import Link from "next/link";

type FooterLink = [label: string, href: string];

const productLinks: FooterLink[] = [
  ["Places", "#discover"],
  ["Restaurants", "#discover"],
  ["Stays", "#discover"],
  ["Events", "#discover"],
];

const resourceLinks: FooterLink[] = [
  ["How it works", "#book"],
  ["For businesses", "/business-login"],
  ["Trust & safety", "#book"],
  ["Help center", "/help"],
];

const legalLinks: FooterLink[] = [
  ["Terms of Service", "/terms"],
  ["Privacy Policy", "/privacy"],
  ["Cookie Policy", "/cookies"],
];

const highlights = [
  {
    number: "01",
    title: "Visual discovery",
    text: "Real images, mood, and place context before people choose.",
    metric: "4 core categories",
  },
  {
    number: "02",
    title: "Trusted signals",
    text: "Freshness, location, atmosphere, and availability in one view.",
    metric: "Less guessing",
  },
  {
    number: "03",
    title: "Business action",
    text: "Turn discovery into saved plans, contacts, and booking intent.",
    metric: "Clear next step",
  },
];

export default function LandingFooter() {
  return (
    <footer className="landing-footer relative overflow-hidden">
      <style>{`
        .landing-footer {
          --footer-panel: rgba(255,255,255,.94);
          --footer-soft: rgba(255,255,255,.72);
          --footer-card: rgba(255,255,255,.86);
          --footer-text: #101010;
          --footer-muted: rgba(16,16,16,.62);
          --footer-border: rgba(16,16,16,.10);
          --footer-primary: #1ca8cb;
          background: transparent;
          color: var(--footer-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .landing-footer,
        [data-theme="dark"] .landing-footer {
          --footer-panel: rgba(41,41,41,.94);
          --footer-soft: rgba(35,35,35,.76);
          --footer-card: rgba(48,48,48,.82);
          --footer-text: #f6f6f6;
          --footer-muted: rgba(246,246,246,.68);
          --footer-border: rgba(246,246,246,.13);
        }

        .footer-signal-card {
          transition:
            transform .28s ease,
            border-color .28s ease,
            background .28s ease,
            box-shadow .28s ease;
        }

        .footer-signal-card:hover {
          transform: translateY(-3px);
          border-color: rgba(28,168,203,.42);
          box-shadow: 0 22px 48px rgba(0,0,0,.18);
        }
      `}</style>

      <div className="relative mx-auto max-w-[96rem] px-2 pb-2 pt-28 sm:px-5 sm:pb-5 sm:pt-32 lg:px-7 lg:pt-36">
        <div
          className="overflow-hidden rounded-[1.7rem] border shadow-2xl backdrop-blur-xl sm:rounded-[2.75rem]"
          style={{
            background: "var(--footer-panel)",
            borderColor: "var(--footer-border)",
          }}
        >
          <div className="grid lg:grid-cols-[1fr_1.18fr]">
            <div className="p-6 sm:p-8 lg:p-12">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1ca8cb] text-base font-black text-white shadow-xl">
                  A
                </span>

                <span className="text-3xl font-black tracking-tight">
                  Addressor
                </span>
              </Link>

              <h2 className="mt-8 max-w-xl text-[2.15rem] font-black leading-[0.95] tracking-tight sm:text-5xl">
                Rwanda discovery, made easier to trust.
              </h2>

              <p
                className="mt-5 max-w-md text-sm font-semibold leading-7 sm:text-base"
                style={{ color: "var(--footer-muted)" }}
              >
                Addressor helps people quickly understand where to eat, stay,
                attend, and go out — while helping serious businesses become
                easier to find.
              </p>

              <div className="mt-7 flex flex-col gap-3 min-[430px]:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#1ca8cb] px-6 py-4 text-sm font-black text-white shadow-2xl transition hover:scale-[1.02]"
                >
                  Explore Addressor
                  <span>↗</span>
                </Link>

                <Link
                  href="/business-login"
                  className="inline-flex items-center justify-center rounded-full border px-6 py-4 text-sm font-black transition hover:border-[#1ca8cb] hover:text-[#1ca8cb]"
                  style={{
                    borderColor: "var(--footer-border)",
                    color: "var(--footer-text)",
                  }}
                >
                  List your business
                </Link>
              </div>

              <div className="mt-8 flex gap-3">
                {["X", "IG", "in"].map((item) => (
                  <Link
                    key={item}
                    href="/"
                    className="grid h-10 w-10 place-items-center rounded-full bg-[#263f66] text-xs font-black text-white shadow-xl transition hover:scale-105"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="border-t p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-12"
              style={{
                borderColor: "var(--footer-border)",
                background: "var(--footer-soft)",
              }}
            >
              <div className="grid gap-4">
                {highlights.map((item) => (
                  <div
                    key={item.number}
                    className="footer-signal-card overflow-hidden rounded-[1.6rem] border shadow-xl"
                    style={{
                      background: "var(--footer-card)",
                      borderColor: "var(--footer-border)",
                    }}
                  >
                    <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
                      <div className="flex items-start gap-4 p-4 sm:p-5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1ca8cb] text-sm font-black text-white shadow-xl">
                          {item.number}
                        </span>

                        <div>
                          <h3 className="text-lg font-black">{item.title}</h3>

                          <p
                            className="mt-1 max-w-xl text-sm font-semibold leading-6"
                            style={{ color: "var(--footer-muted)" }}
                          >
                            {item.text}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center border-t px-4 py-3 sm:border-l sm:border-t-0 sm:px-5"
                        style={{ borderColor: "var(--footer-border)" }}
                      >
                        <span
                          className="rounded-full border px-4 py-2 text-xs font-black"
                          style={{
                            borderColor: "var(--footer-border)",
                            color: "var(--footer-muted)",
                          }}
                        >
                          {item.metric}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-8 rounded-[1.6rem] border p-5 min-[520px]:grid-cols-3 sm:p-6">
                <FooterColumn title="Product" links={productLinks} />
                <FooterColumn title="Resources" links={resourceLinks} />
                <FooterColumn title="Legal" links={legalLinks} />
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-3 border-t px-6 py-5 text-xs font-bold sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"
            style={{
              borderColor: "var(--footer-border)",
              color: "var(--footer-muted)",
            }}
          >
            <p>© {new Date().getFullYear()} Addressor. Built for Rwanda discovery.</p>

            <Link href="/business-login" className="transition hover:text-[#1ca8cb]">
              List your business →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="text-sm font-black tracking-tight">{title}</h3>

      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="text-sm font-semibold transition hover:text-[#1ca8cb]"
            style={{ color: "var(--footer-muted)" }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}