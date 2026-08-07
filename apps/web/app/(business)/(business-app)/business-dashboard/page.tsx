"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";
import { getStoredAccessContext } from "@/lib/authSession";
import { chooseActiveBusiness, getBusinessId } from "@/lib/businessSession";

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

type ReadinessItem = {
  label: string;
  complete: boolean;
  href: string;
};

const priorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function getBusinessRoleLabel(role: BusinessSummary["role"]) {
  if (role === "business_owner") return "Owner";
  if (role === "business_manager") return "Manager";
  return "Team member";
}

function getStatusLabel(status: string) {
  return status
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getBusinessLocation(business: OwnerSummary["business"] | null) {
  if (!business) return "Location not loaded";

  return [business.sector, business.district, business.city]
    .filter(Boolean)
    .join(", ");
}

function buildReadinessItems(summary: OwnerSummary): ReadinessItem[] {
  const { business, overview } = summary;

  return [
    {
      label: "Account setup",
      complete: business.onboardingStatus === "completed",
      href: "/business-profile",
    },
    {
      label: "Cover photo",
      complete: Boolean(business.coverImageUrl),
      href: "/business-photos",
    },
    {
      label: "Clear description",
      complete: Boolean(business.shortDescription),
      href: "/business-profile",
    },
    {
      label: "Contact method",
      complete: Boolean(business.phone || business.whatsappNumber),
      href: "/business-profile",
    },
    {
      label: "Business location",
      complete: Boolean(business.city),
      href: "/business-profile",
    },
    {
      label: "Products or services",
      complete: overview.menuItems > 0,
      href: "/business-menu",
    },
  ];
}

function DashboardLoading() {
  return (
    <div className="grid gap-5" aria-live="polite" aria-busy="true">
      <section
        className="rounded-[1.5rem] border p-3 sm:rounded-[1.75rem] sm:p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <p
          className="text-xs font-black uppercase tracking-[0.22em]"
          style={{ color: "var(--accent)" }}
        >
          Owner control room
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl">
          Loading your business overview…
        </h1>
        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--muted)" }}>
          Your navigation remains available while the latest summary loads.
        </p>
      </section>

      <div
        className="h-52 rounded-[1.5rem] border sm:h-80 sm:rounded-[1.75rem]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      />
    </div>
  );
}

function SummaryUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      className="rounded-[1.5rem] border p-3 sm:rounded-[1.75rem] sm:p-6"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.22em]"
        style={{ color: "var(--accent)" }}
      >
        Overview unavailable
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">
        We could not load the business summary.
      </h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>
        No activity totals or readiness status are being shown because they may be
        inaccurate. Try loading the summary again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full px-5 py-3 whitespace-nowrap text-sm font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
      >
        Try again
      </button>
    </section>
  );
}

function NoActiveBusiness() {
  return (
    <section
      className="rounded-[1.5rem] border p-3 sm:rounded-[1.75rem] sm:p-6"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.22em]"
        style={{ color: "var(--accent)" }}
      >
        Business needed
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">
        Choose a business to manage.
      </h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>
        The dashboard needs an active business before it can show owner information.
      </p>
      <Link
        href="/businesses"
        prefetch
        className="mt-5 inline-flex rounded-full px-5 py-3 whitespace-nowrap text-sm font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
      >
        Choose business
      </Link>
    </section>
  );
}

function ActivityCard({
  label,
  value,
  detail,
  action,
  scope,
  href,
  urgent = false,
}: {
  label: string;
  value: number;
  detail: string;
  action: string;
  scope: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-[1rem] p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:flex sm:min-h-32 sm:flex-col sm:items-stretch sm:rounded-[1.1rem] sm:p-4"
      style={{
        background: urgent ? "var(--accent)" : "var(--surface-strong)",
        color: urgent ? "var(--accent-contrast)" : "var(--text)",
      }}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 sm:flex-nowrap sm:items-start sm:justify-between sm:gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">
          {label}
        </p>
        <span className="whitespace-nowrap text-[0.65rem] font-black opacity-60">
          {scope}
        </span>
      </div>
      <strong className="col-start-2 row-span-2 row-start-1 text-2xl font-black tracking-[-0.06em] sm:mt-2 sm:block sm:text-4xl">
        {formatNumber(value)}
      </strong>
      <p className="col-start-1 text-xs font-semibold leading-5 opacity-75 sm:mt-auto sm:pt-3 sm:text-sm">
        {detail}
      </p>
      <span className="col-span-2 mt-1 whitespace-nowrap text-xs font-black group-hover:underline sm:mt-3">
        {action}
      </span>
    </Link>
  );
}

export default function BusinessDashboardPage() {
  const [access, setAccess] = useState<AccessContext | null>(() =>
    getStoredAccessContext(),
  );
  const [summary, setSummary] = useState<OwnerSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const cachedAccess = getStoredAccessContext();

    if (cachedAccess) {
      setAccess(cachedAccess);
    }
  }, []);

  const business = chooseActiveBusiness(access?.businesses);
  const businessId = business ? getBusinessId(business) : "";

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerSummary() {
      if (!businessId) {
        setSummaryLoading(false);
        return;
      }

      setSummaryLoading(true);
      setSummaryError("");

      try {
        const response = await apiRequest<OwnerSummaryResponse>(
          `/businesses/${businessId}/owner-summary`,
          { method: "GET" },
        );

        if (!cancelled) {
          setSummary(response.data);
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
          setSummaryError("We could not load the owner summary.");
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
  }, [businessId, reloadKey]);

  const readinessItems = useMemo(
    () => (summary ? buildReadinessItems(summary) : []),
    [summary],
  );
  const completedReadiness = readinessItems.filter((item) => item.complete).length;
  const nextBestActions = readinessItems.filter((item) => !item.complete);
  const readinessPercent = readinessItems.length
    ? Math.round((completedReadiness / readinessItems.length) * 100)
    : 0;
  const attentionItems = useMemo(
    () =>
      summary
        ? [...summary.attention].sort(
            (first, second) =>
              priorityOrder[first.priority] - priorityOrder[second.priority],
          )
        : [],
    [summary],
  );

  if (!access) {
    return <DashboardLoading />;
  }

  if (!business) {
    return <NoActiveBusiness />;
  }

  if (summaryLoading && !summary) {
    return <DashboardLoading />;
  }

  if (summaryError || !summary) {
    return <SummaryUnavailable onRetry={() => setReloadKey((value) => value + 1)} />;
  }

  const location = getBusinessLocation(summary.business);
  const primaryAttention = attentionItems[0];
  const remainingAttention = attentionItems.slice(1);
  const hasNewRequests = summary.overview.newBookings > 0;

  return (
    <div className="grid gap-3 sm:gap-5">
      <section
        className="rounded-[1.5rem] border p-3 sm:rounded-[1.75rem] sm:p-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              Owner control room
            </p>
            <h1 className="mt-1.5 break-words text-2xl font-black tracking-[-0.06em] sm:mt-2 sm:text-4xl">
              {summary.business.displayName}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>
              {[summary.business.category, location].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span
              className="rounded-full px-2.5 py-1.5 whitespace-nowrap text-[0.7rem] font-black sm:px-3 sm:text-xs"
              style={{ background: "var(--surface-strong)" }}
            >
              {getBusinessRoleLabel(business.role)}
            </span>
            <span
              className="rounded-full px-2.5 py-1.5 whitespace-nowrap text-[0.7rem] font-black sm:px-3 sm:text-xs"
              style={{ background: "var(--surface-strong)" }}
            >
              {getStatusLabel(summary.business.verificationStatus)}
            </span>
            <span
              className="rounded-full px-2.5 py-1.5 whitespace-nowrap text-[0.7rem] font-black sm:px-3 sm:text-xs"
              style={{ background: "var(--surface-strong)" }}
            >
              {getStatusLabel(summary.business.subscriptionStatus)} plan
            </span>
          </div>
        </div>

        <div
          className="mt-4 border-t pt-4 sm:flex sm:items-center sm:gap-2"
          style={{
            borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
          }}
        >
          <p
            className="shrink-0 text-xs font-black uppercase tracking-[0.18em] sm:mr-1"
            style={{ color: "var(--muted)" }}
          >
            Quick actions
          </p>
          <div
            className="mt-1.5 grid min-w-0 grid-cols-3 gap-1.5 sm:mt-0 sm:flex sm:flex-wrap sm:gap-2"
            aria-label="Quick actions"
            role="navigation"
          >
            {[
              ["Edit profile", "Edit profile", "/business-profile"],
              ["Offerings", "Manage offerings", "/business-menu"],
              ["Requests", "Review requests", "/business-bookings"],
              ["Reviews", "Check reviews", "/business-reviews"],
              ["Photos", "Add photos", "/business-photos"],
            ].map(([mobileLabel, desktopLabel, href], index) => (
              <Link
                key={desktopLabel}
                href={href}
                prefetch
                className="min-w-0 rounded-full px-1.5 py-2 text-center whitespace-nowrap text-[0.65rem] font-black transition-colors hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3 sm:text-sm"
                style={{
                  background: index === 0 ? "var(--accent)" : "transparent",
                  color: index === 0 ? "var(--accent-contrast)" : "var(--text)",
                }}
              >
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{desktopLabel}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="rounded-[1.5rem] border p-3 sm:rounded-[1.75rem] sm:p-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-end sm:justify-between"
          style={{
            borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
          }}
        >
          <div>
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              Command center
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.04em] sm:text-2xl">
              What needs your attention
            </h2>
          </div>
          <p className="hidden text-xs font-bold sm:block" style={{ color: "var(--muted)" }}>
            Priorities, activity, and readiness
          </p>
        </div>

        <div className="mt-3 grid gap-4 sm:mt-5 sm:gap-6 xl:grid-cols-12">
          <div
            className="xl:col-span-7 xl:border-r xl:pr-6"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 45%, transparent)",
            }}
          >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: "var(--accent)" }}
              >
                Needs attention
              </p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em] sm:text-2xl">
                {primaryAttention
                  ? `${attentionItems.length} action${attentionItems.length === 1 ? "" : "s"} to handle`
                  : "Everything important is covered"}
              </h2>
            </div>
            <span
              className="hidden rounded-full border px-3 py-2 whitespace-nowrap text-xs font-black sm:inline-flex"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              {primaryAttention ? "Action needed" : "All clear"}
            </span>
          </div>

          {primaryAttention ? (
            <div className="mt-3 grid gap-2.5 sm:mt-5 sm:gap-3">
              <Link
                href={primaryAttention.href}
                prefetch
                className="rounded-[1.25rem] border border-l-4 p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:rounded-[1.5rem] sm:p-6"
                style={{
                  background: "var(--surface-strong)",
                  borderColor: "var(--border)",
                  borderLeftColor: "var(--accent)",
                  color: "var(--text)",
                }}
              >
                <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
                  First priority
                </span>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em] sm:text-2xl">
                  {primaryAttention.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>
                  {primaryAttention.text}
                </p>
                <span className="mt-4 inline-flex rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black sm:mt-5 sm:py-3" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
                  {primaryAttention.action}
                </span>
              </Link>

              {remainingAttention.length ? (
                <div className="grid gap-2">
                  {remainingAttention.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      prefetch
                      className="flex flex-col gap-2 rounded-[1rem] px-3 py-2.5 transition-colors hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:gap-3 sm:rounded-[1.1rem] sm:px-4 sm:py-3.5 sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        color: "var(--text)",
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block font-black">{item.title}</span>
                        <span
                          className="mt-1 block text-sm font-semibold leading-5"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.text}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-xs font-black" style={{ color: "var(--accent)" }}>
                        {item.action}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className="mt-3 rounded-[1.25rem] p-3 sm:mt-5 sm:rounded-[1.5rem] sm:p-6"
              style={{ background: "var(--surface-strong)" }}
            >
              <p className="text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>
                There are no new requests or setup issues in the current business summary.
              </p>
            </div>
          )}

          <div
            className="mt-3 border-t pt-3 sm:mt-5 sm:pt-5"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
            }}
          >
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: "var(--accent)" }}
                >
                  Next best actions
                </p>
                <h3 className="mt-1.5 text-lg font-black tracking-[-0.04em] sm:mt-2 sm:text-xl">
                  {nextBestActions.length
                    ? "Complete your business setup"
                    : "Your business setup is complete"}
                </h3>
              </div>
              <span
                className="whitespace-nowrap text-xs font-black"
                style={{ color: "var(--muted)" }}
              >
                {completedReadiness}/{readinessItems.length} complete
              </span>
            </div>

            {nextBestActions.length ? (
              <div className="mt-2 grid gap-1.5 sm:mt-4 sm:grid-cols-2 sm:gap-2">
                {nextBestActions.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch
                    className="flex items-center justify-between gap-3 rounded-[0.9rem] px-3 py-2.5 text-sm font-black transition-colors hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:py-3"
                    style={{
                      color: "var(--text)",
                    }}
                  >
                    <span>{item.label}</span>
                    <span
                      className="whitespace-nowrap text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      {item.complete ? "Complete" : "Add"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p
                className="mt-3 text-sm font-semibold leading-6"
                style={{ color: "var(--muted)" }}
              >
                Your key business details and customer information are in place.
              </p>
            )}
          </div>
          </div>

          <div className="grid gap-3 sm:gap-5 xl:col-span-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: "var(--accent)" }}
              >
                Business activity
              </p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em] sm:text-2xl">
                Customer activity
              </h2>
            </div>
            <p className="text-right text-xs font-bold" style={{ color: "var(--muted)" }}>
              Current and all-time
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <ActivityCard
              label="Requests waiting"
              value={summary.overview.newBookings}
              detail={
                hasNewRequests
                  ? "Ready for your response"
                  : "No request waiting"
              }
              action="Open requests"
              scope="Open now"
              href="/business-bookings"
              urgent={hasNewRequests}
            />
            <ActivityCard
              label="Profile views"
              value={summary.overview.profileViews}
              detail="Recorded business page visits"
              action="Manage profile"
              scope="All-time total"
              href="/business-profile"
            />
            <ActivityCard
              label="Reviews"
              value={summary.overview.reviews}
              detail={`${formatNumber(summary.overview.comments)} review comment${summary.overview.comments === 1 ? "" : "s"}`}
              action="Read reviews"
              scope="All-time total"
              href="/business-reviews"
            />
            <ActivityCard
              label="Subscribers"
              value={summary.overview.subscribers}
              detail="Active followers of updates"
              action="View subscribers"
              scope="All-time total"
              href="/business-subscribers"
            />
          </div>

          <div
            className="order-first border-b pb-3 sm:order-none sm:border-b-0 sm:border-t sm:pb-0 sm:pt-5"
            style={{
              borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
            }}
          >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div className="min-w-0">
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              Business readiness
            </p>
            <div className="mt-1.5 flex items-end gap-2 sm:mt-3 sm:gap-3">
              <strong className="text-3xl font-black tracking-[-0.06em]">
                {nextBestActions.length}
              </strong>
              <span
                className="pb-1 text-xs font-black"
                style={{ color: "var(--muted)" }}
              >
                {nextBestActions.length === 1 ? "item left" : "items left"} · {readinessPercent}% ready
              </span>
            </div>
              </div>
              <Link
                href="/business-profile"
                prefetch
                className="rounded-full border px-3 py-2.5 whitespace-nowrap text-xs font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-4"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                View profile
              </Link>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full sm:mt-3 sm:h-2"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${readinessPercent}%`,
                  background: "var(--accent)",
                }}
              />
            </div>

          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
