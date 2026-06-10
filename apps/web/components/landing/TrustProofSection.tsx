"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const proofCards = [
  {
    value: "Verified",
    title: "Real places",
    text: "Businesses should be easier to trust before users decide to visit, save, or book.",
  },
  {
    value: "Current",
    title: "Fresh signals",
    text: "Users need updated photos, availability, offers, and clear next actions.",
  },
  {
    value: "Visible",
    title: "Less guessing",
    text: "Discovery should not depend on old posts, scattered chats, or random recommendations.",
  },
];

const signals = ["Photos", "Location", "Mood", "Availability", "Reviews", "Contact"];

export default function TrustProofSection() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.18 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id="trust" className="trust-proof relative overflow-hidden">
      <style>{`
        .trust-proof {
          --trust-bg: #f6f6f6;
          --trust-frame: rgba(255,255,255,.92);
          --trust-text: #101010;
          --trust-muted: rgba(16,16,16,.62);
          --trust-border: rgba(16,16,16,.12);
          --trust-primary: #1ca8cb;
          background: var(--trust-bg);
          color: var(--trust-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .trust-proof,
        [data-theme="dark"] .trust-proof {
          --trust-bg: #292929;
          --trust-frame: rgba(41,41,41,.92);
          --trust-text: #f6f6f6;
          --trust-muted: rgba(246,246,246,.68);
          --trust-border: rgba(246,246,246,.13);
        }

        .trust-panel {
          opacity: 0;
          transform: translateY(42px) scale(.985);
          filter: blur(12px);
          transition:
            opacity .85s cubic-bezier(.2,.8,.2,1),
            transform .85s cubic-bezier(.2,.8,.2,1),
            filter .85s cubic-bezier(.2,.8,.2,1);
        }

        .trust-panel.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }

        .trust-image {
          background-image:
            linear-gradient(90deg, rgba(0,0,0,.64), rgba(0,0,0,.22) 50%, rgba(0,0,0,.44)),
            url("/landing/trust-proof.webp");
          background-size: cover;
          background-position: center;
        }

        .trust-card {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity .75s cubic-bezier(.2,.8,.2,1),
            transform .75s cubic-bezier(.2,.8,.2,1);
        }

        .trust-panel.is-visible .trust-card {
          opacity: 1;
          transform: translateY(0);
        }

        .trust-panel.is-visible .trust-card:nth-child(1) { transition-delay: .16s; }
        .trust-panel.is-visible .trust-card:nth-child(2) { transition-delay: .26s; }
        .trust-panel.is-visible .trust-card:nth-child(3) { transition-delay: .36s; }
      `}</style>

      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]">
        <div className="imigongo-pattern h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-[96rem] px-2 pb-2 sm:px-5 sm:pb-5 lg:px-7">
        <div
          className={[
            "trust-panel overflow-hidden rounded-[1.7rem] border p-1.5 shadow-2xl sm:rounded-[2.75rem] sm:p-2",
            visible ? "is-visible" : "",
          ].join(" ")}
          style={{
            background: "var(--trust-frame)",
            borderColor: "var(--trust-border)",
          }}
        >
          <div className="grid gap-2 lg:grid-cols-[0.95fr_1.05fr]">
            <div
              className="rounded-[1.45rem] p-5 sm:rounded-[2.15rem] sm:p-8 lg:p-10"
              style={{ background: "var(--trust-bg)" }}
            >
              <p
                className="text-xs font-black uppercase tracking-[0.2em]"
                style={{ color: "var(--trust-primary)" }}
              >
                Trust layer
              </p>

              <h2
                className="mt-5 max-w-3xl text-[2.65rem] font-black leading-[0.92] tracking-tight min-[390px]:text-[3.1rem] sm:text-6xl lg:text-[4.6rem]"
                style={{ color: "var(--trust-text)" }}
              >
                Confidence before people move.
              </h2>

              <p
                className="mt-5 max-w-2xl text-base font-semibold leading-8 sm:text-lg"
                style={{ color: "var(--trust-muted)" }}
              >
                Addressor should help users trust what they see before they
                spend time, money, or energy going somewhere.
              </p>

              <div className="mt-8 grid gap-3">
                {proofCards.map((item) => (
                  <div
                    key={item.title}
                    className="trust-card rounded-[1.45rem] border p-5 shadow-xl"
                    style={{
                      background: "var(--trust-frame)",
                      borderColor: "var(--trust-border)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1ca8cb] text-[0.65rem] font-black uppercase text-white shadow-xl">
                        {item.value}
                      </span>

                      <div>
                        <h3
                          className="text-xl font-black tracking-tight"
                          style={{ color: "var(--trust-text)" }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="mt-2 text-sm font-semibold leading-6"
                          style={{ color: "var(--trust-muted)" }}
                        >
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#1ca8cb] px-6 py-4 text-sm font-black text-white shadow-2xl transition hover:-translate-y-1"
                >
                  Create verified account
                  <span>↗</span>
                </Link>

                <Link
                  href="/business-login"
                  className="inline-flex items-center justify-center rounded-full border px-6 py-4 text-sm font-black transition hover:-translate-y-1"
                  style={{
                    borderColor: "var(--trust-border)",
                    color: "var(--trust-text)",
                  }}
                >
                  Business access
                </Link>
              </div>
            </div>

            <div className="trust-image relative min-h-[38rem] overflow-hidden rounded-[1.45rem] sm:min-h-[42rem] sm:rounded-[2.15rem]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(28,168,203,.22),transparent_18rem),linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.42))]" />

              <div className="relative z-10 flex min-h-[38rem] flex-col justify-between p-5 text-white sm:min-h-[42rem] sm:p-8 lg:p-10">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/28 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-xl">
                    Verified discovery
                  </span>

                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#292929] shadow-2xl">
                    ✓
                  </span>
                </div>

                <div className="ml-auto w-full max-w-[34rem] rounded-[2rem] border border-white/18 bg-white/16 p-5 shadow-2xl backdrop-blur-2xl">
                  <p className="text-sm font-black text-white/65">
                    Trust signals users understand
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {signals.map((item) => (
                      <div
                        key={item}
                        className="rounded-full border border-white/16 bg-black/18 px-4 py-3 text-center text-xs font-black backdrop-blur-xl"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[1.4rem] bg-white p-5 text-[#292929] shadow-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
                      Recommended image
                    </p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-black/60">
                      Use a real hospitality/travel moment: guests arriving,
                      staff welcoming visitors, restaurant table, hotel lobby,
                      or event check-in with warm Kigali lighting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}