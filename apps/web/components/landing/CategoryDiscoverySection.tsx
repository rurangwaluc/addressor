"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Category = {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  className: string;
};

const categories: Category[] = [
  {
    eyebrow: "Eat",
    title: "Restaurants",
    text: "Food spots with real atmosphere, menus, mood, and trusted signals.",
    image: "/landing/category-restaurants.webp",
    className: "lg:col-span-7",
  },
  {
    eyebrow: "Stay",
    title: "Stays",
    text: "Hotels, guest houses, apartments, and visitor-ready places.",
    image: "/landing/category-stays.webp",
    className: "lg:col-span-5",
  },
  {
    eyebrow: "Attend",
    title: "Events",
    text: "What is happening tonight, this weekend, and this month.",
    image: "/landing/category-events.webp",
    className: "lg:col-span-5",
  },
  {
    eyebrow: "Go out",
    title: "Nightlife",
    text: "Lounges, bars, music, and social places you can trust.",
    image: "/landing/category-nightlife.webp",
    className: "lg:col-span-7",
  },
];

export default function CategoryDiscoverySection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.16 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="discover"
      className="category-section relative overflow-hidden"
    >
      <style>{`
        .category-section {
          --section-text: #101010;
          --section-muted: rgba(16,16,16,.58);
          --section-card: rgba(255,255,255,.92);
          --section-card-soft: rgba(255,255,255,.72);
          --section-border: rgba(16,16,16,.10);
          --section-primary: #1ca8cb;
          background: transparent;
          color: var(--section-text);
          font-family: var(--font-quicksand), system-ui, sans-serif;
        }

        .dark .category-section,
        [data-theme="dark"] .category-section {
          --section-text: #f6f6f6;
          --section-muted: rgba(246,246,246,.62);
          --section-card: rgba(41,41,41,.9);
          --section-card-soft: rgba(41,41,41,.68);
          --section-border: rgba(246,246,246,.12);
        }

        .section-heading {
          opacity: 0;
          transform: translateY(22px);
          filter: blur(8px);
          transition:
            opacity .75s cubic-bezier(.2,.8,.2,1),
            transform .75s cubic-bezier(.2,.8,.2,1),
            filter .75s cubic-bezier(.2,.8,.2,1);
        }

        .section-heading.is-visible {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        .category-card {
          opacity: 0;
          transform: translateY(34px) scale(.985);
          filter: blur(10px);
          transition:
            opacity .75s cubic-bezier(.2,.8,.2,1),
            transform .75s cubic-bezier(.2,.8,.2,1),
            filter .75s cubic-bezier(.2,.8,.2,1);
        }

        .category-card.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }

        .category-card:nth-child(1) { transition-delay: .08s; }
        .category-card:nth-child(2) { transition-delay: .14s; }
        .category-card:nth-child(3) { transition-delay: .20s; }
        .category-card:nth-child(4) { transition-delay: .26s; }

        .category-card-image {
          transition: transform .9s cubic-bezier(.2,.8,.2,1);
        }

        .category-card:hover .category-card-image {
          transform: scale(1.06);
        }

        @media (max-width: 1023px) {
          .category-card {
            min-height: 17rem;
          }
        }

        @media (max-width: 767px) {
          .category-card {
            min-height: 15.75rem;
          }
        }

        @media (max-width: 399px) {
          .category-card {
            min-height: 14.5rem;
          }
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]">
        <div className="imigongo-pattern h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-[96rem] px-2 pb-2 pt-0 sm:px-5 sm:pb-5 lg:px-7">
        <div
          className="overflow-hidden rounded-[1.7rem] border p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2.75rem] sm:p-6 md:p-7 lg:p-10"
          style={{
            background: "var(--section-card)",
            borderColor: "var(--section-border)",
          }}
        >
          <div
            className={[
              "section-heading grid gap-4 md:grid-cols-[1fr_0.75fr] md:items-end",
              visible ? "is-visible" : "",
            ].join(" ")}
          >
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--section-muted)" }}
              >
                Best categories
              </p>

              <h2 className="mt-3 max-w-3xl text-[2.35rem] font-black leading-[0.92] tracking-tight min-[390px]:text-[2.75rem] sm:text-5xl lg:text-[4.35rem]">
                Addressor discovery
              </h2>
            </div>

            <p
              className="max-w-xl text-sm font-semibold leading-7 sm:text-base lg:text-lg lg:leading-8"
              style={{ color: "var(--section-muted)" }}
            >
              Choose where to eat, stay, attend, or go out using visual cards
              instead of long lists and random posts.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-12 lg:gap-5">
            {categories.map((item) => (
              <Link
                key={item.title}
                href="/signup"
                className={[
                  "category-card group relative overflow-hidden rounded-[1.45rem] border shadow-2xl sm:rounded-[1.7rem] lg:min-h-[21.5rem] lg:rounded-[2rem]",
                  item.className,
                  visible ? "is-visible" : "",
                ].join(" ")}
                style={{ borderColor: "var(--section-border)" }}
              >
                <div
                  className="category-card-image absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.74)),linear-gradient(90deg,rgba(0,0,0,.52),rgba(0,0,0,.08))]" />

                <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-4 text-white sm:p-5 lg:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/28 bg-white/14 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.16em] backdrop-blur-xl sm:px-4 sm:py-2 sm:text-xs">
                      {item.eyebrow}
                    </span>

                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#292929] shadow-xl transition group-hover:rotate-12 sm:h-11 sm:w-11">
                      ↗
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white/70 sm:text-sm">
                      {item.eyebrow}, Rwanda
                    </p>

                    <h3 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-white/76 sm:text-sm sm:leading-6">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div
            className="mt-5 flex flex-wrap gap-2 rounded-[1.35rem] border p-3 sm:hidden"
            style={{
              background: "var(--section-card-soft)",
              borderColor: "var(--section-border)",
            }}
          >
            {["Visual-first", "Easy choice", "Rwanda-ready"].map((item) => (
              <span
                key={item}
                className="rounded-full border px-3 py-2 text-[0.68rem] font-black"
                style={{
                  borderColor: "var(--section-border)",
                  color: "var(--section-muted)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}