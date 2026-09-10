"use client";

import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export function requestStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Waiting for response",
    accepted: "Confirmed",
    in_progress: "In progress",
    ready: "Ready",
    declined: "Declined",
    cancelled: "Cancelled",
    completed: "Completed",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

export function RequestStatusBadge({
  status,
  order = false,
}: {
  status: string;
  order?: boolean;
}) {
  const label =
    order && status === "accepted"
      ? "Accepted"
      : requestStatusLabel(status);

  let style: React.CSSProperties = {
    background: "var(--surface-strong)",
    color: "var(--muted)",
    borderColor: "var(--border)",
  };

  if (status === "new") {
    style = {
      background: "var(--accent-soft)",
      color: "var(--accent)",
      borderColor: "color-mix(in srgb, var(--accent) 30%, var(--border))",
    };
  }

  if (
    status === "accepted" ||
    status === "in_progress" ||
    status === "ready" ||
    status === "completed"
  ) {
    style = {
      background: "color-mix(in srgb, var(--success) 12%, transparent)",
      color: "var(--success)",
      borderColor: "color-mix(in srgb, var(--success) 26%, var(--border))",
    };
  }

  if (status === "declined" || status === "cancelled") {
    style = {
      background: "color-mix(in srgb, var(--danger) 10%, transparent)",
      color: "var(--danger)",
      borderColor: "color-mix(in srgb, var(--danger) 24%, var(--border))",
    };
  }

  return (
    <span
      className="inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.68rem] font-black leading-4"
      style={style}
    >
      {label}
    </span>
  );
}

export function RequestPagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 pt-1">
      <button
        type="button"
        disabled={!hasPreviousPage}
        onClick={onPrevious}
        className="inline-flex min-w-[6.6rem] items-center justify-start gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-black transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-35"
        style={{ borderColor: "var(--border)" }}
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <p
        className="shrink-0 text-xs font-black"
        style={{ color: "var(--muted)" }}
      >
        {page} / {totalPages}
      </p>

      <button
        type="button"
        disabled={!hasNextPage}
        onClick={onNext}
        className="inline-flex min-w-[6.6rem] items-center justify-end gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-black transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-35"
        style={{ borderColor: "var(--border)" }}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function RequestDrawerShell({
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 !m-0 z-[70] flex min-w-0 justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        aria-label="Close details"
      />

      <section
        className="relative grid h-[100dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l sm:max-w-[31rem]"
        style={{
          background: "var(--bg)",
          borderColor: "var(--border)",
        }}
      >
        <header
          className="flex min-w-0 items-center justify-between gap-4 border-b px-4 pb-3 pt-1 sm:px-5 sm:pb-3 sm:pt-1"
          style={{
            background: "var(--bg)",
            borderColor: "var(--border)",
          }}
        >
          <div className="min-w-0">
            <p
              className="text-[0.68rem] font-black uppercase tracking-[0.18em]"
              style={{ color: "var(--accent)" }}
            >
              {subtitle}
            </p>
            <h2 className="break-words text-xl font-black leading-tight tracking-[-0.04em] sm:text-2xl">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition hover:bg-[var(--surface-strong)]"
            style={{ borderColor: "var(--border)" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-w-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          {children}
        </div>

        <footer
          className="border-t px-4 py-4 sm:px-5"
          style={{
            background: "var(--bg)",
            borderColor: "var(--border)",
            boxShadow: "0 -12px 30px rgba(0,0,0,0.18)",
            paddingBottom:
              "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          {footer}
        </footer>
      </section>
    </div>
  );
}

export function RequestDetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border-b py-5 first:pt-0 last:border-b-0"
      style={{ borderColor: "var(--border)" }}
    >
      <p
        className="text-[0.68rem] font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </p>

      <div className="mt-3">{children}</div>
    </section>
  );
}

export function RequestDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-5 py-1.5">
      <dt
        className="shrink-0 text-sm font-bold"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-sm font-black">
        {value}
      </dd>
    </div>
  );
}
