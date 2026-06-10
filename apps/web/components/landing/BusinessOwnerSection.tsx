"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ownerCards = [
  {
    title: "Be found visually",
    text: "Show your place with photos, category, mood, location, and trust signals.",
  },
  {
    title: "Turn attention into action",
    text: "Move people from discovery to saved intent, contact, or booking request.",
  },
  {
    title: "Stay current",
    text: "Promote offers, events, availability, and updates without relying only on posts.",
  },
];

const businessTypes = ["Restaurants", "Hotels", "Events", "Lounges"];

export default function BusinessOwnerSection() {
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
    <section
      ref={ref}
      id="business"
      className="business-owner relative overflow-hidden"
    >
      <style>{`
        .business-owner {
          --business-bg: #f6f6f6;
          --business-frame: rgba(255,255,255,.92);
          --business-text: #101010;
          --business-muted: rgba(16,16,16,.62);
          --business-border: rgba(16,16,16,.12);
          --business-primary: #1ca8cb;
          background: var(--business-bg);
          color: var(--business-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .business-owner,
        [data-theme="dark"] .business-owner {
          --business-bg: #292929;
          --business-frame: rgba(41,41,41,.92);
          --business-text: #f6f6f6;
          --business-muted: rgba(246,246,246,.68);
          --business-border: rgba(246,246,246,.13);
        }

        .business-panel {
          opacity: 0;
          transform: translateY(42px) scale(.985);
          filter: blur(12px);
          transition:
            opacity .85s cubic-bezier(.2,.8,.2,1),
            transform .85s cubic-bezier(.2,.8,.2,1),
            filter .85s cubic-bezier(.2,.8,.2,1);
        }

        .business-panel.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }

        .business-image {
          background-image:
            linear-gradient(90deg, rgba(0,0,0,.66), rgba(0,0,0,.22) 50%, rgba(0,0,0,.48)),
            url("/landing/business-owner.webp");
          background-size: cover;
          background-position: center;
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]">
        <div className="imigongo-pattern h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-[96rem] px-2 pb-2 sm:px-5 sm:pb-5 lg:px-7">
        <div
          className={[
            "business-panel overflow-hidden rounded-[1.7rem] border p-1.5 shadow-2xl sm:rounded-[2.75rem] sm:p-2",
            visible ? "is-visible" : "",
          ].join(" ")}
          style={{
            background: "var(--business-frame)",
            borderColor: "var(--business-border)",
          }}
        >
          <div className="grid gap-2 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="business-image relative min-h-[38rem] overflow-hidden rounded-[1.45rem] sm:min-h-[42rem] sm:rounded-[2.15rem]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(28,168,203,.22),transparent_18rem),linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.44))]" />

              <div className="relative z-10 flex min-h-[38rem] flex-col justify-between p-5 text-white sm:min-h-[42rem] sm:p-8 lg:p-10">
                <div>
                  <p className="inline-flex rounded-full border border-white/28 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-xl">
                    For serious businesses
                  </p>

                  <h2 className="mt-6 max-w-4xl text-[2.7rem] font-black leading-[0.9] tracking-tight min-[390px]:text-[3.15rem] sm:text-6xl lg:text-[4.9rem]">
                    Stop being hidden inside scattered posts.
                  </h2>

                  <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/80 sm:text-lg sm:leading-8">
                    Addressor gives restaurants, stays, events, and nightlife
                    businesses a cleaner place to be discovered, trusted, and
                    contacted.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {businessTypes.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.35rem] border border-white/18 bg-white/14 px-5 py-4 shadow-2xl backdrop-blur-2xl"
                    >
                      <p className="text-lg font-black">{item}</p>
                      <p className="mt-1 text-sm font-semibold text-white/68">
                        Discovery-ready profile
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside
              className="rounded-[1.45rem] p-5 sm:rounded-[2.15rem] sm:p-7 lg:p-8"
              style={{ background: "var(--business-bg)" }}
            >
              <p
                className="text-xs font-black uppercase tracking-[0.2em]"
                style={{ color: "var(--business-primary)" }}
              >
                Owner control
              </p>

              <h3
                className="mt-4 text-[2.35rem] font-black leading-[0.95] tracking-tight sm:text-5xl"
                style={{ color: "var(--business-text)" }}
              >
                A better front door for your business.
              </h3>

              <p
                className="mt-4 text-sm font-semibold leading-7 sm:text-base"
                style={{ color: "var(--business-muted)" }}
              >
                Your business should not depend on people remembering one old
                Instagram post. Give them a place to see, trust, and act.
              </p>

              <div className="mt-7 grid gap-3">
                {ownerCards.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-[1.45rem] border p-4 shadow-xl"
                    style={{
                      background: "var(--business-frame)",
                      borderColor: "var(--business-border)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1ca8cb] text-sm font-black text-white shadow-xl">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <h4
                          className="text-lg font-black"
                          style={{ color: "var(--business-text)" }}
                        >
                          {item.title}
                        </h4>
                        <p
                          className="mt-1 text-sm font-semibold leading-6"
                          style={{ color: "var(--business-muted)" }}
                        >
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid gap-3 min-[430px]:grid-cols-2">
                <Link
                  href="/business-login"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#1ca8cb] px-6 py-4 text-sm font-black text-white shadow-2xl transition hover:-translate-y-1"
                >
                  List your business
                  <span>↗</span>
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border px-6 py-4 text-sm font-black transition hover:-translate-y-1"
                  style={{
                    borderColor: "var(--business-border)",
                    color: "var(--business-text)",
                  }}
                >
                  Explore as user
                </Link>
              </div>

              <div
                className="mt-7 rounded-[1.6rem] border p-5"
                style={{
                  background: "var(--business-frame)",
                  borderColor: "var(--business-border)",
                }}
              >
                <p
                  className="text-xs font-black uppercase tracking-[0.16em]"
                  style={{ color: "var(--business-muted)" }}
                >
                  Best image to use here
                </p>
                <p
                  className="mt-3 text-sm font-semibold leading-6"
                  style={{ color: "var(--business-muted)" }}
                >
                  Use a premium photo of a real Kigali restaurant, hotel
                  reception, event venue, or rooftop lounge with staff serving
                  customers. It should feel active, warm, and business-owned.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}