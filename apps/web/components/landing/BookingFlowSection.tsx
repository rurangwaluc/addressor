"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const bookingSteps = [
  ["01", "Choose", "Pick the place that matches your plan."],
  ["02", "Check", "See trust, mood, location, and availability."],
  ["03", "Act", "Save, book, or contact the business."],
];

const trustSignals = ["Trusted", "Open now", "Near you"];

export default function BookingFlowSection() {
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
    <section ref={ref} id="book" className="booking-flow relative overflow-hidden">
      <style>{`
        .booking-flow {
          --book-bg: #f6f6f6;
          --book-frame: rgba(255,255,255,.92);
          --book-text: #101010;
          --book-muted: rgba(16,16,16,.62);
          --book-border: rgba(16,16,16,.12);
          --book-primary: #1ca8cb;
          background: var(--book-bg);
          color: var(--book-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .booking-flow,
        [data-theme="dark"] .booking-flow {
          --book-bg: #292929;
          --book-frame: rgba(41,41,41,.92);
          --book-text: #f6f6f6;
          --book-muted: rgba(246,246,246,.68);
          --book-border: rgba(246,246,246,.13);
        }

        .booking-panel {
          opacity: 0;
          transform: translateY(42px) scale(.985);
          filter: blur(12px);
          transition:
            opacity .85s cubic-bezier(.2,.8,.2,1),
            transform .85s cubic-bezier(.2,.8,.2,1),
            filter .85s cubic-bezier(.2,.8,.2,1);
        }

        .booking-panel.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }

        .booking-image {
          background-image:
            linear-gradient(90deg, rgba(0,0,0,.68), rgba(0,0,0,.28) 46%, rgba(0,0,0,.48)),
            url("/landing/booking-one-click.webp");
          background-size: cover;
          background-position: center;
        }

        .booking-glow {
          background:
            radial-gradient(circle at 72% 28%, rgba(28,168,203,.26), transparent 17rem),
            radial-gradient(circle at 38% 92%, rgba(255,255,255,.18), transparent 20rem),
            linear-gradient(180deg, rgba(0,0,0,.03), rgba(0,0,0,.44));
        }

        .booking-step {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity .75s cubic-bezier(.2,.8,.2,1),
            transform .75s cubic-bezier(.2,.8,.2,1);
        }

        .booking-panel.is-visible .booking-step {
          opacity: 1;
          transform: translateY(0);
        }

        .booking-panel.is-visible .booking-step:nth-child(1) { transition-delay: .18s; }
        .booking-panel.is-visible .booking-step:nth-child(2) { transition-delay: .28s; }
        .booking-panel.is-visible .booking-step:nth-child(3) { transition-delay: .38s; }

        .action-card {
          opacity: 0;
          transform: translateY(30px) scale(.985);
          transition:
            opacity .8s cubic-bezier(.2,.8,.2,1) .28s,
            transform .8s cubic-bezier(.2,.8,.2,1) .28s;
        }

        .booking-panel.is-visible .action-card {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]">
        <div className="imigongo-pattern h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-[96rem] px-2 pb-2 sm:px-5 sm:pb-5 lg:px-7">
        <div
          className={[
            "booking-panel overflow-hidden rounded-[1.7rem] border p-1.5 shadow-2xl sm:rounded-[2.75rem] sm:p-2",
            visible ? "is-visible" : "",
          ].join(" ")}
          style={{
            background: "var(--book-frame)",
            borderColor: "var(--book-border)",
          }}
        >
          <div className="booking-image relative overflow-hidden rounded-[1.45rem] sm:rounded-[2.15rem]">
            <div className="booking-glow absolute inset-0" />

            <div className="relative z-10 grid min-h-[42rem] gap-6 p-5 text-white sm:min-h-[43rem] sm:p-8 lg:min-h-[44rem] lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
              <div className="flex flex-col justify-between gap-8">
                <div>
                  <p className="inline-flex rounded-full border border-white/28 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-xl">
                    One click for you
                  </p>

                  <h2 className="mt-6 max-w-3xl text-[2.65rem] font-black leading-[0.9] tracking-tight min-[390px]:text-[3.1rem] sm:text-6xl lg:text-[4.65rem]">
                    From discovery to action without the confusion.
                  </h2>

                  <p className="mt-5 max-w-xl text-sm font-semibold leading-6 text-white/78 sm:text-lg sm:leading-8">
                    Addressor turns a place you like into a saved plan, booking
                    request, or business contact — without jumping between old
                    posts and scattered messages.
                  </p>
                </div>

                <div className="grid gap-3">
                  {bookingSteps.map(([number, title, text]) => (
                    <div
                      key={number}
                      className="booking-step rounded-[1.35rem] border border-white/18 bg-black/18 p-3.5 shadow-2xl backdrop-blur-2xl sm:p-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1ca8cb] text-sm font-black text-white shadow-xl">
                          {number}
                        </span>
                        <div>
                          <h3 className="text-base font-black sm:text-lg">{title}</h3>
                          <p className="mt-0.5 text-xs font-semibold leading-5 text-white/70 sm:text-sm sm:leading-6">
                            {text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="action-card ml-auto w-full max-w-[38rem]">
                  <div className="rounded-[2rem] border border-white/18 bg-white/16 p-4 shadow-2xl backdrop-blur-2xl sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/58">
                          Selected plan
                        </p>
                        <h3 className="mt-2 text-3xl font-black leading-none tracking-tight sm:text-4xl">
                          Dinner in Kigali
                        </h3>
                        <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/70">
                          A clear next step after discovering a trusted place.
                        </p>
                      </div>

                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#292929] shadow-xl">
                        ✓
                      </span>
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      {trustSignals.map((item) => (
                        <div
                          key={item}
                          className="rounded-full border border-white/16 bg-black/18 px-4 py-3 text-center text-xs font-black backdrop-blur-xl"
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Link
                        href="/signup"
                        className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-sm font-black text-[#292929] shadow-2xl transition hover:-translate-y-1"
                      >
                        Save plan
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1ca8cb] text-white">
                          ↗
                        </span>
                      </Link>

                      <Link
                        href="/business-login"
                        className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:-translate-y-1"
                      >
                        Contact business
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
                   <div
                    className="rounded-[1.6rem] border p-5 shadow-2xl"
                    style={{
                        background: "var(--book-frame)",
                        borderColor: "var(--book-border)",
                        color: "var(--book-text)",
                    }}
                    >
                    <p
                        className="text-xs font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--book-muted)" }}
                    >
                        User benefit
                    </p>

                    <h4 className="mt-3 text-2xl font-black tracking-tight">
                        Less guessing
                    </h4>

                    <p
                        className="mt-2 text-sm font-semibold leading-6"
                        style={{ color: "var(--book-muted)" }}
                    >
                        One clear path from idea to a trusted option.
                    </p>
                    </div>

                    <div className="rounded-[1.6rem] bg-[#1ca8cb] p-5 text-white shadow-2xl">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/70">
                        Business benefit
                      </p>
                      <h4 className="mt-3 text-2xl font-black tracking-tight">
                        More action
                      </h4>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/78">
                        Visibility turns into contact, booking, and saved intent.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[1.6rem] border border-white/16 bg-black/20 p-4 text-white shadow-2xl backdrop-blur-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-black">Ready in one flow</p>
                      <div className="flex -space-x-2">
                        {["Eat", "Stay", "Go"].map((item) => (
                          <span
                            key={item}
                            className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-white text-[0.65rem] font-black text-[#292929]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
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