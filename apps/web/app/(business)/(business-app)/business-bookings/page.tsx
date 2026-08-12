"use client";

import { useEffect, useRef, useState } from "react";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";
import { getStoredAccessContext } from "@/lib/authSession";
import { chooseActiveBusiness, getBusinessId } from "@/lib/businessSession";

type BookingStatus = "new" | "accepted" | "declined" | "cancelled" | "completed";
type BookingView = "attention" | "upcoming" | "today" | "history";
type ConfirmationMode = "accept" | "decline" | "complete" | "cancel" | null;

type Booking = {
  id: string;
  businessId: string;
  customerUserId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  requestType: string;
  message: string | null;
  preferredDate: string | null;
  confirmedDate: string | null;
  partySize: number | null;
  status: BookingStatus;
  ownerNote: string | null;
  respondedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BookingSettings = {
  businessId: string;
  enabled: boolean;
  bookingLabel: string | null;
  instructions: string | null;
  minimumAdvanceMinutes: number | null;
  maximumAdvanceDays: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type SettingsForm = {
  enabled: boolean;
  bookingLabel: string;
  instructions: string;
  minimumAdvanceValue: string;
  minimumAdvanceUnit: "minutes" | "hours" | "days";
  maximumAdvanceDays: string;
};

type ApiResponse<T> = { ok: true; data: T };
type BookingCounts = Record<BookingView, number>;
type BookingPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};
type BookingListData = {
  bookings: Booking[];
  counts: BookingCounts;
  pagination: BookingPagination;
};

const bookingsPerPage = 10;
const emptyCounts: BookingCounts = { attention: 0, upcoming: 0, today: 0, history: 0 };

const viewLabels: Record<BookingView, string> = {
  attention: "Needs attention",
  upcoming: "Upcoming",
  today: "Today",
  history: "History",
};

const emptyCopy: Record<BookingView, { title: string; text: string }> = {
  attention: {
    title: "No requests need attention.",
    text: "New customer requests will appear here.",
  },
  upcoming: {
    title: "No upcoming bookings.",
    text: "Accepted future bookings will appear here.",
  },
  today: {
    title: "Nothing booked for today.",
    text: "Accepted bookings for today will appear here.",
  },
  history: {
    title: "No booking history yet.",
    text: "Completed, declined, and cancelled bookings will appear here.",
  },
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

function formatStatus(status: BookingStatus) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function formatRequestType(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatReceived(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently received";
  return `Received ${new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function settingsToForm(settings: BookingSettings): SettingsForm {
  const minutes = settings.minimumAdvanceMinutes;
  let unit: SettingsForm["minimumAdvanceUnit"] = "minutes";
  let value = minutes === null ? "" : String(minutes);

  if (minutes !== null && minutes > 0 && minutes % 1440 === 0) {
    unit = "days";
    value = String(minutes / 1440);
  } else if (minutes !== null && minutes > 0 && minutes % 60 === 0) {
    unit = "hours";
    value = String(minutes / 60);
  }

  return {
    enabled: settings.enabled,
    bookingLabel: settings.bookingLabel ?? "",
    instructions: settings.instructions ?? "",
    minimumAdvanceValue: value,
    minimumAdvanceUnit: unit,
    maximumAdvanceDays:
      settings.maximumAdvanceDays === null ? "" : String(settings.maximumAdvanceDays),
  };
}

function statusStyle(status: BookingStatus) {
  if (status === "new") return { background: "var(--accent-soft)", color: "var(--accent)" };
  if (status === "accepted") return { background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" };
  if (status === "cancelled" || status === "declined") return { background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" };
  return { background: "var(--surface-strong)", color: "var(--muted)" };
}

export default function BusinessBookingsPage() {
  const [access] = useState<AccessContext | null>(() => getStoredAccessContext());
  const business = chooseActiveBusiness(access?.businesses);
  const businessId = getBusinessId(business);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsRefreshing, setBookingsRefreshing] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [counts, setCounts] = useState<BookingCounts>(emptyCounts);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<BookingPagination | null>(null);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [selectedView, setSelectedView] = useState<BookingView>("attention");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>(null);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [actionWorking, setActionWorking] = useState(false);
  const [actionError, setActionError] = useState("");
  const [ownerNote, setOwnerNote] = useState("");
  const [savedOwnerNote, setSavedOwnerNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteState, setNoteState] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SettingsForm | null>(null);
  const [savedSettingsForm, setSavedSettingsForm] = useState<SettingsForm | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveState, setSettingsSaveState] = useState("");
  const didChooseInitialView = useRef(false);
  const bookingRequestId = useRef(0);
  const settingsDirty = Boolean(
    settingsForm &&
      savedSettingsForm &&
      JSON.stringify(settingsForm) !== JSON.stringify(savedSettingsForm),
  );

  async function loadBookings(view = selectedView, requestedPage = page) {
    if (!businessId) {
      setBookingsLoading(false);
      return;
    }
    const requestId = ++bookingRequestId.current;
    if (pagination) setBookingsRefreshing(true);
    else setBookingsLoading(true);
    setBookingsError("");
    try {
      const response = await apiRequest<ApiResponse<BookingListData>>(
        `/businesses/${businessId}/bookings?view=${view}&page=${requestedPage}&limit=${bookingsPerPage}`,
      );
      if (requestId !== bookingRequestId.current) return;
      const lastPage = Math.max(1, response.data.pagination.totalPages);
      if (requestedPage > lastPage) {
        setPage(lastPage);
        return;
      }
      setBookings(response.data.bookings);
      setCounts(response.data.counts);
      setPagination(response.data.pagination);
    } catch (error) {
      if (requestId !== bookingRequestId.current) return;
      setBookingsError(getErrorMessage(error, "We could not load your bookings."));
    } finally {
      if (requestId === bookingRequestId.current) {
        setBookingsLoading(false);
        setBookingsRefreshing(false);
      }
    }
  }

  async function loadSettings() {
    if (!businessId) {
      setSettingsLoading(false);
      return;
    }
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const response = await apiRequest<ApiResponse<BookingSettings>>(
        `/businesses/${businessId}/bookings/settings`,
      );
      const nextForm = settingsToForm(response.data);
      setSettings(response.data);
      setSettingsForm(nextForm);
      setSavedSettingsForm(nextForm);
    } catch (error) {
      setSettingsError(getErrorMessage(error, "We could not load booking settings."));
    } finally {
      setSettingsLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
    // Settings only change when the active business changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    void loadBookings(selectedView, page);
    // The active business, view, and page define this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, selectedView, page]);

  useEffect(() => {
    if (bookingsLoading || didChooseInitialView.current || !pagination) return;
    didChooseInitialView.current = true;
    if (counts.attention > 0) setSelectedView("attention");
    else if (counts.today > 0) setSelectedView("today");
    else if (counts.upcoming > 0) setSelectedView("upcoming");
    // Counts are derived from the completed initial request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingsLoading, pagination]);

  function replaceBooking(nextBooking: Booking) {
    setBookings((current) =>
      current.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );
    setSelectedBooking(nextBooking);
  }

  async function openBooking(booking: Booking, mode: ConfirmationMode = null) {
    setSelectedBooking(booking);
    setConfirmationMode(mode);
    setConfirmedDate(toDateTimeLocal(booking.preferredDate));
    setOwnerNote(booking.ownerNote ?? "");
    setSavedOwnerNote(booking.ownerNote ?? "");
    setDetailError("");
    setActionError("");
    setNoteState("");
    setDetailLoading(true);
    try {
      const response = await apiRequest<ApiResponse<{ booking: Booking }>>(
        `/businesses/${businessId}/bookings/${booking.id}`,
      );
      const detail = response.data.booking;
      setSelectedBooking(detail);
      setConfirmedDate(toDateTimeLocal(detail.preferredDate));
      setOwnerNote(detail.ownerNote ?? "");
      setSavedOwnerNote(detail.ownerNote ?? "");
    } catch (error) {
      setDetailError(getErrorMessage(error, "We could not load this booking."));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeBooking() {
    if (actionWorking || noteSaving) return;
    setSelectedBooking(null);
    setConfirmationMode(null);
    setDetailError("");
    setActionError("");
  }

  async function updateStatus(status: "accepted" | "declined" | "completed" | "cancelled") {
    if (!selectedBooking) return;
    setActionWorking(true);
    setActionError("");
    try {
      const body =
        status === "accepted"
          ? {
              status,
              ...(confirmedDate
                ? { confirmedDate: new Date(confirmedDate).toISOString() }
                : {}),
            }
          : { status };
      const response = await apiRequest<ApiResponse<{ booking: Booking }>>(
        `/businesses/${businessId}/bookings/${selectedBooking.id}/status`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      replaceBooking(response.data.booking);
      setConfirmationMode(null);
      await loadBookings(selectedView, page);
    } catch (error) {
      setActionError(getErrorMessage(error, "This booking could not be updated."));
    } finally {
      setActionWorking(false);
    }
  }

  async function saveNote() {
    if (!selectedBooking) return;
    setNoteSaving(true);
    setNoteState("");
    try {
      const response = await apiRequest<ApiResponse<{ booking: Booking }>>(
        `/businesses/${businessId}/bookings/${selectedBooking.id}/note`,
        {
          method: "PATCH",
          body: JSON.stringify({ ownerNote: ownerNote.trim() || null }),
        },
      );
      replaceBooking(response.data.booking);
      setOwnerNote(response.data.booking.ownerNote ?? "");
      setSavedOwnerNote(response.data.booking.ownerNote ?? "");
      setNoteState("Note saved");
    } catch (error) {
      setNoteState(getErrorMessage(error, "The note could not be saved."));
    } finally {
      setNoteSaving(false);
    }
  }

  async function saveSettings() {
    if (!settingsForm) return;
    const advanceValue = settingsForm.minimumAdvanceValue.trim();
    const numericAdvance = advanceValue === "" ? null : Number(advanceValue);
    const multiplier = settingsForm.minimumAdvanceUnit === "days" ? 1440 : settingsForm.minimumAdvanceUnit === "hours" ? 60 : 1;
    const maximumDays = settingsForm.maximumAdvanceDays.trim();

    if (numericAdvance !== null && (!Number.isFinite(numericAdvance) || numericAdvance < 0)) {
      setSettingsSaveState("Enter a valid minimum notice.");
      return;
    }
    if (maximumDays !== "" && (!Number.isInteger(Number(maximumDays)) || Number(maximumDays) < 1)) {
      setSettingsSaveState("Enter a valid number of days.");
      return;
    }

    setSettingsSaving(true);
    setSettingsSaveState("");
    try {
      const response = await apiRequest<ApiResponse<BookingSettings>>(
        `/businesses/${businessId}/bookings/settings`,
        {
          method: "PATCH",
          body: JSON.stringify({
            enabled: settingsForm.enabled,
            bookingLabel: settingsForm.bookingLabel.trim() || null,
            instructions: settingsForm.instructions.trim() || null,
            minimumAdvanceMinutes:
              numericAdvance === null ? null : Math.round(numericAdvance * multiplier),
            maximumAdvanceDays: maximumDays === "" ? null : Number(maximumDays),
          }),
        },
      );
      const nextForm = settingsToForm(response.data);
      setSettings(response.data);
      setSettingsForm(nextForm);
      setSavedSettingsForm(nextForm);
      setSettingsSaveState("Saved");
      setSettingsError("");
    } catch (error) {
      setSettingsSaveState(getErrorMessage(error, "Booking settings could not be saved."));
    } finally {
      setSettingsSaving(false);
    }
  }

  function updateSettingsField<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setSettingsSaveState("");
    setSettingsForm((current) => (current ? { ...current, [key]: value } : current));
  }

  const inputClass = "mt-2 w-full min-w-0 rounded-[0.9rem] border px-3.5 py-3 text-base font-bold outline-none focus:border-[var(--accent)]";

  return (
    <div className="grid w-full min-w-0 gap-4 sm:gap-5">
      <section className="min-w-0 rounded-[1.5rem] border p-3.5 sm:rounded-[1.75rem] sm:p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>Bookings</p>
            <h1 className="mt-1 max-w-3xl text-2xl font-black leading-[1.08] tracking-[-0.05em] min-[400px]:text-[1.7rem] sm:mt-1.5 sm:text-4xl">Manage customer requests and upcoming bookings.</h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-5 sm:text-base sm:leading-6" style={{ color: "var(--muted)" }}>Review new requests, confirm the right time, and keep accepted bookings moving.</p>
          </div>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:shrink-0 sm:justify-end">
            <span className="min-w-0 rounded-full border px-2.5 py-2 text-center text-[0.68rem] font-black leading-4 sm:px-3 sm:text-xs sm:whitespace-nowrap" style={{ borderColor: settings?.enabled ? "var(--success)" : "var(--border)", color: settings?.enabled ? "var(--success)" : "var(--muted)", background: "var(--surface-strong)" }}>
              {settingsLoading ? "Checking booking status…" : settings?.enabled ? "Accepting requests" : "Not accepting requests"}
            </span>
            <button type="button" onClick={() => setSettingsOpen(true)} className="rounded-full px-3 py-2.5 whitespace-nowrap text-xs font-black sm:px-4 sm:text-sm" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Booking settings</button>
          </div>
        </div>
        {settingsError ? <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 rounded-[1rem] border px-3 py-2.5 text-sm font-bold" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}><span className="min-w-0 flex-1 break-words">{settingsError}</span><button type="button" onClick={() => void loadSettings()} className="shrink-0 whitespace-nowrap font-black" style={{ color: "var(--accent)" }}>Try settings again</button></div> : null}
      </section>

      {!businessId ? (
        <section className="rounded-[1.5rem] border p-4 sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><h2 className="text-2xl font-black">Choose a business first.</h2><p className="mt-2 text-sm font-semibold" style={{ color: "var(--muted)" }}>Bookings need an active business.</p></section>
      ) : bookingsLoading ? (
        <section className="rounded-[1.5rem] border p-4 sm:p-5" aria-live="polite" aria-busy="true" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><h2 className="text-2xl font-black">Loading bookings…</h2><p className="mt-2 text-sm font-semibold" style={{ color: "var(--muted)" }}>Your business navigation remains available.</p><div className="mt-4 grid gap-2"><div className="h-20 rounded-[1rem]" style={{ background: "var(--surface-strong)" }} /><div className="h-20 rounded-[1rem]" style={{ background: "var(--surface-strong)" }} /></div></section>
      ) : bookingsError ? (
        <section className="rounded-[1.5rem] border p-4 sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--danger)" }}>Bookings unavailable</p><h2 className="mt-2 text-2xl font-black">We could not load your bookings.</h2><p className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>{bookingsError}</p><button type="button" onClick={() => void loadBookings()} className="mt-4 rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Try again</button></section>
      ) : (
        <>
          <nav className="grid min-w-0 grid-cols-2 gap-1.5 rounded-[1.25rem] border p-1.5 sm:grid-cols-4 sm:gap-2" aria-label="Booking views" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {(Object.keys(viewLabels) as BookingView[]).map((view) => {
              const active = selectedView === view;
              return <button key={view} type="button" onClick={() => { setPage(1); setSelectedView(view); }} disabled={bookingsRefreshing && active} className="flex min-w-0 items-center justify-center gap-1 rounded-[0.9rem] px-1.5 py-2 text-xs font-black leading-4 disabled:opacity-70 min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-sm sm:gap-2 sm:px-3" style={{ background: active ? "var(--accent)" : "transparent", color: active ? "var(--accent-contrast)" : "var(--text)" }} aria-current={active ? "page" : undefined}><span>{viewLabels[view]}</span><span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[0.65rem]" style={{ background: active ? "rgba(255,255,255,0.2)" : "var(--surface-strong)" }}>{counts[view]}</span></button>;
            })}
          </nav>

          <section className="min-w-0 overflow-hidden rounded-[1.5rem] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex min-w-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: "var(--border)" }}><div className="min-w-0"><h2 className="text-xl font-black">{viewLabels[selectedView]}</h2><p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--muted)" }}>{counts[selectedView]} {counts[selectedView] === 1 ? "booking" : "bookings"}</p></div></div>
            {bookings.length === 0 ? (
              <div className="p-5 sm:p-6"><h3 className="text-lg font-black">{emptyCopy[selectedView].title}</h3><p className="mt-1 text-sm font-semibold leading-6" style={{ color: "var(--muted)" }}>{emptyCopy[selectedView].text}</p></div>
            ) : (
              <div className="divide-y transition-opacity" aria-busy={bookingsRefreshing} style={{ borderColor: "var(--border)", opacity: bookingsRefreshing ? 0.68 : 1 }}>
                {bookings.map((booking) => {
                  const date = booking.status === "new" ? booking.preferredDate : booking.confirmedDate ?? booking.preferredDate;
                  const dateLabel = booking.status === "new" ? "Requested" : booking.status === "accepted" ? "Confirmed" : "Booking time";
                  return (
                    <article
                      key={booking.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open booking from ${booking.customerName}`}
                      onClick={(event) => {
                        if (event.target !== event.currentTarget && (event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
                        void openBooking(booking);
                      }}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          void openBooking(booking);
                        }
                      }}
                      className="grid min-w-0 cursor-pointer grid-cols-1 gap-x-4 gap-y-2.5 p-3.5 outline-none transition-colors hover:bg-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:p-4 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.8fr)] md:gap-y-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(12rem,0.75fr)_auto] lg:items-center lg:gap-x-5"
                    >
                      <div className="min-w-0"><div className="flex min-w-0 items-start justify-between gap-2 md:justify-start"><h3 className="min-w-0 break-words text-base font-black leading-5 sm:text-lg">{booking.customerName}</h3><span className="shrink-0 rounded-full px-2.5 py-1 whitespace-nowrap text-[0.68rem] font-black" style={statusStyle(booking.status)}>{formatStatus(booking.status)}</span></div><p className="mt-0.5 text-sm font-bold" style={{ color: "var(--muted)" }}>{formatRequestType(booking.requestType)}</p></div>
                      <div className="min-w-0 md:row-span-2 lg:row-span-1"><div className="flex min-w-0 items-start justify-between gap-3 md:block"><div className="min-w-0"><p className="text-[0.65rem] font-black uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{dateLabel}</p><p className="mt-0.5 break-words text-sm font-black leading-5">{formatDateTime(date)}</p></div>{booking.partySize ? <span className="shrink-0 whitespace-nowrap pt-4 text-xs font-bold md:mt-1.5 md:block md:pt-0" style={{ color: "var(--muted)" }}>{booking.partySize} {booking.partySize === 1 ? "person" : "people"}</span> : null}</div></div>
                      <div className="min-w-0 md:col-start-1 lg:col-start-1 lg:row-start-2">{booking.message ? <p className="line-clamp-2 break-words text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>{booking.message}</p> : <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>No customer message.</p>}{booking.status === "new" ? <p className="mt-1 text-xs font-bold" style={{ color: "var(--muted)" }}>{formatReceived(booking.createdAt)}</p> : null}</div>
                      {booking.status === "new" || booking.status === "accepted" ? <div className="grid min-w-0 grid-cols-2 gap-1.5 pt-0.5 md:col-span-2 md:flex md:flex-wrap md:pt-0 lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:max-w-[18rem] lg:justify-end">
                        {booking.status === "new" ? <><button type="button" onClick={(event) => { event.stopPropagation(); void openBooking(booking, "accept"); }} className="rounded-full px-3 py-2.5 whitespace-nowrap text-sm font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Accept</button><button type="button" onClick={(event) => { event.stopPropagation(); void openBooking(booking, "decline"); }} className="rounded-full border px-3 py-2.5 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>Decline</button></> : null}
                        {booking.status === "accepted" ? <><button type="button" onClick={(event) => { event.stopPropagation(); void openBooking(booking, "complete"); }} className="rounded-full px-3 py-2.5 whitespace-nowrap text-sm font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Complete</button><button type="button" onClick={(event) => { event.stopPropagation(); void openBooking(booking, "cancel"); }} className="rounded-full border px-3 py-2.5 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>Cancel</button></> : null}
                      </div> : null}
                    </article>
                  );
                })}
              </div>
            )}
            {pagination && pagination.total > bookingsPerPage ? <div className="flex min-w-0 flex-col gap-2 border-t px-4 py-3 min-[375px]:flex-row min-[375px]:items-center min-[375px]:justify-between sm:px-5" style={{ borderColor: "var(--border)" }}><p className="text-sm font-bold" style={{ color: "var(--muted)" }}>{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p><div className="grid grid-cols-2 gap-2"><button type="button" disabled={!pagination.hasPreviousPage || bookingsRefreshing} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-full border px-3.5 py-2 whitespace-nowrap text-sm font-black disabled:opacity-45" style={{ borderColor: "var(--border)" }}>Previous</button><button type="button" disabled={!pagination.hasNextPage || bookingsRefreshing} onClick={() => setPage((current) => current + 1)} className="rounded-full border px-3.5 py-2 whitespace-nowrap text-sm font-black disabled:opacity-45" style={{ borderColor: "var(--border)" }}>Next</button></div></div> : null}
          </section>
        </>
      )}

      {selectedBooking ? (
        <div className="fixed inset-0 z-50 flex min-w-0 justify-end" role="dialog" aria-modal="true" aria-label="Booking details">
          <button type="button" className="absolute inset-0 bg-black/55" onClick={closeBooking} aria-label="Close booking details" />
          <section className="relative grid h-[100dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l sm:max-w-[30rem]" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <header className="flex min-w-0 items-start justify-between gap-3 border-b p-4 sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>Booking details</p><h2 className="mt-1 break-words text-2xl font-black">{selectedBooking.customerName}</h2></div><button type="button" onClick={closeBooking} disabled={actionWorking || noteSaving} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xl font-black disabled:opacity-50" style={{ borderColor: "var(--border)" }} aria-label="Close">×</button></header>
            <div className="min-w-0 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-5 sm:pb-7">
              {detailLoading ? <p className="text-sm font-black">Loading booking details…</p> : detailError ? <p className="rounded-[1rem] border p-3 text-sm font-bold" role="alert" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>{detailError}</p> : (
                <div className="grid min-w-0 gap-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="rounded-full px-3 py-1.5 whitespace-nowrap text-xs font-black" style={statusStyle(selectedBooking.status)}>{formatStatus(selectedBooking.status)}</span><span className="text-xs font-bold" style={{ color: "var(--muted)" }}>{formatRequestType(selectedBooking.requestType)}</span></div>
                  <dl className="grid min-w-0 gap-3 rounded-[1.25rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><DetailItem label="Requested date" value={formatDateTime(selectedBooking.preferredDate)} /><DetailItem label="Confirmed date" value={formatDateTime(selectedBooking.confirmedDate)} />{selectedBooking.partySize ? <DetailItem label="Party size" value={`${selectedBooking.partySize} ${selectedBooking.partySize === 1 ? "person" : "people"}`} /> : null}<DetailItem label="Received" value={formatDateTime(selectedBooking.createdAt)} /></dl>
                  <div className="min-w-0 rounded-[1.25rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Customer message</p><p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6">{selectedBooking.message || "No message provided."}</p></div>
                  <div className="min-w-0 rounded-[1.25rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Contact</p><div className="mt-2 grid min-w-0 gap-2">{selectedBooking.customerPhone ? <a href={`tel:${selectedBooking.customerPhone}`} className="min-w-0 break-words text-sm font-black" style={{ color: "var(--accent)" }}>Call {selectedBooking.customerPhone}</a> : <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>No phone provided.</p>}{selectedBooking.customerEmail ? <a href={`mailto:${selectedBooking.customerEmail}`} className="min-w-0 break-all text-sm font-black" style={{ color: "var(--accent)" }}>{selectedBooking.customerEmail}</a> : <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>No email provided.</p>}</div></div>
                  {(selectedBooking.respondedAt || selectedBooking.completedAt || selectedBooking.cancelledAt) ? <dl className="grid min-w-0 gap-3 rounded-[1.25rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>{selectedBooking.respondedAt ? <DetailItem label="Responded" value={formatDateTime(selectedBooking.respondedAt)} /> : null}{selectedBooking.completedAt ? <DetailItem label="Completed" value={formatDateTime(selectedBooking.completedAt)} /> : null}{selectedBooking.cancelledAt ? <DetailItem label="Cancelled" value={formatDateTime(selectedBooking.cancelledAt)} /> : null}</dl> : null}
                  <div className="min-w-0 rounded-[1.25rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><label className="text-sm font-black" htmlFor="booking-owner-note">Private owner note</label><p className="mt-1 text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>Only your business team can see this note.</p><textarea id="booking-owner-note" value={ownerNote} onChange={(event) => { setOwnerNote(event.target.value); setNoteState(""); }} maxLength={1000} rows={4} className={`${inputClass} resize-y`} style={{ background: "var(--surface-strong)", borderColor: "var(--border)", color: "var(--text)" }} /><div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold" aria-live="polite" style={{ color: noteState && noteState !== "Note saved" ? "var(--danger)" : "var(--muted)" }}>{noteState}</span><button type="button" disabled={noteSaving || ownerNote === savedOwnerNote} onClick={() => void saveNote()} className="rounded-full border px-4 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50" style={{ borderColor: "var(--border)" }}>{noteSaving ? "Saving note…" : "Save note"}</button></div></div>
                  {confirmationMode ? <ConfirmationPanel mode={confirmationMode} confirmedDate={confirmedDate} setConfirmedDate={setConfirmedDate} working={actionWorking} error={actionError} onCancel={() => { setConfirmationMode(null); setActionError(""); }} onConfirm={(status) => void updateStatus(status)} /> : null}
                </div>
              )}
            </div>
            <footer className="flex min-w-0 flex-wrap gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {!confirmationMode && !detailLoading && !detailError && selectedBooking.status === "new" ? <><button type="button" onClick={() => { setConfirmedDate(toDateTimeLocal(selectedBooking.preferredDate)); setConfirmationMode("accept"); }} className="flex-1 rounded-full px-4 py-3 whitespace-nowrap text-sm font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Accept</button><button type="button" onClick={() => setConfirmationMode("decline")} className="flex-1 rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>Decline</button></> : null}
              {!confirmationMode && !detailLoading && !detailError && selectedBooking.status === "accepted" ? <><button type="button" onClick={() => setConfirmationMode("complete")} className="flex-1 rounded-full px-4 py-3 whitespace-nowrap text-sm font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Complete</button><button type="button" onClick={() => setConfirmationMode("cancel")} className="flex-1 rounded-full border px-4 py-3 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>Cancel</button></> : null}
              {!confirmationMode && selectedBooking.status !== "new" && selectedBooking.status !== "accepted" ? <button type="button" onClick={closeBooking} className="ml-auto rounded-full border px-4 py-2.5 whitespace-nowrap text-sm font-black" style={{ borderColor: "var(--border)" }}>Close</button> : null}
            </footer>
          </section>
        </div>
      ) : null}

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex min-w-0 justify-end" role="dialog" aria-modal="true" aria-label="Booking settings">
          <button type="button" className="absolute inset-0 bg-black/55" onClick={() => !settingsSaving && setSettingsOpen(false)} aria-label="Close booking settings" />
          <section className="relative grid h-[100dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l sm:max-w-[30rem]" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <header className="flex min-w-0 items-start justify-between gap-3 border-b p-4 sm:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><div><p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>Booking settings</p><h2 className="mt-1 text-2xl font-black">Customer requests</h2></div><button type="button" onClick={() => setSettingsOpen(false)} disabled={settingsSaving} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xl font-black disabled:opacity-50" style={{ borderColor: "var(--border)" }} aria-label="Close">×</button></header>
            <div className="min-w-0 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-5 sm:pb-7">
              {settingsLoading ? <p className="text-sm font-black">Loading booking settings…</p> : !settingsForm ? <div><p className="text-sm font-bold" style={{ color: "var(--danger)" }}>{settingsError || "Booking settings are unavailable."}</p><button type="button" onClick={() => void loadSettings()} className="mt-3 rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>Try again</button></div> : (
                <div className="grid min-w-0 gap-4">
                  <label className="flex min-w-0 items-center justify-between gap-4 rounded-[1.25rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><span className="min-w-0"><span className="block text-sm font-black">Accept booking requests</span><span className="mt-1 block text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>Customers can send new requests when this is on.</span></span><input type="checkbox" checked={settingsForm.enabled} onChange={(event) => updateSettingsField("enabled", event.target.checked)} className="h-6 w-6 shrink-0 accent-[var(--accent)]" /></label>
                  <label className="block min-w-0 text-sm font-black">Booking button label<input value={settingsForm.bookingLabel} onChange={(event) => updateSettingsField("bookingLabel", event.target.value)} maxLength={80} placeholder="Book now" className={inputClass} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /><span className="mt-1.5 block text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>The action customers will see.</span></label>
                  <label className="block min-w-0 text-sm font-black">Instructions for customers<textarea value={settingsForm.instructions} onChange={(event) => updateSettingsField("instructions", event.target.value)} maxLength={1000} rows={5} placeholder="Tell customers what to include in their request." className={`${inputClass} resize-y`} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /></label>
                  <fieldset className="min-w-0"><legend className="text-sm font-black">Minimum notice</legend><p className="mt-1 text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>How early customers should send a request.</p><div className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.8fr)] gap-2"><input type="number" min="0" step="1" inputMode="numeric" value={settingsForm.minimumAdvanceValue} onChange={(event) => updateSettingsField("minimumAdvanceValue", event.target.value)} placeholder="No minimum" className="min-w-0 rounded-[0.9rem] border px-3.5 py-3 text-base font-bold outline-none focus:border-[var(--accent)]" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /><select value={settingsForm.minimumAdvanceUnit} onChange={(event) => updateSettingsField("minimumAdvanceUnit", event.target.value as SettingsForm["minimumAdvanceUnit"])} className="min-w-0 rounded-[0.9rem] border px-3 py-3 text-sm font-black outline-none focus:border-[var(--accent)]" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div></fieldset>
                  <label className="block min-w-0 text-sm font-black">How far ahead customers can request<input type="number" min="1" max="730" step="1" inputMode="numeric" value={settingsForm.maximumAdvanceDays} onChange={(event) => updateSettingsField("maximumAdvanceDays", event.target.value)} placeholder="No limit" className={inputClass} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} /><span className="mt-1.5 block text-xs font-semibold leading-5" style={{ color: "var(--muted)" }}>Enter the number of days, or leave blank.</span></label>
                </div>
              )}
            </div>
            <footer className="flex min-w-0 items-center justify-between gap-3 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><span className="min-w-0 break-words text-sm font-bold" aria-live="polite" style={{ color: settingsSaveState && settingsSaveState !== "Saved" ? "var(--danger)" : "var(--muted)" }}>{settingsSaveState}</span><button type="button" disabled={!settingsForm || !settingsDirty || settingsSaving} onClick={() => void saveSettings()} className="shrink-0 rounded-full px-4 py-3 whitespace-nowrap text-sm font-black disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>{settingsSaving ? "Saving…" : settingsSaveState === "Saved" ? "Saved" : "Save settings"}</button></footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="grid min-w-0 gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3"><dt className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{label}</dt><dd className="m-0 min-w-0 break-words text-sm font-bold leading-5">{value}</dd></div>;
}

function ConfirmationPanel({ mode, confirmedDate, setConfirmedDate, working, error, onCancel, onConfirm }: { mode: Exclude<ConfirmationMode, null>; confirmedDate: string; setConfirmedDate: (value: string) => void; working: boolean; error: string; onCancel: () => void; onConfirm: (status: "accepted" | "declined" | "completed" | "cancelled") => void }) {
  const copy = mode === "decline" ? { title: "Decline this request?", text: "This moves it to booking history.", keep: "Keep request", confirm: "Decline request", status: "declined" as const } : mode === "complete" ? { title: "Mark this booking complete?", text: "The completed booking will move to history.", keep: "Not yet", confirm: "Mark complete", status: "completed" as const } : mode === "cancel" ? { title: "Cancel this accepted booking?", text: "This moves it to booking history.", keep: "Keep booking", confirm: "Cancel booking", status: "cancelled" as const } : null;

  return <div className="min-w-0 rounded-[1.25rem] border p-4" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}><h3 className="text-lg font-black">{mode === "accept" ? "Accept this request" : copy?.title}</h3>{mode === "accept" ? <><p className="mt-1 text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>Confirm the date and time. The customer’s requested time will remain unchanged.</p><label className="mt-3 block text-sm font-black">Confirmed date and time<input type="datetime-local" value={confirmedDate} onChange={(event) => setConfirmedDate(event.target.value)} className="mt-2 w-full min-w-0 rounded-[0.9rem] border px-3 py-3 text-base font-bold outline-none focus:border-[var(--accent)]" style={{ background: "var(--surface-strong)", borderColor: "var(--border)", color: "var(--text)" }} /></label></> : <p className="mt-1 text-sm font-semibold leading-5" style={{ color: "var(--muted)" }}>{copy?.text}</p>}{error ? <p className="mt-3 break-words text-sm font-bold" role="alert" style={{ color: "var(--danger)" }}>{error}</p> : null}<div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={working} onClick={onCancel} className="rounded-full border px-3 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50" style={{ borderColor: "var(--border)" }}>{mode === "accept" ? "Not yet" : copy?.keep}</button><button type="button" disabled={working} onClick={() => onConfirm(mode === "accept" ? "accepted" : copy!.status)} className="rounded-full px-3 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50" style={{ background: mode === "decline" || mode === "cancel" ? "var(--danger)" : "var(--accent)", color: "#fff" }}>{working ? "Updating…" : mode === "accept" ? "Accept booking" : copy?.confirm}</button></div></div>;
}
