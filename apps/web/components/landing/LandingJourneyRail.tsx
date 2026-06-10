"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  { number: "01", label: "Discover", text: "Hero introduction.", href: "#hero" },
  { number: "02", label: "Compare", text: "Browse categories.", href: "#discover" },
  { number: "03", label: "Book", text: "Save or book places.", href: "#book" },
  { number: "04", label: "Business", text: "Tools for owners.", href: "#business" },
  { number: "05", label: "Trust", text: "Why users trust it.", href: "#trust" },
];

function smoothScrollTo(targetId: string) {
  const target = document.getElementById(targetId.replace("#", ""));
  if (!target) return;

  const startY = window.scrollY;
  const targetY = target.getBoundingClientRect().top + window.scrollY;
  const distance = targetY - startY;
  const duration = 950;
  let startTime: number | null = null;

  function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animate(time: number) {
    if (startTime === null) startTime = time;

    const progress = Math.min((time - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * ease(progress));

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

export default function LandingJourneyRail() {
  const [active, setActive] = useState("hero");
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function updateActive() {
      const marker = window.scrollY + window.innerHeight * 0.45;

      const current =
        steps
          .map((step) => {
            const element = document.getElementById(step.href.replace("#", ""));
            if (!element) return null;

            return {
              id: step.href.replace("#", ""),
              top: element.offsetTop,
            };
          })
          .filter(Boolean)
          .reverse()
          .find((item) => item && marker >= item.top)?.id || "hero";

      setActive(current);
    }

    function handleScroll() {
      updateActive();
      setVisible(true);

      if (timerRef.current) window.clearTimeout(timerRef.current);

      timerRef.current = window.setTimeout(() => {
        if (!hovered) setVisible(false);
      }, 700);
    }

    updateActive();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateActive);

      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [hovered]);

  return (
    <aside
      className={[
        "journey-rail pointer-events-none fixed left-[max(1.75rem,calc((100vw-96rem)/2+1.75rem))] top-1/2 z-50 hidden -translate-y-1/2 transition-all duration-500 lg:block",
        visible || hovered
          ? "translate-x-0 opacity-100"
          : "-translate-x-12 opacity-0",
      ].join(" ")}
      onMouseEnter={() => {
        setHovered(true);
        setVisible(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setVisible(false);
      }}
    >
      <style>{`
        .journey-rail {
          --rail-bg: rgba(255,255,255,.88);
          --rail-text: #101010;
          --rail-muted: rgba(16,16,16,.62);
          --rail-border: rgba(16,16,16,.12);
          --rail-soft: #f6f6f6;
          --rail-primary: #1ca8cb;
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .journey-rail,
        [data-theme="dark"] .journey-rail {
          --rail-bg: rgba(41,41,41,.88);
          --rail-text: #f6f6f6;
          --rail-muted: rgba(246,246,246,.68);
          --rail-border: rgba(246,246,246,.13);
          --rail-soft: #292929;
        }
      `}</style>

      <nav
        className="pointer-events-auto rounded-full border px-3 py-4 shadow-2xl backdrop-blur-2xl"
        style={{
          background: "var(--rail-bg)",
          borderColor: "var(--rail-border)",
        }}
        aria-label="Landing journey"
      >
        <div className="flex flex-col items-center">
          {steps.map((step, index) => {
            const id = step.href.replace("#", "");
            const isActive = active === id;

            return (
              <div key={step.number} className="relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => smoothScrollTo(step.href)}
                  className="group relative flex items-center"
                  aria-label={`Go to ${step.label}`}
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full border text-xs font-black transition duration-300 group-hover:scale-105"
                    style={{
                      background: isActive ? "var(--rail-primary)" : "var(--rail-soft)",
                      borderColor: isActive ? "var(--rail-primary)" : "var(--rail-border)",
                      color: isActive ? "#fff" : "var(--rail-muted)",
                      boxShadow: isActive
                        ? "0 12px 30px rgba(28,168,203,.35)"
                        : "none",
                    }}
                  >
                    {step.number}
                  </span>

                  <span
                    className="pointer-events-none absolute left-14 top-1/2 w-[11rem] -translate-y-1/2 translate-x-2 rounded-[1.25rem] border px-4 py-3 text-left opacity-0 shadow-2xl backdrop-blur-2xl transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                    style={{
                      background: "var(--rail-bg)",
                      borderColor: "var(--rail-border)",
                    }}
                  >
                    <span
                      className="block text-sm font-black"
                      style={{ color: "var(--rail-text)" }}
                    >
                      {step.label}
                    </span>

                    <span
                      className="mt-1 block text-xs font-bold leading-5"
                      style={{ color: "var(--rail-muted)" }}
                    >
                      {step.text}
                    </span>
                  </span>
                </button>

                {index < steps.length - 1 ? (
                  <span
                    className="h-8 w-px"
                    style={{ background: "var(--rail-border)" }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}