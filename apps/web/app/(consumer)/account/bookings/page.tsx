"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import CustomerReviewSection, {
  type CustomerReview,
  type ReviewEligibility,
} from "@/components/account/CustomerReviewSection";
import {
  RequestDetailRow,
  RequestDetailSection,
  RequestDrawerShell,
  RequestPagination,
  RequestStatusBadge,
} from "@/components/account/AccountRequestUI";

type Business = {
  id: string;
  displayName: string;
  slug: string;
  category: string;
  logoUrl: string | null;
  city: string;
};

type Booking = {
  id: string;
  businessId: string;
  requestType: string;
  message: string | null;
  preferredDate: string | null;
  confirmedDate: string | null;
  partySize: number | null;
  status: string;
  respondedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  business: Business;
  review?: CustomerReview | null;
  reviewEligibility?: ReviewEligibility;
};

type ListResponse = {
  ok: true;
  data: {
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
};

type DetailResponse = {
  ok: true;
  data: {
    booking: Booking;
  };
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-RW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function compactDate(value: string | null) {
  if (!value) return "No time provided";

  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function bookingTimeLabel(booking: Booking) {
  if (booking.status === "accepted" && booking.confirmedDate) {
    return `Confirmed ${compactDate(booking.confirmedDate)}`;
  }

  return `Requested ${compactDate(booking.preferredDate)}`;
}

function lifecycleRows(booking: Booking) {
  return [
    ["Sent", booking.createdAt],
    ["Responded", booking.respondedAt],
    ["Completed", booking.completedAt],
    ["Cancelled", booking.cancelledAt],
  ].filter((row): row is [string, string] => Boolean(row[1]));
}

export default function CustomerBookingsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setListError("");

      try {
        const response = await apiRequest<ListResponse>(
          `/account/bookings?page=${page}&limit=10`,
        );

        if (!cancelled) {
          setData(response.data);
        }
      } catch {
        if (!cancelled) {
          setListError("We could not load your bookings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!selectedBooking) return;

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedBooking(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;

      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedBooking]);

  async function openBooking(booking: Booking) {
    setSelectedBooking(booking);
    setDetailLoading(true);
    setDetailError("");

    try {
      const response = await apiRequest<DetailResponse>(
        `/account/bookings/${booking.id}`,
      );

      setSelectedBooking(response.data.booking);
    } catch {
      setDetailError("We could not load this booking.");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p
            className="text-[0.68rem] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--accent)" }}
          >
            Your activity
          </p>

          <h1 className="mt-1.5 text-3xl font-black tracking-[-0.05em]">
            Bookings
          </h1>

          <p
            className="mt-1.5 max-w-xl text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            Track requested times and the times businesses confirm.
          </p>
        </div>

        {data ? (
          <p
            className="shrink-0 text-sm font-black"
            style={{ color: "var(--muted)" }}
          >
            {data.pagination.total}{" "}
            {data.pagination.total === 1 ? "request" : "requests"}
          </p>
        ) : null}
      </header>

      <section
        className="overflow-hidden rounded-[1.2rem] border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(9rem,0.8fr)_minmax(8rem,0.65fr)_1.5rem] gap-4 border-b px-5 py-3 text-[0.66rem] font-black uppercase tracking-[0.12em] md:grid"
          style={{
            color: "var(--muted)",
            borderColor: "var(--border)",
          }}
        >
          <span>Business</span>
          <span>Booking</span>
          <span>Time</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[4.8rem] animate-pulse border-b last:border-b-0"
                style={{
                  background: "var(--surface-strong)",
                  borderColor: "var(--border)",
                }}
              />
            ))}
          </div>
        ) : listError ? (
          <div className="p-6">
            <p className="font-black">{listError}</p>
          </div>
        ) : !data?.bookings.length ? (
          <div className="p-6 sm:p-8">
            <CalendarDays size={23} style={{ color: "var(--muted)" }} />
            <h2 className="mt-4 text-lg font-black">No bookings yet</h2>
            <p
              className="mt-1 text-sm font-semibold leading-6"
              style={{ color: "var(--muted)" }}
            >
              Booking requests you send to businesses will appear here.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex whitespace-nowrap text-sm font-black"
              style={{ color: "var(--accent)" }}
            >
              Find a place
            </Link>
          </div>
        ) : (
          <div>
            {data.bookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => void openBooking(booking)}
                className="group grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 border-b px-4 py-3.5 text-left outline-none transition-colors last:border-b-0 hover:bg-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:px-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(9rem,0.8fr)_minmax(8rem,0.65fr)_1.5rem] md:items-center md:gap-4 md:py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {booking.business.displayName}
                  </p>

                  <p
                    className="mt-0.5 truncate text-xs font-semibold md:hidden"
                    style={{ color: "var(--muted)" }}
                  >
                    {booking.business.city}
                  </p>
                </div>

                <div className="justify-self-end md:col-start-4 md:row-start-1 md:justify-self-start">
                  <RequestStatusBadge status={booking.status} />
                </div>

                <p className="col-span-2 min-w-0 truncate text-sm font-bold md:col-span-1 md:col-start-2 md:row-start-1">
                  {booking.requestType}
                </p>

                <div className="col-span-2 flex min-w-0 items-center gap-1.5 md:col-span-1 md:col-start-3 md:row-start-1">
                  <Clock3
                    size={14}
                    className="shrink-0"
                    style={{ color: "var(--muted)" }}
                  />
                  <p
                    className="truncate text-xs font-bold md:text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    {bookingTimeLabel(booking)}
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className="hidden transition-transform group-hover:translate-x-0.5 md:block"
                  style={{ color: "var(--muted)" }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {data ? (
        <RequestPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          hasPreviousPage={data.pagination.hasPreviousPage}
          hasNextPage={data.pagination.hasNextPage}
          onPrevious={() =>
            setPage((current) => Math.max(1, current - 1))
          }
          onNext={() => setPage((current) => current + 1)}
        />
      ) : null}

      {selectedBooking ? (
        <RequestDrawerShell
          title={selectedBooking.business.displayName}
          subtitle="Booking details"
          onClose={() => setSelectedBooking(null)}
          footer={
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(7.5rem,auto)] gap-3">
              <Link
                href={`/places/${selectedBooking.business.slug}`}
                className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-black transition active:scale-[0.99]"
                style={{
                  background: "var(--accent)",
                  borderColor: "var(--accent)",
                  color: "var(--accent-contrast)",
                  boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
                }}
              >
                View business
                <ArrowUpRight size={16} />
              </Link>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="min-h-12 whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-black transition hover:bg-[var(--surface-strong)] active:scale-[0.99]"
                style={{
                  background: "var(--surface-strong)",
                  borderColor: "color-mix(in srgb, var(--text) 28%, var(--border))",
                  color: "var(--text)",
                }}
              >
                Close
              </button>
            </div>
          }
        >
          {detailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl"
                  style={{ background: "var(--surface)" }}
                />
              ))}
            </div>
          ) : detailError ? (
            <p className="text-sm font-black" style={{ color: "var(--danger)" }}>
              {detailError}
            </p>
          ) : (
            <>
              <RequestDetailSection label="Status">
                <div className="flex flex-wrap items-center gap-2">
                  <RequestStatusBadge status={selectedBooking.status} />

                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--muted)" }}
                  >
                    Sent {formatDateTime(selectedBooking.createdAt)}
                  </span>
                </div>
              </RequestDetailSection>

              <RequestDetailSection label="Booking">
                <p className="text-base font-black">
                  {selectedBooking.requestType}
                </p>

                <dl className="mt-3">
                  <RequestDetailRow
                    label="Requested"
                    value={formatDateTime(
                      selectedBooking.preferredDate,
                    )}
                  />

                  {selectedBooking.confirmedDate ? (
                    <RequestDetailRow
                      label="Confirmed"
                      value={formatDateTime(
                        selectedBooking.confirmedDate,
                      )}
                    />
                  ) : null}

                  {selectedBooking.partySize ? (
                    <RequestDetailRow
                      label="People"
                      value={`${selectedBooking.partySize}`}
                    />
                  ) : null}
                </dl>
              </RequestDetailSection>

              {selectedBooking.message ? (
                <RequestDetailSection label="Your message">
                  <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6">
                    {selectedBooking.message}
                  </p>
                </RequestDetailSection>
              ) : null}

              <RequestDetailSection label="Progress">
                <dl>
                  {lifecycleRows(selectedBooking).map(
                    ([label, value]) => (
                      <RequestDetailRow
                        key={label}
                        label={label}
                        value={formatDateTime(value)}
                      />
                    ),
                  )}
                </dl>
              </RequestDetailSection>

              <CustomerReviewSection
                source="booking"
                requestId={selectedBooking.id}
                businessName={selectedBooking.business.displayName}
                review={selectedBooking.review}
                eligibility={selectedBooking.reviewEligibility}
                onSaved={(review) => {
                  setSelectedBooking((current) =>
                    current
                      ? {
                          ...current,
                          review,
                          reviewEligibility: {
                            canReview: false,
                            reason: "already_reviewed",
                          },
                        }
                      : current,
                  );
                }}
              />

              <RequestDetailSection label="Business">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{ background: "var(--surface)" }}
                  >
                    <MapPin size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-black">
                      {selectedBooking.business.displayName}
                    </p>
                    <p
                      className="mt-0.5 text-sm font-semibold capitalize"
                      style={{ color: "var(--muted)" }}
                    >
                      {selectedBooking.business.category} /{" "}
                      {selectedBooking.business.city}
                    </p>
                  </div>
                </div>
              </RequestDetailSection>
            </>
          )}
        </RequestDrawerShell>
      ) : null}
    </div>
  );
}
