"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AccessContext } from "@/lib/authRedirect";
import { apiRequest } from "@/lib/api";
import { getStoredAccessContext } from "@/lib/authSession";
import { chooseActiveBusiness, getBusinessId } from "@/lib/businessSession";

type OrderStatus =
  | "new"
  | "accepted"
  | "in_progress"
  | "ready"
  | "declined"
  | "cancelled"
  | "completed";

type OrderView = "attention" | "active" | "history";

type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  customerNote: string | null;
  sortOrder: number;
  createdAt: string;
};

type BusinessOrder = {
  id: string;
  businessId: string;
  customerUserId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  fulfillmentType: "pickup" | "delivery" | "on_site";
  deliveryAddress: string | null;
  customerNote: string | null;
  status: OrderStatus;
  ownerNote: string | null;
  respondedAt: string | null;
  startedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type OrderCounts = Record<OrderView, number>;

type OrderListData = {
  orders: BusinessOrder[];
  pagination: Pagination;
  counts: OrderCounts;
};

type OrderSettings = {
  businessId: string;
  enabled: boolean;
  instructions: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ApiResponse<T> = {
  ok: true;
  data: T;
};

const ordersPerPage = 10;

const emptyCounts: OrderCounts = {
  attention: 0,
  active: 0,
  history: 0,
};

const viewLabels: Record<OrderView, string> = {
  attention: "Needs attention",
  active: "Active",
  history: "History",
};

const emptyCopy: Record<OrderView, { title: string; text: string }> = {
  attention: {
    title: "No new orders.",
    text: "New customer order requests will appear here.",
  },
  active: {
    title: "No active orders.",
    text: "Accepted orders being prepared or waiting for collection will appear here.",
  },
  history: {
    title: "No order history yet.",
    text: "Completed, declined, and cancelled orders will appear here.",
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

function formatStatus(status: OrderStatus) {
  if (status === "in_progress") return "In progress";

  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function formatFulfillment(value: BusinessOrder["fulfillmentType"]) {
  if (value === "pickup") return "Pickup";
  if (value === "delivery") return "Delivery";
  return "On site";
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

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function summarizeItems(items: OrderItem[]) {
  if (items.length === 0) return "No items";

  const visible = items
    .slice(0, 2)
    .map((item) => `${item.quantity}× ${item.itemName}`)
    .join(", ");

  const remaining = items.length - 2;

  return remaining > 0
    ? `${visible} +${remaining} more`
    : visible;
}

function statusStyle(status: OrderStatus) {
  if (status === "new") {
    return {
      background: "var(--accent-soft)",
      color: "var(--accent)",
    };
  }

  if (status === "accepted" || status === "in_progress" || status === "ready") {
    return {
      background: "color-mix(in srgb, var(--success) 14%, transparent)",
      color: "var(--success)",
    };
  }

  if (status === "declined" || status === "cancelled") {
    return {
      background: "color-mix(in srgb, var(--danger) 10%, transparent)",
      color: "var(--danger)",
    };
  }

  return {
    background: "var(--surface-strong)",
    color: "var(--muted)",
  };
}

export default function BusinessOrdersPage() {
  const [access] = useState<AccessContext | null>(() => getStoredAccessContext());
  const business = chooseActiveBusiness(access?.businesses);
  const businessId = getBusinessId(business);

  const capabilityKnown = Boolean(business?.capabilities);
  const enabled = business?.capabilities?.orders === true;

  const [selectedView, setSelectedView] = useState<OrderView>("attention");
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [counts, setCounts] = useState<OrderCounts>(emptyCounts);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<BusinessOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [actionWorking, setActionWorking] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmingStatus, setConfirmingStatus] = useState<
    "declined" | "cancelled" | null
  >(null);

  const [ownerNote, setOwnerNote] = useState("");
  const [savedOwnerNote, setSavedOwnerNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteState, setNoteState] = useState("");

  const [settings, setSettings] = useState<OrderSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [settingsInstructions, setSettingsInstructions] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState("");

  const requestId = useRef(0);

  async function loadOrders(
    view = selectedView,
    requestedPage = page,
  ) {
    if (!businessId || !enabled) {
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;

    if (pagination) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await apiRequest<ApiResponse<OrderListData>>(
        `/businesses/${businessId}/orders?view=${view}&page=${requestedPage}&limit=${ordersPerPage}`,
      );

      if (currentRequest !== requestId.current) return;

      const validPage = Math.max(
        1,
        response.data.pagination.totalPages,
      );

      if (requestedPage > validPage) {
        setPage(validPage);
        return;
      }

      setOrders(response.data.orders);
      setCounts(response.data.counts);
      setPagination(response.data.pagination);
    } catch (nextError) {
      if (currentRequest === requestId.current) {
        setError(
          getErrorMessage(
            nextError,
            "We could not load your orders.",
          ),
        );
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    void loadOrders(selectedView, page);

    // The active business, selected view, and page define this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, enabled, selectedView, page]);

  async function loadSettings() {
    if (!businessId || !enabled) {
      setSettings(null);
      return;
    }

    setSettingsLoading(true);
    setSettingsError("");

    try {
      const response = await apiRequest<ApiResponse<OrderSettings>>(
        `/businesses/${businessId}/orders/settings`,
      );

      setSettings(response.data);
    } catch (nextError) {
      setSettingsError(
        getErrorMessage(
          nextError,
          "We could not load order settings.",
        ),
      );
    } finally {
      setSettingsLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();

    // The active business and Orders capability define these settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, enabled]);

  function openSettings() {
    setSettingsEnabled(settings?.enabled ?? false);
    setSettingsInstructions(settings?.instructions ?? "");
    setSettingsError("");
    setSettingsOpen(true);
  }

  function closeSettings() {
    if (settingsSaving) return;

    setSettingsOpen(false);
    setSettingsError("");
  }

  async function saveSettings() {
    if (!businessId) return;

    setSettingsSaving(true);
    setSettingsError("");

    try {
      const response = await apiRequest<ApiResponse<OrderSettings>>(
        `/businesses/${businessId}/orders/settings`,
        {
          method: "PATCH",
          body: JSON.stringify({
            enabled: settingsEnabled,
            instructions: settingsInstructions.trim() || null,
          }),
        },
      );

      setSettings(response.data);
      setSettingsOpen(false);
      setSettingsFeedback("Settings saved");

      window.setTimeout(() => {
        setSettingsFeedback("");
      }, 2500);
    } catch (nextError) {
      setSettingsError(
        getErrorMessage(
          nextError,
          "Order settings could not be saved.",
        ),
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function openOrder(order: BusinessOrder) {
    setSelectedOrder(order);
    setOwnerNote(order.ownerNote ?? "");
    setSavedOwnerNote(order.ownerNote ?? "");
    setDetailError("");
    setActionError("");
    setNoteState("");
    setConfirmingStatus(null);
    setDetailLoading(true);

    try {
      const response = await apiRequest<
        ApiResponse<{ order: BusinessOrder }>
      >(`/businesses/${businessId}/orders/${order.id}`);

      const detail = response.data.order;

      setSelectedOrder(detail);
      setOwnerNote(detail.ownerNote ?? "");
      setSavedOwnerNote(detail.ownerNote ?? "");
    } catch (nextError) {
      setDetailError(
        getErrorMessage(
          nextError,
          "We could not load this order.",
        ),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeOrder() {
    if (actionWorking || noteSaving) return;

    setSelectedOrder(null);
    setDetailError("");
    setActionError("");
    setNoteState("");
    setConfirmingStatus(null);
  }

  async function updateStatus(
    status:
      | "accepted"
      | "in_progress"
      | "ready"
      | "declined"
      | "cancelled"
      | "completed",
  ) {
    if (!selectedOrder) return;

    setActionWorking(true);
    setActionError("");

    try {
      const response = await apiRequest<
        ApiResponse<{ order: BusinessOrder }>
      >(
        `/businesses/${businessId}/orders/${selectedOrder.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      const nextOrder = response.data.order;

      setSelectedOrder(nextOrder);
      setOwnerNote(nextOrder.ownerNote ?? "");
      setSavedOwnerNote(nextOrder.ownerNote ?? "");
      setConfirmingStatus(null);

      await loadOrders(selectedView, page);
    } catch (nextError) {
      setActionError(
        getErrorMessage(
          nextError,
          "This order could not be updated.",
        ),
      );
    } finally {
      setActionWorking(false);
    }
  }

  async function saveNote() {
    if (!selectedOrder) return;

    setNoteSaving(true);
    setNoteState("");

    try {
      const response = await apiRequest<
        ApiResponse<{ order: BusinessOrder }>
      >(
        `/businesses/${businessId}/orders/${selectedOrder.id}/note`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ownerNote: ownerNote.trim() || null,
          }),
        },
      );

      const nextOrder = response.data.order;

      setSelectedOrder(nextOrder);
      setOwnerNote(nextOrder.ownerNote ?? "");
      setSavedOwnerNote(nextOrder.ownerNote ?? "");
      setNoteState("Note saved");

      await loadOrders(selectedView, page);
    } catch (nextError) {
      setNoteState(
        getErrorMessage(
          nextError,
          "The note could not be saved.",
        ),
      );
    } finally {
      setNoteSaving(false);
    }
  }

  function handleRowKey(
    event: KeyboardEvent<HTMLElement>,
    order: BusinessOrder,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openOrder(order);
    }
  }

  return (
    <div className="grid w-full min-w-0 gap-4 sm:gap-5">
      <section className="min-w-0 px-1 py-1 sm:px-0">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p
              className="text-[0.68rem] font-black uppercase tracking-[0.2em]"
              style={{ color: "var(--accent)" }}
            >
              Orders
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-[-0.045em] sm:text-3xl">
              Manage customer orders
            </h1>

            <p
              className="mt-1 max-w-2xl text-sm font-semibold leading-5"
              style={{ color: "var(--muted)" }}
            >
              Review new requests and keep accepted orders moving.
            </p>
          </div>

          {businessId && capabilityKnown && enabled ? (
            <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-2xl font-black leading-none">
                  {counts.attention}
                </p>
                <p
                  className="mt-1 text-xs font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  need attention
                </p>
              </div>

              <div
                className="hidden h-9 w-px sm:block"
                style={{
                  background:
                    "color-mix(in srgb, var(--border) 65%, transparent)",
                }}
              />

              <div className="flex items-center gap-2">
                <div className="grid gap-0.5">
                  <span
                    className="whitespace-nowrap text-xs font-black"
                    style={{
                      color: settingsError
                        ? "var(--danger)"
                        : settings?.enabled
                          ? "var(--success)"
                          : "var(--muted)",
                    }}
                  >
                    {settingsLoading
                      ? "Checking orders…"
                      : settingsError
                        ? "Settings unavailable"
                        : settings?.enabled
                          ? "Accepting orders"
                          : "Orders paused"}
                  </span>

                  <span
                    className="min-h-4 whitespace-nowrap text-[0.65rem] font-bold"
                    aria-live="polite"
                    style={{
                      color: settingsFeedback
                        ? "var(--success)"
                        : "transparent",
                    }}
                  >
                    {settingsFeedback || "Status"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={openSettings}
                  disabled={settingsLoading}
                  className="whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-50"
                  style={{ borderColor: "var(--border)" }}
                >
                  Order settings
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {!businessId ? (
        <Message
          title="Choose a business first."
          text="Orders need an active business."
        />
      ) : capabilityKnown && !enabled ? (
        <Message
          title="Orders are not enabled for this business."
          text="This business does not currently use the Orders feature."
        />
      ) : !capabilityKnown ? (
        <Message
          title="Orders are not available."
          text="Refresh your business access before opening Orders."
        />
      ) : loading ? (
        <Message
          title="Loading orders…"
          text="Your business navigation remains available."
          loading
        />
      ) : error ? (
        <Message
          title="Orders unavailable"
          text={error}
          action={() => void loadOrders()}
        />
      ) : (
        <>
          <nav
            className="grid min-w-0 grid-cols-3 border-b"
            aria-label="Order views"
            style={{ borderColor: "var(--border)" }}
          >
            {(Object.keys(viewLabels) as OrderView[]).map((view) => {
              const active = selectedView === view;

              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setSelectedView(view);
                  }}
                  disabled={refreshing && active}
                  className="flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[0.68rem] font-black leading-4 disabled:opacity-70 min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-xs sm:gap-2 sm:px-3 sm:text-sm"
                  style={{
                    borderColor: active ? "var(--accent)" : "transparent",
                    color: active ? "var(--text)" : "var(--muted)",
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{viewLabels[view]}</span>

                  <span
                    className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[0.65rem]"
                    style={{
                      background: "var(--surface-strong)",
                    }}
                  >
                    {counts[view]}
                  </span>
                </button>
              );
            })}
          </nav>

          <section
            className="min-w-0 overflow-hidden rounded-[0.85rem] border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="border-b px-4 py-3 sm:px-5"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-xl font-black">
                {viewLabels[selectedView]}
              </h2>

              <p
                className="mt-0.5 text-sm font-semibold"
                style={{ color: "var(--muted)" }}
              >
                {counts[selectedView]}{" "}
                {counts[selectedView] === 1 ? "order" : "orders"}
              </p>
            </div>

            {orders.length > 0 ? (
              <div
                className="hidden grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.65fr)_minmax(8rem,0.5fr)_auto] gap-x-3 border-b px-4 py-2 lg:grid"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--muted)",
                }}
              >
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em]">
                  Customer / order
                </span>
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em]">
                  Fulfillment
                </span>
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em]">
                  Received
                </span>
                <span className="text-[0.62rem] font-black uppercase tracking-[0.12em]">
                  Status
                </span>
              </div>
            ) : null}

            {orders.length === 0 ? (
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-black">
                  {emptyCopy[selectedView].title}
                </h3>

                <p
                  className="mt-1 text-sm font-semibold leading-6"
                  style={{ color: "var(--muted)" }}
                >
                  {emptyCopy[selectedView].text}
                </p>
              </div>
            ) : (
              <div
                className="divide-y transition-opacity"
                aria-busy={refreshing}
                style={{
                  borderColor: "color-mix(in srgb, var(--border) 55%, transparent)",
                  opacity: refreshing ? 0.68 : 1,
                }}
              >
                {orders.map((order) => (
                  <article
                    key={order.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open order from ${order.customerName}`}
                    onClick={() => openOrder(order)}
                    onKeyDown={(event) => handleRowKey(event, order)}
                    className="grid min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-3 outline-none transition-colors hover:bg-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:grid-cols-[minmax(0,1.35fr)_minmax(9rem,0.65fr)_auto] sm:items-center sm:px-4 sm:py-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.65fr)_minmax(8rem,0.5fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start gap-2">
                        <h3 className="min-w-0 break-words text-base font-black leading-5 sm:text-lg">
                          {order.customerName}
                        </h3>

                        <span
                          className="shrink-0 rounded-md px-2 py-1 whitespace-nowrap text-[0.65rem] font-black sm:hidden"
                          style={statusStyle(order.status)}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </div>

                      <p
                        className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-5"
                        style={{ color: "var(--muted)" }}
                      >
                        {summarizeItems(order.items)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="text-[0.65rem] font-black uppercase tracking-[0.12em]"
                        style={{ color: "var(--muted)" }}
                      >
                        Fulfillment
                      </p>

                      <p className="mt-0.5 whitespace-nowrap text-sm font-black">
                        {formatFulfillment(order.fulfillmentType)}
                      </p>
                    </div>

                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <p
                        className="text-xs font-bold"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatReceived(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className="hidden shrink-0 rounded-md px-2 py-1 whitespace-nowrap text-[0.68rem] font-black sm:block"
                      style={statusStyle(order.status)}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </article>
                ))}
              </div>
            )}

            {pagination && pagination.total > ordersPerPage ? (
              <div
                className="flex min-w-0 flex-col gap-2 border-t px-4 py-3 min-[375px]:flex-row min-[375px]:items-center min-[375px]:justify-between sm:px-5"
                style={{ borderColor: "var(--border)" }}
              >
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage || refreshing}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="rounded-full border px-3.5 py-2 whitespace-nowrap text-sm font-black disabled:opacity-45"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage || refreshing}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-full border px-3.5 py-2 whitespace-nowrap text-sm font-black disabled:opacity-45"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </>
      )}

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-[60] flex min-w-0 justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Order settings"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={closeSettings}
            aria-label="Close order settings"
          />

          <section
            className="relative grid h-[100dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l sm:max-w-[30rem]"
            style={{
              background: "var(--bg)",
              borderColor: "var(--border)",
            }}
          >
            <header
              className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-[0.65rem] font-black uppercase tracking-[0.18em]"
                  style={{ color: "var(--accent)" }}
                >
                  Order settings
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.035em] sm:text-2xl">
                  Customer ordering
                </h2>

                <p
                  className="mt-1 text-xs font-semibold leading-5"
                  style={{ color: "var(--muted)" }}
                >
                  Control whether customers can send new order requests.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSettings}
                disabled={settingsSaving}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-lg font-black disabled:opacity-50"
                style={{ borderColor: "var(--border)" }}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <div className="min-w-0 overflow-y-auto px-4 py-5 sm:px-5">
              <div className="grid min-w-0 gap-6">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settingsEnabled}
                  onClick={() =>
                    setSettingsEnabled((current) => !current)
                  }
                  className="flex w-full min-w-0 items-center justify-between gap-5 border-y py-4 text-left"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-black">
                      Accept customer orders
                    </span>

                    <span
                      className="mt-1 block text-xs font-semibold leading-5"
                      style={{ color: "var(--muted)" }}
                    >
                      {settingsEnabled
                        ? "Customers can send new order requests."
                        : "New customer order requests are paused."}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className="text-xs font-black"
                      style={{
                        color: settingsEnabled
                          ? "var(--success)"
                          : "var(--muted)",
                      }}
                    >
                      {settingsEnabled ? "On" : "Off"}
                    </span>

                    <span
                      className="relative h-6 w-11 shrink-0 rounded-full transition"
                      style={{
                        background: settingsEnabled
                          ? "var(--accent)"
                          : "var(--surface-strong)",
                      }}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
                          settingsEnabled ? "left-6" : "left-1"
                        }`}
                        style={{
                          background: settingsEnabled
                            ? "var(--accent-contrast)"
                            : "var(--muted)",
                        }}
                      />
                    </span>
                  </span>
                </button>

                <div className="min-w-0">
                  <label
                    htmlFor="order-customer-instructions"
                    className="text-sm font-black"
                  >
                    Instructions for customers
                  </label>

                  <p
                    className="mt-1 text-xs font-semibold leading-5"
                    style={{ color: "var(--muted)" }}
                  >
                    Add useful ordering, pickup or delivery guidance.
                  </p>

                  <textarea
                    id="order-customer-instructions"
                    value={settingsInstructions}
                    onChange={(event) => {
                      setSettingsInstructions(event.target.value);
                      setSettingsError("");
                    }}
                    maxLength={1000}
                    rows={6}
                    placeholder="Example: Pickup orders are usually ready within 30 minutes."
                    className="mt-3 w-full min-w-0 resize-y rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--accent)]"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  />

                  <div className="mt-1 flex justify-end">
                    <span
                      className="text-[0.68rem] font-bold"
                      style={{ color: "var(--muted)" }}
                    >
                      {settingsInstructions.length}/1000
                    </span>
                  </div>
                </div>

                {settingsError ? (
                  <div
                    className="border-l-2 py-1 pl-3"
                    role="alert"
                    style={{ borderColor: "var(--danger)" }}
                  >
                    <p className="text-sm font-bold">
                      {settingsError}
                    </p>
                  </div>
                ) : null}

                {!settingsEnabled ? (
                  <div
                    className="border-l-2 py-1 pl-3"
                    style={{ borderColor: "var(--muted)" }}
                  >
                    <p className="text-sm font-black">
                      Existing orders stay available.
                    </p>

                    <p
                      className="mt-1 text-xs font-semibold leading-5"
                      style={{ color: "var(--muted)" }}
                    >
                      Pausing orders only stops customers from sending new requests.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <footer
              className="flex justify-end gap-2 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <button
                type="button"
                onClick={closeSettings}
                disabled={settingsSaving}
                className="whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-black disabled:opacity-50"
                style={{ borderColor: "var(--border)" }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={settingsSaving}
                className="whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-black disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                }}
              >
                {settingsSaving ? "Saving…" : "Save settings"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {selectedOrder ? (
        <div
          className="fixed inset-0 z-50 flex min-w-0 justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Order details"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={closeOrder}
            aria-label="Close order details"
          />

          <section
            className="relative grid h-[100dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l sm:max-w-[32rem]"
            style={{
              background: "var(--bg)",
              borderColor: "var(--border)",
            }}
          >
            <header
              className="flex min-w-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-5"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-[0.65rem] font-black uppercase tracking-[0.18em]"
                  style={{ color: "var(--accent)" }}
                >
                  Order details
                </p>

                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="min-w-0 break-words text-xl font-black sm:text-2xl">
                    {selectedOrder.customerName}
                  </h2>

                  <span
                    className="shrink-0 rounded-md px-2 py-1 text-[0.68rem] font-black"
                    style={statusStyle(selectedOrder.status)}
                  >
                    {formatStatus(selectedOrder.status)}
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={closeOrder}
                disabled={actionWorking || noteSaving}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-lg font-black disabled:opacity-50"
                style={{ borderColor: "var(--border)" }}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <div className="min-w-0 overflow-y-auto overscroll-contain px-4 py-4 pb-12 sm:px-5 sm:pb-14">
              {detailLoading ? (
                <p className="text-sm font-black">
                  Loading order details…
                </p>
              ) : detailError ? (
                <div
                  className="border-l-2 py-1 pl-3"
                  role="alert"
                  style={{ borderColor: "var(--danger)" }}
                >
                  <p className="text-sm font-bold">
                    {detailError}
                  </p>
                </div>
              ) : (
                <div className="grid min-w-0 gap-5">
                  <section className="min-w-0">
                    <p
                      className="text-[0.65rem] font-black uppercase tracking-[0.14em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Customer
                    </p>

                    <div className="mt-2 grid gap-1.5">
                      <p className="break-words text-sm font-black">
                        {selectedOrder.customerName}
                      </p>

                      {selectedOrder.customerPhone ? (
                        <a
                          href={`tel:${selectedOrder.customerPhone}`}
                          className="w-fit break-words text-sm font-bold"
                          style={{ color: "var(--accent)" }}
                        >
                          {selectedOrder.customerPhone}
                        </a>
                      ) : null}

                      {selectedOrder.customerEmail ? (
                        <a
                          href={`mailto:${selectedOrder.customerEmail}`}
                          className="w-fit break-all text-sm font-bold"
                          style={{ color: "var(--accent)" }}
                        >
                          {selectedOrder.customerEmail}
                        </a>
                      ) : null}
                    </div>
                  </section>

                  <div
                    className="h-px"
                    style={{ background: "color-mix(in srgb, var(--border) 55%, transparent)" }}
                  />

                  <section className="min-w-0">
                    <p
                      className="text-[0.65rem] font-black uppercase tracking-[0.14em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Requested items
                    </p>

                    <div className="mt-2 grid min-w-0">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 ${
                            index === 0 ? "" : "border-t"
                          }`}
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--border) 55%, transparent)",
                          }}
                        >
                          <span
                            className="text-sm font-black"
                            style={{ color: "var(--accent)" }}
                          >
                            {item.quantity}×
                          </span>

                          <div className="min-w-0">
                            <p className="break-words text-sm font-black">
                              {item.itemName}
                            </p>

                            {item.customerNote ? (
                              <p
                                className="mt-1 whitespace-pre-wrap break-words text-xs font-semibold leading-5"
                                style={{ color: "var(--muted)" }}
                              >
                                {item.customerNote}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div
                    className="h-px"
                    style={{ background: "color-mix(in srgb, var(--border) 55%, transparent)" }}
                  />

                  <section className="grid min-w-0 gap-3">
                    <DetailItem
                      label="Fulfillment"
                      value={formatFulfillment(
                        selectedOrder.fulfillmentType,
                      )}
                    />

                    {selectedOrder.fulfillmentType === "delivery" ? (
                      <DetailItem
                        label="Delivery address"
                        value={
                          selectedOrder.deliveryAddress ||
                          "Not provided"
                        }
                      />
                    ) : null}

                    <DetailItem
                      label="Received"
                      value={formatDateTime(
                        selectedOrder.createdAt,
                      )}
                    />

                    {selectedOrder.respondedAt ? (
                      <DetailItem
                        label="Responded"
                        value={formatDateTime(
                          selectedOrder.respondedAt,
                        )}
                      />
                    ) : null}

                    {selectedOrder.startedAt ? (
                      <DetailItem
                        label="Started"
                        value={formatDateTime(
                          selectedOrder.startedAt,
                        )}
                      />
                    ) : null}

                    {selectedOrder.readyAt ? (
                      <DetailItem
                        label="Ready"
                        value={formatDateTime(
                          selectedOrder.readyAt,
                        )}
                      />
                    ) : null}

                    {selectedOrder.completedAt ? (
                      <DetailItem
                        label="Completed"
                        value={formatDateTime(
                          selectedOrder.completedAt,
                        )}
                      />
                    ) : null}

                    {selectedOrder.cancelledAt ? (
                      <DetailItem
                        label="Cancelled"
                        value={formatDateTime(
                          selectedOrder.cancelledAt,
                        )}
                      />
                    ) : null}
                  </section>

                  {selectedOrder.customerNote ? (
                    <>
                      <div
                        className="h-px"
                        style={{ background: "color-mix(in srgb, var(--border) 55%, transparent)" }}
                      />

                      <section className="min-w-0">
                        <p
                          className="text-[0.65rem] font-black uppercase tracking-[0.14em]"
                          style={{ color: "var(--muted)" }}
                        >
                          Customer note
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6">
                          {selectedOrder.customerNote}
                        </p>
                      </section>
                    </>
                  ) : null}

                  <div
                    className="h-px"
                    style={{ background: "color-mix(in srgb, var(--border) 55%, transparent)" }}
                  />

                  <section className="min-w-0">
                    <label
                      htmlFor="order-owner-note"
                      className="text-sm font-black"
                    >
                      Private owner note
                    </label>

                    <p
                      className="mt-1 text-xs font-semibold leading-5"
                      style={{ color: "var(--muted)" }}
                    >
                      Only your business team can see this note.
                    </p>

                    <textarea
                      id="order-owner-note"
                      value={ownerNote}
                      onChange={(event) => {
                        setOwnerNote(event.target.value);
                        setNoteState("");
                      }}
                      maxLength={1000}
                      rows={4}
                      className="mt-2 w-full min-w-0 resize-y rounded-[0.75rem] border px-3.5 py-3 text-sm font-semibold outline-none focus:border-[var(--accent)]"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />

                    <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
                      <span
                        className="min-w-0 break-words text-xs font-bold"
                        aria-live="polite"
                        style={{
                          color:
                            noteState &&
                            noteState !== "Note saved"
                              ? "var(--danger)"
                              : "var(--muted)",
                        }}
                      >
                        {noteState}
                      </span>

                      <button
                        type="button"
                        disabled={
                          noteSaving ||
                          ownerNote === savedOwnerNote
                        }
                        onClick={() => void saveNote()}
                        className="shrink-0 rounded-full border px-3.5 py-2 whitespace-nowrap text-xs font-black disabled:opacity-45"
                        style={{
                          borderColor: "var(--border)",
                        }}
                      >
                        {noteSaving
                          ? "Saving…"
                          : "Save note"}
                      </button>
                    </div>
                  </section>

                  {confirmingStatus ? (
                    <section
                      className="border-l-2 py-1 pl-3"
                      style={{
                        borderColor: "var(--danger)",
                      }}
                    >
                      <h3 className="text-sm font-black">
                        {confirmingStatus === "declined"
                          ? "Decline this order?"
                          : "Cancel this order?"}
                      </h3>

                      <p
                        className="mt-1 text-xs font-semibold leading-5"
                        style={{ color: "var(--muted)" }}
                      >
                        This moves the order to History.
                      </p>

                      {actionError ? (
                        <p
                          className="mt-2 text-xs font-bold"
                          role="alert"
                          style={{ color: "var(--danger)" }}
                        >
                          {actionError}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionWorking}
                          onClick={() => {
                            setConfirmingStatus(null);
                            setActionError("");
                          }}
                          className="rounded-full border px-3.5 py-2 whitespace-nowrap text-xs font-black disabled:opacity-50"
                          style={{
                            borderColor: "var(--border)",
                          }}
                        >
                          Keep order
                        </button>

                        <button
                          type="button"
                          disabled={actionWorking}
                          onClick={() =>
                            void updateStatus(
                              confirmingStatus,
                            )
                          }
                          className="rounded-full px-3.5 py-2 whitespace-nowrap text-xs font-black disabled:opacity-50"
                          style={{
                            background: "var(--danger)",
                            color: "#fff",
                          }}
                        >
                          {actionWorking
                            ? "Updating…"
                            : confirmingStatus ===
                                "declined"
                              ? "Decline order"
                              : "Cancel order"}
                        </button>
                      </div>
                    </section>
                  ) : actionError ? (
                    <p
                      className="text-sm font-bold"
                      role="alert"
                      style={{ color: "var(--danger)" }}
                    >
                      {actionError}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <footer
              className="border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              {!detailLoading &&
              !detailError &&
              !confirmingStatus ? (
                <OrderActions
                  status={selectedOrder.status}
                  working={actionWorking}
                  onUpdate={(status) =>
                    void updateStatus(status)
                  }
                  onConfirmNegative={(status) => {
                    setActionError("");
                    setConfirmingStatus(status);
                  }}
                  onClose={closeOrder}
                />
              ) : null}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
      <dt
        className="text-[0.65rem] font-black uppercase tracking-[0.12em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </dt>

      <dd className="m-0 min-w-0 break-words text-sm font-bold leading-5">
        {value}
      </dd>
    </div>
  );
}

function OrderActions({
  status,
  working,
  onUpdate,
  onConfirmNegative,
  onClose,
}: {
  status: OrderStatus;
  working: boolean;
  onUpdate: (
    status:
      | "accepted"
      | "in_progress"
      | "ready"
      | "completed",
  ) => void;
  onConfirmNegative: (
    status: "declined" | "cancelled",
  ) => void;
  onClose: () => void;
}) {
  if (
    status === "completed" ||
    status === "declined" ||
    status === "cancelled"
  ) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border px-4 py-2.5 whitespace-nowrap text-sm font-black"
          style={{ borderColor: "var(--border)" }}
        >
          Close
        </button>
      </div>
    );
  }

  if (status === "new") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={working}
          onClick={() =>
            onConfirmNegative("declined")
          }
          className="rounded-full border px-3 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50"
          style={{
            borderColor: "var(--border)",
            color: "var(--danger)",
          }}
        >
          Decline
        </button>

        <button
          type="button"
          disabled={working}
          onClick={() => onUpdate("accepted")}
          className="rounded-full px-3 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50"
          style={{
            background: "var(--accent)",
            color: "var(--accent-contrast)",
          }}
        >
          {working ? "Updating…" : "Accept"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap justify-end gap-2">
      {status === "accepted" ? (
        <button
          type="button"
          disabled={working}
          onClick={() => onUpdate("in_progress")}
          className="rounded-full px-3.5 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50"
          style={{
            background: "var(--accent)",
            color: "var(--accent-contrast)",
          }}
        >
          Start preparing
        </button>
      ) : null}

      {status === "accepted" ||
      status === "in_progress" ? (
        <button
          type="button"
          disabled={working}
          onClick={() => onUpdate("ready")}
          className="rounded-full border px-3.5 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          Mark ready
        </button>
      ) : null}

      <button
        type="button"
        disabled={working}
        onClick={() => onUpdate("completed")}
        className="rounded-full border px-3.5 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50"
        style={{ borderColor: "var(--border)" }}
      >
        Complete
      </button>

      <button
        type="button"
        disabled={working}
        onClick={() =>
          onConfirmNegative("cancelled")
        }
        className="rounded-full border px-3.5 py-2.5 whitespace-nowrap text-sm font-black disabled:opacity-50"
        style={{
          borderColor: "var(--border)",
          color: "var(--danger)",
        }}
      >
        Cancel
      </button>
    </div>
  );
}

function Message({
  title,
  text,
  loading = false,
  action,
}: {
  title: string;
  text: string;
  loading?: boolean;
  action?: () => void;
}) {
  return (
    <section
      className="rounded-[1.5rem] border p-4 sm:p-5"
      aria-busy={loading || undefined}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <h2 className="text-2xl font-black">{title}</h2>

      <p
        className="mt-2 text-sm font-semibold leading-6"
        style={{ color: "var(--muted)" }}
      >
        {text}
      </p>

      {action ? (
        <button
          type="button"
          onClick={action}
          className="mt-4 rounded-full px-4 py-2.5 whitespace-nowrap text-sm font-black"
          style={{
            background: "var(--accent)",
            color: "var(--accent-contrast)",
          }}
        >
          Try again
        </button>
      ) : null}
    </section>
  );
}
