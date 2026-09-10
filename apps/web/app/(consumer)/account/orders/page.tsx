"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
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

type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  customerNote: string | null;
  sortOrder?: number;
  createdAt?: string;
};

type Order = {
  id: string;
  businessId: string;
  fulfillmentType: string;
  deliveryAddress: string | null;
  customerNote: string | null;
  status: string;
  respondedAt: string | null;
  startedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  business: Business;
  items: OrderItem[];
};

type ListResponse = {
  ok: true;
  data: {
    orders: Order[];
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
    order: Order;
  };
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-RW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function fulfillmentLabel(value: string) {
  if (value === "on_site") return "On site";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function summarizeItems(items: OrderItem[]) {
  if (!items.length) return "No items";

  const first = items
    .slice(0, 2)
    .map((item) => `${item.itemName} ×${item.quantity}`)
    .join(" / ");

  const remaining = items.length - 2;

  return remaining > 0 ? `${first} / +${remaining} more` : first;
}

function lifecycleRows(order: Order) {
  return [
    ["Sent", order.createdAt],
    ["Responded", order.respondedAt],
    ["Started", order.startedAt],
    ["Ready", order.readyAt],
    ["Completed", order.completedAt],
    ["Cancelled", order.cancelledAt],
  ].filter((row): row is [string, string] => Boolean(row[1]));
}

export default function CustomerOrdersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setListError("");

      try {
        const response = await apiRequest<ListResponse>(
          `/account/orders?page=${page}&limit=10`,
        );

        if (!cancelled) {
          setData(response.data);
        }
      } catch {
        if (!cancelled) {
          setListError("We could not load your orders.");
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
    if (!selectedOrder) return;

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
        setSelectedOrder(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;

      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedOrder]);

  async function openOrder(order: Order) {
    setSelectedOrder(order);
    setDetailLoading(true);
    setDetailError("");

    try {
      const response = await apiRequest<DetailResponse>(
        `/account/orders/${order.id}`,
      );

      setSelectedOrder(response.data.order);
    } catch {
      setDetailError("We could not load this order.");
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
            Orders
          </h1>

          <p
            className="mt-1.5 max-w-xl text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            Follow your order requests from sent to ready or completed.
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
          className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.45fr)_minmax(7rem,0.55fr)_minmax(8rem,0.65fr)_1.5rem] gap-4 border-b px-5 py-3 text-[0.66rem] font-black uppercase tracking-[0.12em] md:grid"
          style={{
            color: "var(--muted)",
            borderColor: "var(--border)",
          }}
        >
          <span>Business</span>
          <span>Order</span>
          <span>Type</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div>
            {[1, 2, 3, 4, 5].map((item) => (
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
        ) : !data?.orders.length ? (
          <div className="p-6 sm:p-8">
            <ShoppingBag size={23} style={{ color: "var(--muted)" }} />
            <h2 className="mt-4 text-lg font-black">No orders yet</h2>
            <p
              className="mt-1 text-sm font-semibold leading-6"
              style={{ color: "var(--muted)" }}
            >
              Orders you send to businesses will appear here.
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
            {data.orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => void openOrder(order)}
                className="group grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 border-b px-4 py-3.5 text-left outline-none transition-colors last:border-b-0 hover:bg-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:px-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.45fr)_minmax(7rem,0.55fr)_minmax(8rem,0.65fr)_1.5rem] md:items-center md:gap-4 md:py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {order.business.displayName}
                  </p>

                  <p
                    className="mt-0.5 truncate text-xs font-semibold md:hidden"
                    style={{ color: "var(--muted)" }}
                  >
                    {order.business.city}
                  </p>
                </div>

                <div className="justify-self-end md:col-start-4 md:row-start-1 md:justify-self-start">
                  <RequestStatusBadge status={order.status} order />
                </div>

                <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
                  <p className="truncate text-sm font-bold">
                    {summarizeItems(order.items)}
                  </p>

                  <p
                    className="mt-0.5 text-xs font-semibold md:hidden"
                    style={{ color: "var(--muted)" }}
                  >
                    {fulfillmentLabel(order.fulfillmentType)} /{" "}
                    {compactDate(order.createdAt)}
                  </p>
                </div>

                <p
                  className="hidden truncate text-sm font-bold md:block"
                  style={{ color: "var(--muted)" }}
                >
                  {fulfillmentLabel(order.fulfillmentType)}
                </p>

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

      {selectedOrder ? (
        <RequestDrawerShell
          title={selectedOrder.business.displayName}
          subtitle="Order details"
          onClose={() => setSelectedOrder(null)}
          footer={
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(7.5rem,auto)] gap-3">
              <Link
                href={`/places/${selectedOrder.business.slug}`}
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
                onClick={() => setSelectedOrder(null)}
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
                  <RequestStatusBadge
                    status={selectedOrder.status}
                    order
                  />

                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--muted)" }}
                  >
                    Sent {formatDateTime(selectedOrder.createdAt)}
                  </span>
                </div>
              </RequestDetailSection>

              <RequestDetailSection label="Requested items">
                <div className="divide-y divide-[var(--border)]">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex min-w-0 items-start justify-between gap-5 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black">
                          {item.itemName}
                        </p>
                        {item.customerNote ? (
                          <p
                            className="mt-1 break-words text-xs font-semibold leading-5"
                            style={{ color: "var(--muted)" }}
                          >
                            {item.customerNote}
                          </p>
                        ) : null}
                      </div>

                      <span className="shrink-0 text-sm font-black">
                        × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </RequestDetailSection>

              <RequestDetailSection label="Fulfillment">
                <dl>
                  <RequestDetailRow
                    label="Type"
                    value={fulfillmentLabel(
                      selectedOrder.fulfillmentType,
                    )}
                  />

                  {selectedOrder.deliveryAddress ? (
                    <RequestDetailRow
                      label="Deliver to"
                      value={selectedOrder.deliveryAddress}
                    />
                  ) : null}

                  <RequestDetailRow
                    label="City"
                    value={selectedOrder.business.city}
                  />
                </dl>
              </RequestDetailSection>

              {selectedOrder.customerNote ? (
                <RequestDetailSection label="Your note">
                  <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6">
                    {selectedOrder.customerNote}
                  </p>
                </RequestDetailSection>
              ) : null}

              <RequestDetailSection label="Progress">
                <dl>
                  {lifecycleRows(selectedOrder).map(([label, value]) => (
                    <RequestDetailRow
                      key={label}
                      label={label}
                      value={formatDateTime(value)}
                    />
                  ))}
                </dl>
              </RequestDetailSection>

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
                      {selectedOrder.business.displayName}
                    </p>
                    <p
                      className="mt-0.5 text-sm font-semibold capitalize"
                      style={{ color: "var(--muted)" }}
                    >
                      {selectedOrder.business.category} /{" "}
                      {selectedOrder.business.city}
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
