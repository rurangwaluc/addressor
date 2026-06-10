import Link from "next/link";

type Step = {
  number: string;
  title: string;
  text: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Discover",
    text: "Choose restaurants, stays, events, or nightlife.",
  },
  {
    number: "02",
    title: "Compare",
    text: "Check mood, trust, location, and availability.",
  },
  {
    number: "03",
    title: "Act",
    text: "Save, book, or contact the business.",
  },
];

const trust = ["Verified places", "Real visuals", "Fresh updates", "Business-ready"];

export default function CompactWorkflowTrustSection() {
  return (
    <section id="book" className="compact-flow relative overflow-hidden">
      <style>{`
        .compact-flow {
          --flow-frame: rgba(255,255,255,.92);
          --flow-card: rgba(255,255,255,.94);
          --flow-soft: rgba(255,255,255,.72);
          --flow-text: #101010;
          --flow-muted: rgba(16,16,16,.62);
          --flow-border: rgba(16,16,16,.12);
          --flow-primary: #1ca8cb;
          background: transparent;
          color: var(--flow-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .compact-flow,
        [data-theme="dark"] .compact-flow {
          --flow-frame: rgba(41,41,41,.9);
          --flow-card: rgba(48,48,48,.92);
          --flow-soft: rgba(35,35,35,.76);
          --flow-text: #f6f6f6;
          --flow-muted: rgba(246,246,246,.68);
          --flow-border: rgba(246,246,246,.13);
        }

        .workflow-card {
          transition:
            transform .3s ease,
            border-color .3s ease,
            box-shadow .3s ease;
        }

        .workflow-card:hover {
          transform: translateY(-3px);
          border-color: rgba(28,168,203,.42);
          box-shadow: 0 22px 50px rgba(0,0,0,.16);
        }
      `}</style>

      <div className="relative mx-auto max-w-[96rem] px-2 pb-2 sm:px-5 sm:pb-5 lg:px-7">
        <div
          className="rounded-[1.7rem] border p-1.5 shadow-2xl backdrop-blur-xl sm:rounded-[2.75rem] sm:p-2"
          style={{
            background: "var(--flow-frame)",
            borderColor: "var(--flow-border)",
          }}
        >
          <div
            className="rounded-[1.45rem] p-5 sm:rounded-[2.15rem] sm:p-7 lg:p-10"
            style={{ background: "var(--flow-card)" }}
          >
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1ca8cb]">
                  How Addressor works
                </p>

                <h2
                  className="mt-4 max-w-2xl text-[2.25rem] font-black leading-[0.94] tracking-tight min-[390px]:text-[2.65rem] sm:text-5xl lg:text-[4.25rem]"
                  style={{ color: "var(--flow-text)" }}
                >
                  Discover, compare, then act.
                </h2>
              </div>

              <div className="lg:pb-1">
                <p
                  className="max-w-2xl text-sm font-semibold leading-7 sm:text-base lg:ml-auto lg:max-w-xl lg:text-lg lg:leading-8"
                  style={{ color: "var(--flow-muted)" }}
                >
                  One simple path from curiosity to a trusted place, saved plan,
                  or business contact.
                </p>

                <div className="mt-6 flex flex-col gap-3 min-[430px]:flex-row lg:justify-end">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#1ca8cb] px-6 py-4 text-sm font-black text-white shadow-2xl transition hover:scale-[1.02]"
                  >
                    Start exploring
                    <span>↗</span>
                  </Link>

                  <Link
                    href="/business-login"
                    className="inline-flex items-center justify-center rounded-full border px-6 py-4 text-sm font-black transition hover:border-[#1ca8cb] hover:text-[#1ca8cb]"
                    style={{
                      borderColor: "var(--flow-border)",
                      color: "var(--flow-text)",
                    }}
                  >
                    List your business
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-3 min-[568px]:grid-cols-2 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="workflow-card rounded-[1.45rem] border p-4 shadow-xl sm:p-5"
                  style={{
                    background: "var(--flow-frame)",
                    borderColor: "var(--flow-border)",
                  }}
                >
                  <div className="flex items-start gap-4 md:block">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1ca8cb] text-sm font-black text-white shadow-xl">
                      {step.number}
                    </span>

                    <div className="md:mt-5">
                      <h3
                        className="text-lg font-black"
                        style={{ color: "var(--flow-text)" }}
                      >
                        {step.title}
                      </h3>

                      <p
                        className="mt-1 text-sm font-semibold leading-6"
                        style={{ color: "var(--flow-muted)" }}
                      >
                        {step.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-5 flex flex-wrap gap-2 rounded-[1.35rem] border p-3"
              style={{
                background: "var(--flow-soft)",
                borderColor: "var(--flow-border)",
              }}
            >
              {trust.map((item) => (
                <span
                  key={item}
                  className="rounded-full border px-4 py-2 text-xs font-black"
                  style={{
                    borderColor: "var(--flow-border)",
                    color: "var(--flow-muted)",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}