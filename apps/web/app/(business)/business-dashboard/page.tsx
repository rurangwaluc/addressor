"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import RequireAccess from "@/components/auth/RequireAccess";
import LogoutButton from "@/components/auth/LogoutButton";
import BusinessNav from "@/components/business/BusinessNav";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";
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

type OwnerSummary = {
  business: {
    id: string;
    displayName: string;
    legalName: string;
    slug: string;
    category: string;
    shortDescription: string | null;
    phone: string | null;
    email: string | null;
    websiteUrl: string | null;
    whatsappNumber: string | null;
    country: string;
    city: string;
    district: string | null;
    sector: string | null;
    addressLine: string | null;
    verificationStatus: string;
    onboardingStatus: string;
    subscriptionStatus: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
  };
  overview: {
    profileViews: number;
    newBookings: number;
    reviews: number;
    comments: number;
    menuItems: number;
    subscribers: number;
  };
  attention: Array<{
    title: string;
    text: string;
    action: string;
    href: string;
    priority: "high" | "medium" | "low";
  }>;
};

type OwnerSummaryResponse = {
  ok: true;
  data: OwnerSummary;
};

const emptyOverview: OwnerSummary["overview"] = {
  profileViews: 0,
  newBookings: 0,
  reviews: 0,
  comments: 0,
  menuItems: 0,
  subscribers: 0,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function getBusinessRoleLabel(role: BusinessSummary["role"]) {
  if (role === "business_owner") return "Owner";
  if (role === "business_manager") return "Manager";
  return "Team member";
}

function getBusinessName(business: BusinessSummary | null, summary: OwnerSummary | null) {
  return summary?.business.displayName ?? business?.businessName ?? "Your business";
}

function getProfileStrength(business: BusinessSummary | null, summary: OwnerSummary | null) {
  const currentBusiness = summary?.business;

  const items = [
    Boolean(business),
    business?.onboardingStatus === "completed" ||
      currentBusiness?.onboardingStatus === "completed",
    Boolean(currentBusiness?.coverImageUrl),
    Boolean(currentBusiness?.phone || currentBusiness?.whatsappNumber),
    Boolean(currentBusiness?.shortDescription),
    (summary?.overview.menuItems ?? 0) > 0,
  ];

  const done = items.filter(Boolean).length;

  return {
    done,
    total: items.length,
    percent: Math.round((done / items.length) * 100),
  };
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

function MetricCard({
  label,
  value,
  text,
  href,
}: {
  label: string;
  value: number;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.35rem] border p-4 transition hover:scale-[1.01] sm:rounded-[1.5rem] sm:p-5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      <p
        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </p>
      <strong className="mt-3 block text-3xl font-black tracking-[-0.06em] sm:mt-4 sm:text-4xl">
        {formatNumber(value)}
      </strong>
      <p
        className="mt-2 text-sm font-semibold leading-6"
        style={{ color: "var(--muted)" }}
      >
        {text}
      </p>
    </Link>
  );
}

export default function BusinessDashboardPage() {
  const [access, setAccess] = useState<AccessContext | null>(null);
  const [summary, setSummary] = useState<OwnerSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

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
  const businessId = business ? getBusinessId(business) : "";

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerSummary() {
      if (!businessId) return;

      setSummaryLoading(true);
      setSummaryError("");

      try {
        const response = await apiRequest<OwnerSummaryResponse>(
          `/businesses/${businessId}/owner-summary`,
          {
            method: "GET",
          },
        );

        if (!cancelled) {
          setSummary(response.data);
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
          setSummaryError("We could not load the owner summary. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    }

    loadOwnerSummary();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const overview = summary?.overview ?? emptyOverview;
  const profileStrength = useMemo(
    () => getProfileStrength(business, summary),
    [business, summary],
  );

  const attentionItems =
    summary?.attention.length
      ? summary.attention
      : [
          {
            title: "Business account is ready",
            text: "Your next customer actions will appear here as people view, book, review, or subscribe.",
            action: "Keep improving",
            href: "/business-profile",
            priority: "low" as const,
          },
        ];

  function switchBusiness(nextBusinessId: string) {
    if (!access) return;

    const nextBusiness = access.businesses.find(
      (item) => getBusinessId(item) === nextBusinessId,
    );

    if (!nextBusiness) return;

    saveActiveBusinessId(nextBusinessId);
    setSummary(null);
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
                    Addressor business
                  </span>
                  <span
                    className="block truncate text-xs font-bold"
                    style={{ color: "var(--muted)" }}
                  >
                    Owner control center
                  </span>
                </span>
              </Link>

              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                {access?.businesses && access.businesses.length > 1 ? (
                  <label className="min-w-0">
                    <span className="sr-only">Switch business</span>
                    <select
                      value={businessId}
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

            <div className="mt-4 grid gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
              <BusinessNav />

              <div className="min-w-0">
                {summaryError ? (
                  <p className="mb-5 rounded-[1rem] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300">
                    {summaryError}
                  </p>
                ) : null}

                <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
              <section className="grid gap-5">
                <div
                  className="rounded-[2rem] border p-5 sm:p-7 lg:p-8"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="grid gap-5 min-[760px]:grid-cols-[1fr_19rem] min-[760px]:items-start sm:gap-7">
                    <div>
                      <p
                        className="whitespace-nowrap text-xs font-black uppercase tracking-[0.24em]"
                        style={{ color: "var(--accent)" }}
                      >
                        Today
                      </p>

                      <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.06em] min-[390px]:text-4xl sm:text-5xl lg:text-6xl">
                        {getBusinessName(business, summary)}
                      </h1>

                      <p
                        className="mt-4 max-w-2xl text-sm font-semibold leading-7 sm:text-base"
                        style={{ color: "var(--muted)" }}
                      >
                        See what customers are doing, what needs a reply, and what
                        to improve so more people can choose your business faster.
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
                          {summaryLoading ? "Loading owner data" : "Real owner data"}
                        </span>

                        <span
                          className="rounded-full border px-4 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            background: "var(--surface-strong)",
                            borderColor: "var(--border)",
                          }}
                        >
                          {summary?.business.verificationStatus === "approved"
                            ? "Approved"
                            : "Needs review"}
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
                          {profileStrength.percent}%
                        </strong>
                        <span
                          className="rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--accent)",
                          }}
                        >
                          {profileStrength.done}/{profileStrength.total} done
                        </span>
                      </div>

                      <div
                        className="mt-4 h-3 overflow-hidden rounded-full"
                        style={{ background: "var(--border)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${profileStrength.percent}%`,
                            background: "var(--accent)",
                          }}
                        />
                      </div>

                      <p
                        className="mt-4 text-sm font-semibold leading-6"
                        style={{ color: "var(--muted)" }}
                      >
                        Complete profile, photos, contacts, description, and menu
                        to make customer decisions easier.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  <MetricCard
                    label="Profile views"
                    value={overview.profileViews}
                    text="People who opened your business page."
                    href="/business-dashboard"
                  />
                  <MetricCard
                    label="New bookings"
                    value={overview.newBookings}
                    text="Requests waiting for your reply."
                    href="/business-bookings"
                  />
                  <MetricCard
                    label="Reviews"
                    value={overview.reviews}
                    text="Customer feedback on your business."
                    href="/business-reviews"
                  />
                  <MetricCard
                    label="Comments"
                    value={overview.comments}
                    text="Conversations under customer reviews."
                    href="/business-reviews"
                  />
                  <MetricCard
                    label="Menu items"
                    value={overview.menuItems}
                    text="What customers can order or ask about."
                    href="/business-menu"
                  />
                  <MetricCard
                    label="Subscribers"
                    value={overview.subscribers}
                    text="People following business updates."
                    href="/business-subscribers"
                  />
                </div>

                <div
                  className="rounded-[2rem] border p-5 sm:p-6"
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
                        Fix what blocks customers from choosing you.
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
                    {attentionItems.slice(0, 3).map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="rounded-[1.5rem] border p-5 transition hover:scale-[1.01]"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      >
                        <span
                          className="rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black"
                          style={{
                            borderColor: "var(--border)",
                            color: item.priority === "high" ? "var(--accent)" : "var(--muted)",
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
                      </Link>
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
                    Growth actions
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      ["Improve profile", "/business-profile"],
                      ["Add menu", "/business-menu"],
                      ["Reply bookings", "/business-bookings"],
                      ["Check reviews", "/business-reviews"],
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
                    Customer activity
                  </p>

                  <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                    {overview.newBookings > 0
                      ? "New requests need your reply."
                      : "No new customer request yet."}
                  </h2>

                  <p
                    className="mt-3 text-sm font-semibold leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    This area will help owners respond faster to people who view,
                    book, review, comment, or follow the business.
                  </p>

                  <div className="mt-5 grid gap-2">
                    {[
                      ["New bookings", overview.newBookings, "/business-bookings"],
                      ["Reviews", overview.reviews, "/business-reviews"],
                      ["Comments", overview.comments, "/business-reviews"],
                      ["Subscribers", overview.subscribers, "/business-subscribers"],
                    ].map(([label, value, href]) => (
                      <Link
                        key={label}
                        href={String(href)}
                        className="flex items-center justify-between rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black"
                        style={{
                          background: "var(--surface-strong)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      >
                        <span>{label}</span>
                        <span style={{ color: "var(--muted)" }}>
                          {formatNumber(Number(value))}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section
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
                    Menu readiness
                  </p>

                  <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                    {overview.menuItems > 0
                      ? `${formatNumber(overview.menuItems)} item${
                          overview.menuItems === 1 ? "" : "s"
                        } listed.`
                      : "No menu item yet."}
                  </h2>

                  <p
                    className="mt-3 text-sm font-semibold leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    Menu is not only for restaurants. It can list meals, rooms,
                    services, offers, experiences, or anything customers need to
                    choose faster.
                  </p>

                  <Link
                    href="/business-menu"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 whitespace-nowrap text-sm font-black transition hover:scale-[1.01]"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-contrast)",
                    }}
                  >
                    Manage menu
                  </Link>
                </section>
              </aside>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}
    </RequireAccess>
  );
}
