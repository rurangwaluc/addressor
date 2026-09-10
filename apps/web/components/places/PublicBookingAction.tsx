"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Minus,
  Plus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getStoredAccessToken } from "@/lib/authSession";

type BookingService = {
  id: string;
  name: string;
  durationMinutes: number | null;
};

type CreatedBookingResponse = {
  ok: true;
  data: {
    booking: {
      id: string;
      status: string;
    };
  };
};

type PublicBookingActionProps = {
  businessId: string;
  businessName: string;
  slug: string;
  label: string | null;
  instructions: string | null;
  minimumAdvanceMinutes: number | null;
  maximumAdvanceDays: number | null;
  services: BookingService[];
  primary?: boolean;
  embedded?: boolean;
  mobileStickyEnabled?: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return error.error.message;
  }

  return fallback;
}

function getErrorCode(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "code" in error.error &&
    typeof error.error.code === "string"
  ) {
    return error.error.code;
  }

  return "";
}

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function earliestBookingDate(minimumAdvanceMinutes: number | null) {
  const date = new Date(
    Date.now() + Math.max(0, minimumAdvanceMinutes ?? 0) * 60_000,
  );

  date.setSeconds(0, 0);

  const remainder = date.getMinutes() % 15;

  if (remainder !== 0) {
    date.setMinutes(date.getMinutes() + (15 - remainder));
  }

  return date;
}

function latestBookingDate(maximumAdvanceDays: number | null) {
  if (maximumAdvanceDays === null) return null;

  return new Date(
    Date.now() + maximumAdvanceDays * 24 * 60 * 60_000,
  );
}

export default function PublicBookingAction({
  businessId,
  businessName,
  slug,
  label,
  instructions,
  minimumAdvanceMinutes,
  maximumAdvanceDays,
  services,
  primary = true,
  embedded = false,
  mobileStickyEnabled = true,
}: PublicBookingActionProps) {
  const router = useRouter();

  const actionLabel = label?.trim() || "Book this place";
  const initialServiceId =
    services.length === 1 ? services[0]?.id ?? "" : "";

  const [open, setOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] =
    useState(initialServiceId);
  const [preferredDate, setPreferredDate] = useState("");
  const [partySize, setPartySize] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [sentBookingId, setSentBookingId] = useState("");
  const [showMobileStickyAction, setShowMobileStickyAction] =
    useState(false);

  const primaryActionRef = useRef<HTMLDivElement | null>(null);

  const returnPath = `/places/${slug}?booking=1`;

  const minimumDate = toLocalDateTimeInput(
    earliestBookingDate(minimumAdvanceMinutes),
  );

  const maximumDate = latestBookingDate(maximumAdvanceDays);
  const maximumDateValue = maximumDate
    ? toLocalDateTimeInput(maximumDate)
    : undefined;

  useEffect(() => {
    const shouldOpen =
      new URLSearchParams(window.location.search).get("booking") === "1";

    if (shouldOpen && getStoredAccessToken()) {
      setPreferredDate((current) => current || minimumDate);
      setOpen(true);
    }
    // The minimum is only used to seed the returned booking flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mobileStickyEnabled) {
      setShowMobileStickyAction(false);
      return;
    }

    const node = primaryActionRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyAction(!entry.isIntersecting);
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [mobileStickyEnabled]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !working) {
        closeBooking();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, working]);

  function resetForm() {
    setSelectedServiceId(initialServiceId);
    setPreferredDate("");
    setPartySize("");
    setMessage("");
    setError("");
    setSentBookingId("");
  }

  function startBooking() {
    if (!getStoredAccessToken()) {
      window.location.assign(
        `/login?redirectTo=${encodeURIComponent(returnPath)}`,
      );
      return;
    }

    setPreferredDate((current) => current || minimumDate);
    setError("");
    setOpen(true);
  }

  function closeBooking() {
    if (working) return;

    setOpen(false);

    const openedFromReturn =
      new URLSearchParams(window.location.search).get("booking") === "1";

    if (openedFromReturn) {
      router.replace(`/places/${slug}`, { scroll: false });
    }

    if (sentBookingId) {
      resetForm();
    }
  }

  function changePartySize(change: number) {
    const current = partySize ? Number(partySize) : 0;
    const next = Math.max(0, Math.min(100, current + change));

    setPartySize(next === 0 ? "" : String(next));
  }

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();

    if (working) return;

    if (services.length > 0 && !selectedServiceId) {
      setError("Choose what you would like to book.");
      return;
    }

    if (!preferredDate) {
      setError("Choose your preferred date and time.");
      return;
    }

    const preferred = new Date(preferredDate);

    if (Number.isNaN(preferred.getTime())) {
      setError("Choose a valid date and time.");
      return;
    }

    if (preferred.getTime() < Date.now()) {
      setError("Choose a future date and time.");
      return;
    }

    const parsedPartySize = partySize.trim()
      ? Number(partySize)
      : null;

    if (
      parsedPartySize !== null &&
      (!Number.isInteger(parsedPartySize) ||
        parsedPartySize < 1 ||
        parsedPartySize > 100)
    ) {
      setError("Enter a valid number of people.");
      return;
    }

    setWorking(true);
    setError("");

    try {
      const response = await apiRequest<CreatedBookingResponse>(
        `/businesses/${businessId}/bookings`,
        {
          method: "POST",
          body: JSON.stringify({
            serviceId: selectedServiceId || null,
            preferredDate: preferred.toISOString(),
            partySize: parsedPartySize,
            message: message.trim() || null,
          }),
        },
      );

      setSentBookingId(response.data.booking.id);
    } catch (submitError) {
      const code = getErrorCode(submitError);

      if (code === "UNAUTHORIZED") {
        window.location.assign(
          `/login?redirectTo=${encodeURIComponent(returnPath)}`,
        );
        return;
      }

      setError(
        getErrorMessage(
          submitError,
          "Your booking request could not be sent. Try again.",
        ),
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <div
        ref={primaryActionRef}
        id="book"
        className={embedded ? "min-w-0" : "mt-5 min-w-0"}
      >
        <button
          type="button"
          onClick={startBooking}
          className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
          style={
            primary
              ? {
                  background: "var(--accent)",
                  borderColor: "var(--accent)",
                  color: "var(--primary-text)",
                }
              : {
                  background: "var(--surface-strong)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }
          }
        >
          <CalendarDays size={18} aria-hidden="true" />
          {actionLabel}
        </button>

        <p
          className="mt-2 text-xs font-bold leading-5"
          style={{ color: "var(--muted)" }}
        >
          Send your preferred time to {businessName}.
        </p>
      </div>

      {!open &&
      mobileStickyEnabled &&
      showMobileStickyAction ? (
        <div
          className="fixed inset-x-0 bottom-0 z-[70] border-t px-3 pt-3 lg:hidden"
          style={{
            background: "var(--surface-strong)",
            borderColor: "var(--border)",
            paddingBottom:
              "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={startBooking}
            className="mx-auto flex min-h-[3.25rem] w-full max-w-lg items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 text-sm font-black"
            style={{
              background: "var(--accent)",
              color: "var(--primary-text)",
            }}
          >
            <CalendarDays size={18} aria-hidden="true" />
            {actionLabel}
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[90] bg-black/55"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeBooking();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-booking-title"
            className="absolute inset-y-0 right-0 flex h-[100dvh] w-full flex-col sm:max-w-[34rem] sm:border-l"
            style={{
              background: "var(--surface-strong)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            <header
              className="shrink-0 border-b px-4 pb-4 sm:px-6"
              style={{
                borderColor: "var(--border)",
                paddingTop:
                  "max(1rem, env(safe-area-inset-top))",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className="text-[0.68rem] font-black uppercase tracking-[0.18em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Booking request
                  </p>

                  <h2
                    id="public-booking-title"
                    className="mt-1 text-2xl font-black tracking-[-0.04em]"
                  >
                    {actionLabel}
                  </h2>

                  <p
                    className="mt-1 text-sm font-semibold leading-6"
                    style={{ color: "var(--muted)" }}
                  >
                    {businessName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeBooking}
                  disabled={working}
                  aria-label="Close booking"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border disabled:opacity-50"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </div>
            </header>

            {sentBookingId ? (
              <div className="flex flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-6">
                <div className="my-auto">
                  <span
                    className="grid h-14 w-14 place-items-center rounded-xl"
                    style={{
                      background:
                        "color-mix(in srgb, var(--success) 14%, transparent)",
                      color: "var(--success)",
                    }}
                  >
                    <CheckCircle2 size={29} aria-hidden="true" />
                  </span>

                  <h3 className="mt-5 text-3xl font-black tracking-[-0.045em]">
                    Request sent
                  </h3>

                  <p
                    className="mt-3 max-w-md text-sm font-semibold leading-7"
                    style={{ color: "var(--muted)" }}
                  >
                    {businessName} received your booking request.
                    Your booking is not confirmed until the business
                    accepts it.
                  </p>

                  <div
                    className="mt-6 border-y py-4"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-sm font-black">
                      What happens next?
                    </p>

                    <p
                      className="mt-1 text-sm font-semibold leading-6"
                      style={{ color: "var(--muted)" }}
                    >
                      The business can confirm your preferred time or
                      confirm a different time when accepting the
                      request.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeBooking}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-lg px-5 text-sm font-black"
                    style={{
                      background: "var(--accent)",
                      color: "var(--primary-text)",
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={submitBooking}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  {instructions ? (
                    <div
                      className="mb-6 border-l-2 pl-4"
                      style={{ borderColor: "var(--accent)" }}
                    >
                      <p className="text-sm font-black">
                        Before you request
                      </p>

                      <p
                        className="mt-1 text-sm font-semibold leading-6"
                        style={{ color: "var(--muted)" }}
                      >
                        {instructions}
                      </p>
                    </div>
                  ) : null}

                  <div className="grid gap-6">
                    {services.length > 0 ? (
                      <div>
                        <label
                          htmlFor="booking-service"
                          className="text-sm font-black"
                        >
                          What would you like to book?
                        </label>

                        <select
                          id="booking-service"
                          value={selectedServiceId}
                          onChange={(event) =>
                            setSelectedServiceId(event.target.value)
                          }
                          disabled={working}
                          className="mt-2 min-h-12 w-full rounded-lg border px-3.5 text-sm font-bold outline-none"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          <option value="">Choose a service</option>

                          {services.map((service) => (
                            <option
                              key={service.id}
                              value={service.id}
                            >
                              {service.name}
                              {service.durationMinutes
                                ? ` / ${service.durationMinutes} min`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div>
                      <label
                        htmlFor="booking-date"
                        className="flex items-center gap-2 text-sm font-black"
                      >
                        <Clock3 size={16} aria-hidden="true" />
                        Preferred date & time
                      </label>

                      <input
                        id="booking-date"
                        type="datetime-local"
                        value={preferredDate}
                        min={minimumDate}
                        max={maximumDateValue}
                        onChange={(event) =>
                          setPreferredDate(event.target.value)
                        }
                        disabled={working}
                        required
                        className="mt-2 min-h-12 w-full rounded-lg border px-3.5 text-sm font-bold outline-none"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />

                      <p
                        className="mt-2 text-xs font-semibold leading-5"
                        style={{ color: "var(--muted)" }}
                      >
                        This is your preferred time. The business will
                        confirm it or suggest a change.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="booking-party-size"
                        className="flex items-center gap-2 text-sm font-black"
                      >
                        <Users size={16} aria-hidden="true" />
                        Number of people
                        <span
                          className="font-semibold"
                          style={{ color: "var(--muted)" }}
                        >
                          Optional
                        </span>
                      </label>

                      <div
                        className="mt-2 grid min-h-12 grid-cols-[3rem_minmax(0,1fr)_3rem] overflow-hidden rounded-lg border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <button
                          type="button"
                          onClick={() => changePartySize(-1)}
                          disabled={working || !partySize}
                          aria-label="Decrease number of people"
                          className="grid place-items-center border-r disabled:opacity-35"
                          style={{
                            borderColor: "var(--border)",
                            background: "var(--surface)",
                          }}
                        >
                          <Minus size={17} aria-hidden="true" />
                        </button>

                        <input
                          id="booking-party-size"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={100}
                          value={partySize}
                          onChange={(event) =>
                            setPartySize(event.target.value)
                          }
                          disabled={working}
                          placeholder="Not specified"
                          className="min-w-0 border-0 bg-transparent px-3 text-center text-sm font-black outline-none"
                          style={{ color: "var(--text)" }}
                        />

                        <button
                          type="button"
                          onClick={() => changePartySize(1)}
                          disabled={working || partySize === "100"}
                          aria-label="Increase number of people"
                          className="grid place-items-center border-l disabled:opacity-35"
                          style={{
                            borderColor: "var(--border)",
                            background: "var(--surface)",
                          }}
                        >
                          <Plus size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="booking-message"
                        className="text-sm font-black"
                      >
                        Note for the business
                        <span
                          className="ml-2 font-semibold"
                          style={{ color: "var(--muted)" }}
                        >
                          Optional
                        </span>
                      </label>

                      <textarea
                        id="booking-message"
                        value={message}
                        onChange={(event) =>
                          setMessage(event.target.value)
                        }
                        disabled={working}
                        maxLength={1000}
                        rows={4}
                        placeholder="Anything the business should know?"
                        className="mt-2 w-full resize-none rounded-lg border px-3.5 py-3 text-sm font-semibold leading-6 outline-none"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />

                      <p
                        className="mt-1 text-right text-xs font-semibold"
                        style={{ color: "var(--muted)" }}
                      >
                        {message.length}/1000
                      </p>
                    </div>
                  </div>

                  {error ? (
                    <div
                      className="mt-5 border-l-2 py-1 pl-4 text-sm font-bold leading-6"
                      style={{
                        borderColor: "var(--danger)",
                        color: "var(--danger)",
                      }}
                    >
                      {error}
                    </div>
                  ) : null}
                </div>

                <footer
                  className="shrink-0 border-t px-4 pt-4 sm:px-6"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-strong)",
                    paddingBottom:
                      "max(1rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <button
                    type="submit"
                    disabled={working}
                    className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: "var(--accent)",
                      color: "var(--primary-text)",
                    }}
                  >
                    <CalendarDays size={18} aria-hidden="true" />
                    {working
                      ? "Sending request..."
                      : "Send booking request"}
                  </button>

                  <p
                    className="mt-2 text-center text-xs font-semibold leading-5"
                    style={{ color: "var(--muted)" }}
                  >
                    Sending this request does not confirm the booking.
                  </p>
                </footer>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
