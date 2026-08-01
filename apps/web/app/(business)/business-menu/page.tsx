"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";
import BusinessNav from "@/components/business/BusinessNav";

export default function BusinessMenuPage() {
  return (
    <RequireAccess mode="business">
      <main
        className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
        style={{ color: "var(--text)" }}
      >
        <section className="relative mx-auto w-full max-w-7xl">
          <nav
            className="flex flex-col gap-3 rounded-[1.5rem] border p-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full whitespace-nowrap text-sm font-black"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                }}
              >
                A
              </span>

              <span className="min-w-0">
                <span className="block truncate whitespace-nowrap text-sm font-black">
                  Business menu
                </span>
                <span
                  className="block truncate text-xs font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  Products, services, offers, and items
                </span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
              <Link
                href="/business-dashboard"
                className="rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                Dashboard
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </nav>

          <div className="mt-4 grid gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
            <BusinessNav />

            <div className="min-w-0">
              <section
                className="rounded-[2rem] border p-5 sm:p-7 lg:p-8"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p
                      className="whitespace-nowrap text-xs font-black uppercase tracking-[0.24em]"
                      style={{ color: "var(--accent)" }}
                    >
                      Menu
                    </p>
                    <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] sm:text-5xl">
                      Manage what customers can choose.
                    </h1>
                    <p
                      className="mt-4 max-w-2xl text-sm font-semibold leading-7 sm:text-base"
                      style={{ color: "var(--muted)" }}
                    >
                      Add the meals, rooms, services, offers, products, or experiences
                      people should see before they contact your business.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-full px-5 py-3 whitespace-nowrap text-sm font-black"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-contrast)",
                    }}
                  >
                    Add item
                  </button>
                </div>
              </section>

              <section className="mt-5 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                <div
                  className="rounded-[2rem] border p-5 sm:p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p
                    className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Categories
                  </p>

                  <div className="mt-5 grid gap-3">
                    {["All items", "Popular", "Services", "Offers"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="rounded-[1.15rem] border px-4 py-3 text-left whitespace-nowrap text-sm font-black"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[2rem] border p-5 sm:p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p
                    className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Items
                  </p>

                  <div
                    className="mt-5 rounded-[1.5rem] border p-6 text-center"
                    style={{
                      background: "var(--surface-strong)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <h2 className="text-2xl font-black tracking-[-0.04em]">
                      No menu items yet.
                    </h2>
                    <p
                      className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6"
                      style={{ color: "var(--muted)" }}
                    >
                      Start with the most requested items. A clear menu saves customer
                      questions and helps owners get better requests.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </RequireAccess>
  );
}
