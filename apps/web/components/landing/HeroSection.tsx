"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = ["Places", "Events", "Stays", "Business"];
const chips = ["Restaurants", "Stays", "Events"];

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4V2M12 22v-2M4.93 4.93 3.52 3.52M20.48 20.48l-1.41-1.41M4 12H2M22 12h-2M4.93 19.07l-1.41 1.41M20.48 3.52l-1.41 1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.2A7.7 7.7 0 0 1 9.8 3a8.9 8.9 0 1 0 11.2 11.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5">
      <span
        className={[
          "absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition duration-300",
          open ? "translate-y-[7px] rotate-45" : "",
        ].join(" ")}
      />
      <span
        className={[
          "absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition duration-300",
          open ? "opacity-0" : "opacity-100",
        ].join(" ")}
      />
      <span
        className={[
          "absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition duration-300",
          open ? "-translate-y-[7px] -rotate-45" : "",
        ].join(" ")}
      />
    </span>
  );
}

function HeroThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("addressor-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = stored ? stored === "dark" : prefersDark;

    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  }, []);

  function toggleTheme() {
    const next = !dark;

    setDark(next);
    localStorage.setItem("addressor-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-10 w-10 place-items-center rounded-full border shadow-xl backdrop-blur-xl transition hover:scale-105 active:scale-95 sm:h-11 sm:w-11"
      style={{
        background: dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.92)",
        borderColor: dark ? "rgba(255,255,255,0.18)" : "rgba(16,16,16,0.12)",
        color: dark ? "#f6f6f6" : "#292929",
      }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section id="hero" className="addressor-hero relative overflow-hidden">
      <style>{`
        .addressor-hero {
          --hero-bg: transparent;
          --hero-text: #101010;
          --hero-border: rgba(16,16,16,.12);
          --hero-frame: rgba(255,255,255,.92);
          --hero-primary: #1ca8cb;
          background: var(--hero-bg);
          color: var(--hero-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .addressor-hero,
        [data-theme="dark"] .addressor-hero {
          --hero-text: #f6f6f6;
          --hero-border: rgba(246,246,246,.13);
          --hero-frame: rgba(41,41,41,.92);
        }

        @keyframes heroImageMotion {
          0%, 100% { transform: scale(1.02) translate3d(0,0,0); }
          50% { transform: scale(1.055) translate3d(-1%,-.7%,0); }
        }

        @keyframes arrowBounce {
          50% { transform: translateY(3px); }
        }

        .hero-photo {
          background-image:
            linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.28) 48%, rgba(0,0,0,.46)),
            url("/landing/addressor-hero.webp");
          background-size: cover;
          background-position: center;
          animation: heroImageMotion 18s ease-in-out infinite;
        }

        .hero-photo-fallback {
          background:
            linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.28) 48%, rgba(0,0,0,.46)),
            linear-gradient(135deg, #4d4d4d, #333333 45%, #151515);
        }

        .hero-stage {
          border-radius: 1.45rem;
        }

        .hero-inner {
          min-height: 620px;
        }

        .top-right-notch {
          position: absolute;
          top: -1px;
          right: -1px;
          width: 17.75rem;
          height: 5.55rem;
          background: var(--hero-frame);
          border-bottom-left-radius: 2.35rem;
          z-index: 21;
        }

        .top-right-notch::before {
          content: "";
          position: absolute;
          left: -2.45rem;
          top: 0;
          width: 2.45rem;
          height: 2.45rem;
          border-top-right-radius: 2.45rem;
          box-shadow: 1.2rem -1.2rem 0 1.16rem var(--hero-frame);
        }

        .top-right-notch::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: -2.45rem;
          width: 2.45rem;
          height: 2.45rem;
          border-top-right-radius: 2.45rem;
          box-shadow: 1.2rem -1.2rem 0 1.16rem var(--hero-frame);
        }

        .bottom-left-notch {
          position: absolute;
          left: -1px;
          bottom: -1px;
          width: 18.85rem;
          height: 5.25rem;
          background: var(--hero-frame);
          border-top-right-radius: 2.45rem;
          z-index: 21;
        }

        .bottom-left-notch::before {
          content: "";
          position: absolute;
          left: 0;
          top: -2.45rem;
          width: 2.45rem;
          height: 2.45rem;
          border-bottom-left-radius: 2.45rem;
          box-shadow: -1.2rem 1.2rem 0 1.16rem var(--hero-frame);
        }

        .bottom-left-notch::after {
          content: "";
          position: absolute;
          right: -2.45rem;
          bottom: 0;
          width: 2.45rem;
          height: 2.45rem;
          border-bottom-left-radius: 2.45rem;
          box-shadow: -1.2rem 1.2rem 0 1.16rem var(--hero-frame);
        }

        .scroll-arrow {
          animation: arrowBounce 1.25s ease-in-out infinite;
        }

        @media (min-width: 640px) {
          .hero-stage { border-radius: 1.75rem; }
          .hero-inner { min-height: clamp(620px, calc(100svh - 2.5rem), 700px); }
        }

        @media (min-width: 1024px) {
          .hero-stage { border-radius: 2.15rem; }
          .hero-inner { min-height: calc(100vh - 3rem); }
        }

        @media (max-width: 1023px) {
          .top-right-notch,
          .bottom-left-notch {
            display: none;
          }

          .hero-stage {
            border-radius: 1.7rem;
          }

          .hero-photo {
            background-position: center top;
          }
        }

        @media (max-width: 399px) {
          .hero-inner { min-height: 600px; }
          .hero-stage { border-radius: 1.25rem; }
        }

        @media (max-width: 360px) {
          .hero-inner { min-height: 580px; }
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]">
        <div className="imigongo-pattern h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-[96rem] px-2 py-2 sm:px-5 sm:py-5 lg:px-7">
        <div
          className="overflow-hidden rounded-[1.7rem] border p-1.5 shadow-2xl sm:rounded-[2.75rem] sm:p-2"
          style={{
            background: "var(--hero-frame)",
            borderColor: "var(--hero-border)",
          }}
        >
          <div className="relative min-w-0 p-1 sm:p-2">
            <div className="hero-stage relative overflow-hidden">
              <div className="hero-photo-fallback absolute inset-0" />
              <div className="hero-photo absolute inset-0" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(28,168,203,.2),transparent_18rem),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.34))]" />

              <div className="top-right-notch hidden lg:block" />
              <div className="bottom-left-notch hidden lg:block" />

              <header className="absolute left-3 right-3 top-3 z-40 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    href="#hero"
                    className="flex min-w-0 items-center gap-2 rounded-full border bg-white/14 px-3 py-2 text-sm font-black text-white backdrop-blur-xl"
                    style={{ borderColor: "rgba(255,255,255,.24)" }}
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                      style={{ background: "var(--hero-primary)" }}
                    >
                      A
                    </span>
                    <span className="hidden min-[360px]:inline">Addressor</span>
                  </Link>

                  <div
                    className="hidden items-center gap-1 rounded-full border p-1 shadow-2xl backdrop-blur-2xl lg:flex"
                    style={{
                      background: "rgba(255,255,255,.18)",
                      borderColor: "rgba(255,255,255,.28)",
                    }}
                  >
                    {navItems.map((item, index) => (
                      <Link
                        key={item}
                        href="#discover"
                        className="rounded-full border px-4 py-2 text-sm font-black text-white"
                        style={{
                          background:
                            index === 0
                              ? "rgba(16,16,16,.44)"
                              : "rgba(255,255,255,.08)",
                          borderColor: "rgba(255,255,255,.22)",
                        }}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="relative z-40 ml-auto flex items-center gap-2">
                  <HeroThemeToggle />

                  <button
                    type="button"
                    onClick={() => setMenuOpen((current) => !current)}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    className="grid h-10 w-10 place-items-center rounded-full border bg-white/90 text-[#292929] shadow-xl backdrop-blur-xl transition hover:scale-105 active:scale-95 lg:hidden"
                  >
                    <MenuIcon open={menuOpen} />
                  </button>

                  <Link
                    href="/business-login"
                    className="hidden items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-black text-[#292929] shadow-2xl lg:inline-flex"
                  >
                    List your business
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full text-white"
                      style={{ background: "var(--hero-primary)" }}
                    >
                      ↗
                    </span>
                  </Link>
                </div>

                <div
                  className={[
                    "absolute left-0 right-0 top-[3.35rem] z-30 overflow-hidden rounded-[1.5rem] border bg-white/95 p-2 text-[#292929] shadow-2xl backdrop-blur-2xl transition-all duration-300 lg:hidden",
                    menuOpen
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-3 opacity-0",
                  ].join(" ")}
                >
                  {[
                    ["Discover", "#hero"],
                    ["Compare categories", "#discover"],
                    ["Book or save", "#book"],
                    ["List your business", "/business-login"],
                  ].map(([item, href]) => (
                    <Link
                      key={item}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition hover:bg-[#1ca8cb]/10"
                    >
                      {item}
                      <span className="text-[#1ca8cb]">↗</span>
                    </Link>
                  ))}
                </div>
              </header>

              <div className="hero-inner relative z-10 hidden gap-6 p-4 pb-28 pt-24 text-white sm:p-7 sm:pb-28 sm:pt-28 lg:grid lg:grid-cols-[minmax(0,0.98fr)_30rem] lg:items-center lg:p-10 lg:pb-28 lg:pt-32 xl:grid-cols-[minmax(0,1fr)_34rem]">
                <div className="max-w-5xl">
                  <div className="flex flex-wrap gap-2">
                    {chips.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/28 bg-white/10 px-3 py-2 text-[0.68rem] font-black backdrop-blur-xl sm:px-4 sm:text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <h1 className="mt-5 max-w-5xl text-[2.35rem] font-black leading-[0.88] tracking-tight text-white sm:text-5xl lg:text-[4.2rem] xl:text-[5rem]">
                    Decide Where To Go
                    <br />
                    Without Guessing.
                  </h1>

                  <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/82 sm:text-lg sm:leading-8">
                    Discover trusted restaurants, stays, nightlife, and events
                    in Rwanda with real visuals, mood, availability, and booking
                    confidence.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-black text-[#292929] shadow-2xl transition hover:scale-[1.02]"
                    >
                      Explore Kigali
                      <span
                        className="grid h-7 w-7 place-items-center rounded-full text-white"
                        style={{ background: "var(--hero-primary)" }}
                      >
                        ↗
                      </span>
                    </Link>

                    <Link
                      href="/business-login"
                      className="inline-flex items-center justify-center rounded-full border border-white/28 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/16"
                    >
                      List your business
                    </Link>
                  </div>
                </div>

                <div className="w-full lg:self-center">
                  <div className="overflow-hidden rounded-[2rem] border border-white/18 bg-black/24 shadow-2xl backdrop-blur-2xl">
                    <div className="border-b border-white/10 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#1ca8cb]">
                            Explore with clarity
                          </p>

                          <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                            Discover Rwanda with confidence.
                          </h3>
                        </div>

                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#292929] shadow-xl">
                          ✓
                        </span>
                      </div>

                      <p className="mt-4 text-sm font-semibold leading-6 text-white/72 sm:text-base sm:leading-7">
                        Find places by mood, category, trust, availability, and
                        real atmosphere before making a decision.
                      </p>
                    </div>

                    <div className="grid gap-px bg-white/10 sm:grid-cols-3">
                      {[
                        ["01", "Choose faster", "Find places by mood, category, and location."],
                        ["02", "Trust first", "See signals before spending time or money."],
                        ["03", "Act clearly", "Save, book, or contact without guessing."],
                      ].map(([number, title, text]) => (
                        <div key={number} className="bg-black/12 p-5 backdrop-blur-xl">
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1ca8cb] text-sm font-black text-white shadow-xl">
                            {number}
                          </span>

                          <h4 className="mt-5 text-lg font-black text-white">
                            {title}
                          </h4>

                          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-white/10 p-5 sm:p-6">
                      {[
                        "Updated daily",
                        "Trusted places",
                        "Real visuals",
                        "Live experiences",
                      ].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-black text-white/82 backdrop-blur-xl"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-inner relative z-10 flex flex-col justify-center px-5 pb-24 pt-24 text-white lg:hidden">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap gap-2">
                    {chips.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/24 bg-white/10 px-3 py-2 text-[0.65rem] font-black backdrop-blur-xl"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <h1 className="mt-5 text-[2.65rem] font-black leading-[0.9] tracking-tight text-white min-[380px]:text-[3rem] sm:text-[4.2rem] md:max-w-3xl md:text-[5.2rem]">
                    Decide Where To Go Without Guessing.
                  </h1>

                  <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base md:text-lg md:leading-8">
                    Discover trusted places in Rwanda using real visuals,
                    atmosphere, trust signals, and booking confidence.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 min-[430px]:flex-row">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-sm font-black text-[#292929] shadow-2xl"
                    >
                      Explore Addressor
                      <span
                        className="grid h-7 w-7 place-items-center rounded-full text-white"
                        style={{ background: "var(--hero-primary)" }}
                      >
                        ↗
                      </span>
                    </Link>

                    <Link
                      href="/business-login"
                      className="inline-flex items-center justify-center rounded-full border border-white/24 bg-white/10 px-5 py-4 text-sm font-black text-white backdrop-blur-xl"
                    >
                      List your business
                    </Link>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-2">
                    {["Trusted places", "Real visuals", "Updated daily"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/18 bg-black/16 px-4 py-2 text-xs font-black text-white/78 backdrop-blur-xl"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2.5 left-2.5 z-30 hidden items-center gap-3 rounded-full bg-white px-4 py-3 text-[#292929] shadow-2xl lg:flex">
                <div className="flex -space-x-2">
                  {["F", "S", "E"].map((item) => (
                    <span
                      key={item}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white bg-[#f6f6f6] text-xs font-black"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <p className="text-sm font-black">Food, stays, events</p>
              </div>

              <Link
                href="#discover"
                className="absolute bottom-3 right-3 z-30 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-xs font-black text-white shadow-2xl backdrop-blur-xl lg:hidden"
              >
                Scroll
                <span className="scroll-arrow">↓</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}