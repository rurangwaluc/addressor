"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { RequestStatusBadge } from "@/components/account/AccountRequestUI";

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
  requestType: string;
  preferredDate: string | null;
  confirmedDate: string | null;
  status: string;
  createdAt: string;
  business: Business;
};

type Order = {
  id: string;
  fulfillmentType: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
  }>;
  business: Business;
};

type User = {
  fullName: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type State = {
  user: User;
  bookings: Booking[];
  orders: Order[];
  bookingTotal: number;
  orderTotal: number;
};

type Activity =
  | {
      kind: "booking";
      id: string;
      business: Business;
      title: string;
      detail: string;
      status: string;
      createdAt: string;
    }
  | {
      kind: "order";
      id: string;
      business: Business;
      title: string;
      detail: string;
      status: string;
      createdAt: string;
    };

function formatPhone(value: string | null) {
  if (!value) return "Not added";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("250")) {
    return `+250 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }

  return value.startsWith("+") ? value : `+${value}`;
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function bookingDetail(booking: Booking) {
  const value =
    booking.status === "accepted" && booking.confirmedDate
      ? booking.confirmedDate
      : booking.preferredDate;

  if (!value) return "Time not provided";

  const prefix =
    booking.status === "accepted" && booking.confirmedDate
      ? "Confirmed"
      : "Requested";

  return `${prefix} ${compactDate(value)}`;
}

function orderSummary(order: Order) {
  if (!order.items.length) return "Order request";

  const visible = order.items
    .slice(0, 2)
    .map((item) => `${item.itemName} ×${item.quantity}`)
    .join(" / ");

  const remaining = order.items.length - 2;

  return remaining > 0 ? `${visible} / +${remaining} more` : visible;
}

export default function AccountPage() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [me, bookings, orders] = await Promise.all([
          apiRequest<{
            ok: true;
            data: { user: User };
          }>("/auth/me"),
          apiRequest<{
            ok: true;
            data: {
              bookings: Booking[];
              pagination: { total: number };
            };
          }>("/account/bookings?page=1&limit=4"),
          apiRequest<{
            ok: true;
            data: {
              orders: Order[];
              pagination: { total: number };
            };
          }>("/account/orders?page=1&limit=4"),
        ]);

        if (cancelled) return;

        setState({
          user: me.data.user,
          bookings: bookings.data.bookings,
          orders: orders.data.orders,
          bookingTotal: bookings.data.pagination.total,
          orderTotal: orders.data.pagination.total,
        });
      } catch {
        if (!cancelled) {
          setError("We could not load your account right now.");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const activity = useMemo<Activity[]>(() => {
    if (!state) return [];

    const rows: Activity[] = [
      ...state.bookings.map((booking) => ({
        kind: "booking" as const,
        id: booking.id,
        business: booking.business,
        title: booking.requestType,
        detail: bookingDetail(booking),
        status: booking.status,
        createdAt: booking.createdAt,
      })),
      ...state.orders.map((order) => ({
        kind: "order" as const,
        id: order.id,
        business: order.business,
        title: orderSummary(order),
        detail: `${order.fulfillmentType === "on_site" ? "On site" : order.fulfillmentType.charAt(0).toUpperCase() + order.fulfillmentType.slice(1)} / ${compactDate(order.createdAt)}`,
        status: order.status,
        createdAt: order.createdAt,
      })),
    ];

    return rows
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [state]);

  if (error) {
    return (
      <section
        className="border p-5"
        style={{
          background: "var(--surface-strong)",
          borderColor: "var(--border)",
        }}
      >
        <p className="font-black">{error}</p>
      </section>
    );
  }

  if (!state) {
    return (
      <div className="space-y-5">
        <div
          className="h-24 animate-pulse rounded-[1.1rem]"
          style={{ background: "var(--surface)" }}
        />
        <div
          className="h-80 animate-pulse rounded-[1.1rem]"
          style={{ background: "var(--surface)" }}
        />
      </div>
    );
  }

  const firstName = state.user.fullName.trim().split(/\s+/)[0] || "there";
  const phoneNeedsAttention =
    !state.user.phone || !state.user.phoneVerified;

  return (
    <div className="space-y-6">
      <header className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p
            className="text-[0.68rem] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--accent)" }}
          >
            Your account
          </p>

          <h1 className="mt-1.5 text-3xl font-black tracking-[-0.055em] sm:text-4xl">
            Hi, {firstName}.
          </h1>

          <p
            className="mt-1.5 max-w-xl text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            Your bookings, orders and contact details in one place.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-black transition active:scale-[0.99]"
          style={{
            background: "var(--accent)",
            color: "var(--accent-contrast)",
          }}
        >
          <Search size={16} />
          Find places
        </Link>
      </header>

      {phoneNeedsAttention ? (
        <section
          className="flex min-w-0 flex-col gap-3 border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: "var(--surface-strong)",
            borderColor:
              "color-mix(in srgb, var(--accent) 35%, var(--border))",
          }}
        >
          <div className="flex min-w-0 items-start gap-3">
            <Phone
              size={18}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--accent)" }}
            />

            <div className="min-w-0">
              <p className="text-sm font-black">
                Verify your phone number
              </p>
              <p
                className="mt-0.5 text-xs font-semibold leading-5"
                style={{ color: "var(--muted)" }}
              >
                Keep your contact details ready for future bookings and orders.
              </p>
            </div>
          </div>

          <Link
            href="/account/profile"
            className="shrink-0 whitespace-nowrap text-sm font-black"
            style={{ color: "var(--accent)" }}
          >
            Review profile
          </Link>
        </section>
      ) : null}

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section
          className="min-w-0 overflow-hidden rounded-[1.2rem] border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="flex min-w-0 items-center justify-between gap-4 border-b px-4 py-3.5 sm:px-5"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="min-w-0">
              <h2 className="text-base font-black">Recent activity</h2>
              <p
                className="mt-0.5 text-xs font-semibold"
                style={{ color: "var(--muted)" }}
              >
                Latest requests across your account
              </p>
            </div>

            <span
              className="shrink-0 text-xs font-black"
              style={{ color: "var(--muted)" }}
            >
              {state.bookingTotal + state.orderTotal} total
            </span>
          </div>

          {activity.length === 0 ? (
            <div className="px-5 py-8">
              <h3 className="font-black">No activity yet</h3>
              <p
                className="mt-1 text-sm font-semibold leading-6"
                style={{ color: "var(--muted)" }}
              >
                Your booking and order requests will appear here.
              </p>
            </div>
          ) : (
            <div>
              {activity.map((item) => {
                const Icon =
                  item.kind === "booking"
                    ? CalendarDays
                    : ShoppingBag;

                const href =
                  item.kind === "booking"
                    ? "/account/bookings"
                    : "/account/orders";

                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={href}
                    className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0 hover:bg-[var(--surface-strong)] sm:px-5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div
                      className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: "var(--surface-strong)",
                        color: "var(--muted)",
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="min-w-0 truncate text-sm font-black">
                          {item.business.displayName}
                        </p>

                        <span
                          className="text-[0.66rem] font-black uppercase tracking-[0.1em]"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.kind}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm font-bold">
                        {item.title}
                      </p>

                      <p
                        className="mt-0.5 truncate text-xs font-semibold"
                        style={{ color: "var(--muted)" }}
                      >
                        {item.detail}
                      </p>

                      <div className="mt-2 sm:hidden">
                        <RequestStatusBadge
                          status={item.status}
                          order={item.kind === "order"}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="hidden sm:block">
                        <RequestStatusBadge
                          status={item.status}
                          order={item.kind === "order"}
                        />
                      </div>

                      <ChevronRight
                        size={17}
                        className="mt-0.5 transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--muted)" }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div
            className="grid grid-cols-2 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <Link
              href="/account/bookings"
              className="flex min-w-0 items-center justify-between gap-3 border-r px-4 py-3.5 text-sm font-black transition hover:bg-[var(--surface-strong)] sm:px-5"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="truncate">Bookings</span>
              <span style={{ color: "var(--muted)" }}>
                {state.bookingTotal}
              </span>
            </Link>

            <Link
              href="/account/orders"
              className="flex min-w-0 items-center justify-between gap-3 px-4 py-3.5 text-sm font-black transition hover:bg-[var(--surface-strong)] sm:px-5"
            >
              <span className="truncate">Orders</span>
              <span style={{ color: "var(--muted)" }}>
                {state.orderTotal}
              </span>
            </Link>
          </div>
        </section>

        <aside
          className="min-w-0 overflow-hidden rounded-[1.2rem] border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="border-b px-4 py-3.5"
            style={{ borderColor: "var(--border)" }}
          >
            <p
              className="text-[0.66rem] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--muted)" }}
            >
              Your details
            </p>

            <p className="mt-2 break-words text-base font-black">
              {state.user.fullName}
            </p>
          </div>

          <div className="divide-y divide-[var(--border)]">
            <div className="flex min-w-0 items-start gap-3 px-4 py-3.5">
              <Mail
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--muted)" }}
              />
              <div className="min-w-0">
                <p
                  className="text-[0.66rem] font-black uppercase tracking-[0.1em]"
                  style={{ color: "var(--muted)" }}
                >
                  Email
                </p>
                <p className="mt-1 break-all text-sm font-bold">
                  {state.user.email || "Not added"}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-start gap-3 px-4 py-3.5">
              <Phone
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--muted)" }}
              />
              <div className="min-w-0">
                <p
                  className="text-[0.66rem] font-black uppercase tracking-[0.1em]"
                  style={{ color: "var(--muted)" }}
                >
                  Phone
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatPhone(state.user.phone)}
                </p>
                <p
                  className="mt-1 text-xs font-black"
                  style={{
                    color: state.user.phoneVerified
                      ? "var(--success)"
                      : "var(--muted)",
                  }}
                >
                  {state.user.phoneVerified && state.user.phone
                    ? "Verified"
                    : "Verification needed"}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/account/profile"
            className="flex min-w-0 items-center justify-between gap-3 border-t px-4 py-3.5 text-sm font-black transition hover:bg-[var(--surface-strong)]"
            style={{ borderColor: "var(--border)" }}
          >
            <span>Manage profile</span>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
