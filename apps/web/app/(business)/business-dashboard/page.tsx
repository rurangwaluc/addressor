"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";
import BusinessNav from "@/components/business/BusinessNav";
import type { AccessContext } from "@/lib/authRedirect";
import {
  getCurrentAccessContext,
  getStoredAccessContext,
  getStoredAccessToken,
} from "@/lib/authSession";
import {
  chooseActiveBusiness,
  getBusinessId,
  saveActiveBusinessId,
} from "@/lib/businessSession";

type BusinessSummary = NonNullable<AccessContext["activeBusiness"]>;

function getBusinessRoleLabel(role: BusinessSummary["role"]) {
  if (role === "business_owner") return "Owner";
  if (role === "business_manager") return "Manager";
  return "Team member";
}

function getSetupItems(business: BusinessSummary | null) {
  return [
    {
      title: "Business account",
      text: business ? "Your owner access is ready." : "Checking business access.",
      done: Boolean(business),
      action: "Ready",
    },
    {
      title: "Basic profile",
      text:
        business?.onboardingStatus === "completed"
          ? "Name, type, location, and contact were added."
          : "Finish the basic profile first.",
      done: business?.onboardingStatus === "completed",
      action: business?.onboardingStatus === "completed" ? "Done" : "Finish",
    },
    {
      title: "Opening times",
      text: "Add when customers can visit or contact you.",
      done: false,
      action: "Add hours",
    },
    {
      title: "Real photos",
      text: "Add clear photos that help people choose faster.",
      done: false,
      action: "Add photos",
    },
    {
      title: "Customer actions",
      text: "Prepare calls, WhatsApp, directions, and requests.",
      done: false,
      action: "Set actions",
    },
  ];
}

function DashboardLoading() {
  return (
    <main
      className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
      style={{ color: "var(--text)" }}
    >
      <section className="mx-auto w-full max-w-7xl">
        <div
          className="h-[70vh] rounded-[2rem] border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        />
      </section>
    </main>
  );
}

export default function BusinessDashboardPage() {
  const [access, setAccess] = useState<AccessContext | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      const cachedAccess = getStoredAccessContext();

      if (cachedAccess && !cancelled) {
        setAccess(cachedAccess);
      }

      const token = getStoredAccessToken();

      if (!token) return;

      try {
        const freshAccess = await getCurrentAccessContext(token);

        if (!cancelled) {
          setAccess(freshAccess);
        }
      } catch {
        // RequireAccess handles expired access.
      }
    }

    loadAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  const business = chooseActiveBusiness(access?.businesses);
  const setupItems = useMemo(() => getSetupItems(business), [business]);
  const completedCount = setupItems.filter((item) => item.done).length;
  const setupPercent = Math.round((completedCount / setupItems.length) * 100);
  const needsAttention = setupItems.filter((item) => !item.done);

  function switchBusiness(businessId: string) {
    if (!access) return;

    const nextBusiness = access.businesses.find(
      (item) => getBusinessId(item) === businessId,
    );

    if (!nextBusiness) return;

    saveActiveBusinessId(businessId);

    setAccess({
      ...access,
      activeBusiness: nextBusiness,
    });
  }

  return (
    <RequireAccess mode="business">
      {!access ? (
        <DashboardLoading />
      ) : (
        <main
          className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
          style={{ color: "var(--text)" }}
        >
          
          <section className="relative mx-auto w-full max-w-7xl">
            <nav
              className="flex flex-col gap-3 rounded-[1.5rem] border p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
                    Addressor business
                  </span>
                  <span
                    className="block truncate text-xs font-bold"
                    style={{ color: "var(--muted)" }}
                  >
                    Daily owner board
                  </span>
                </span>
              </Link>

              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                {access?.businesses && access.businesses.length > 1 ? (
                  <label className="min-w-0">
                    <span className="sr-only">Switch business</span>
                    <select
                      value={business ? getBusinessId(business) : ""}
                      onChange={(event) => switchBusiness(event.target.value)}
                      className="max-w-[15rem] rounded-full border px-4 py-3 text-sm font-black outline-none"
                      style={{
                        background: "var(--surface-strong)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      {access.businesses.map((item) => (
                        <option key={getBusinessId(item)} value={getBusinessId(item)}>
                          {item.businessName}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <Link
                  href="/businesses"
                  className="rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Switch business
                </Link>

                <ThemeToggle />
                <LogoutButton />
              </div>
            </nav>

            <BusinessNav />

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
              <section className="grid gap-5">
                <div
                  className="rounded-[2rem] border p-5 shadow-2xl sm:p-7 lg:p-8"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="grid gap-4 min-[760px]:grid-cols-[1fr_18rem] min-[760px]:items-start sm:gap-6">
                    <div>
                      <p
                        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.24em]"
                        style={{ color: "var(--accent)" }}
                      >
                        Today
                      </p>

                      <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.06em] min-[390px]:text-4xl sm:text-5xl lg:text-6xl">
                        {business?.businessName ?? "Your business"}
                      </h1>

                      <p
                        className="mt-4 max-w-2xl text-sm font-semibold leading-7 sm:text-base"
                        style={{ color: "var(--muted)" }}
                      >
                        Your business is set up. Next, make it easier for people
                        to trust it, contact it, and choose it.
                      </p>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <span
                          className="rounded-full border px-4 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            background: "var(--surface-strong)",
                            borderColor: "var(--border)",
                            color: "var(--accent)",
                          }}
                        >
                          {business ? getBusinessRoleLabel(business.role) : "Checking"}
                        </span>

                        <span
                          className="rounded-full border px-4 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            background: "var(--surface-strong)",
                            borderColor: "var(--border)",
                          }}
                        >
                          {business?.onboardingStatus === "completed"
                            ? "Basic profile ready"
                            : "Profile not finished"}
                        </span>

                        <span
                          className="rounded-full border px-4 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            background: "var(--surface-strong)",
                            borderColor: "var(--border)",
                          }}
                        >
                          Customer page coming next
                        </span>
                      </div>
                    </div>

                    <div
                      className="rounded-[1.5rem] border p-5"
                      style={{
                        background: "var(--surface-strong)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <p
                        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.2em]"
                        style={{ color: "var(--muted)" }}
                      >
                        Profile strength
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <strong className="text-5xl font-black tracking-[-0.06em]">
                          {setupPercent}%
                        </strong>
                        <span
                          className="rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--accent)",
                          }}
                        >
                          {completedCount}/{setupItems.length} done
                        </span>
                      </div>

                      <div
                        className="mt-4 h-3 overflow-hidden rounded-full"
                        style={{ background: "var(--border)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${setupPercent}%`,
                            background: "var(--accent)",
                          }}
                        />
                      </div>

                      <p
                        className="mt-4 text-sm font-semibold leading-6"
                        style={{ color: "var(--muted)" }}
                      >
                        Stronger profiles should get more trust before customers
                        decide where to go.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                  {[
                    ["Profile views", "0", "People who opened your page"],
                    ["Saves", "0", "People who kept your place"],
                    ["Calls", "0", "Phone or WhatsApp interest"],
                    ["Directions", "0", "People asking how to reach you"],
                  ].map(([label, value, text]) => (
                    <article
                      key={label}
                      className="rounded-[1.35rem] border p-4 shadow-sm sm:rounded-[1.5rem] sm:p-5"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <p
                        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.18em]"
                        style={{ color: "var(--muted)" }}
                      >
                        {label}
                      </p>
                      <strong className="mt-3 block text-3xl font-black tracking-[-0.06em] sm:mt-4 sm:text-4xl">
                        {value}
                      </strong>
                      <p
                        className="mt-2 text-sm font-semibold leading-6"
                        style={{ color: "var(--muted)" }}
                      >
                        {text}
                      </p>
                    </article>
                  ))}
                </div>

                <div
                  className="rounded-[2rem] border p-5 shadow-xl sm:p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p
                        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                        style={{ color: "var(--accent)" }}
                      >
                        Needs attention
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                        Do these next to look ready for customers.
                      </h2>
                    </div>

                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full border px-5 py-3 whitespace-nowrap text-sm font-black transition hover:scale-[1.01]"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      View public landing
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 min-[680px]:grid-cols-3">
                    {needsAttention.slice(0, 3).map((item) => (
                      <article
                        key={item.title}
                        className="rounded-[1.5rem] border p-5"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <span
                          className="rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--accent)",
                          }}
                        >
                          {item.action}
                        </span>

                        <h3 className="mt-5 text-xl font-black tracking-[-0.04em]">
                          {item.title}
                        </h3>

                        <p
                          className="mt-3 text-sm font-semibold leading-6"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.text}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[2rem] border p-5 shadow-xl sm:p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p
                    className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Quick actions
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      ["Edit profile", "/business-profile"],
                      ["Add photos", "/business-photos"],
                      ["Set hours", "/business-hours"],
                      ["Open settings", "/business-settings"],
                    ].map(([label, href]) => (
                      <Link
                        key={label}
                        href={href}
                        className="rounded-[1.15rem] border p-3 whitespace-nowrap text-sm font-black transition hover:scale-[1.01] sm:rounded-[1.25rem] sm:p-4"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="grid gap-5">
                <section
                  className="rounded-[2rem] border p-5 shadow-xl sm:p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p
                    className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Readiness checklist
                  </p>

                  <div className="mt-5 grid gap-3">
                    {setupItems.map((item) => (
                      <div
                        key={item.title}
                        className="flex gap-3 rounded-[1.25rem] border p-4"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full whitespace-nowrap text-sm font-black"
                          style={{
                            background: item.done ? "var(--accent)" : "transparent",
                            color: item.done
                              ? "var(--accent-contrast)"
                              : "var(--text)",
                            border: item.done ? "none" : "1px solid var(--border)",
                          }}
                        >
                          {item.done ? "✓" : "–"}
                        </span>

                        <span>
                          <strong className="block whitespace-nowrap text-sm font-black">
                            {item.title}
                          </strong>
                          <span
                            className="mt-1 block text-sm font-semibold leading-6"
                            style={{ color: "var(--muted)" }}
                          >
                            {item.text}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  className="rounded-[2rem] border p-5 shadow-xl sm:p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p
                    className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Recent activity
                  </p>

                  <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                    Nothing needs a reply yet.
                  </h2>

                  <p
                    className="mt-3 text-sm font-semibold leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    Customer requests, messages, calls, and booking interest will
                    appear here when the public business page is connected.
                  </p>

                  <div className="mt-5 grid gap-2">
                    {["Booking requests", "Customer messages", "Missed interest"].map(
                      (item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                          style={{
                            background: "var(--surface-strong)",
                            borderColor: "var(--border)",
                          }}
                        >
                          <span>{item}</span>
                          <span style={{ color: "var(--muted)" }}>0</span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </main>
      )}
    </RequireAccess>
  );
}
