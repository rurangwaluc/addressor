"use client";

import {
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getStoredAccessToken } from "@/lib/authSession";

type FulfillmentType = "pickup" | "delivery" | "on_site";

type RequestedItem = {
  id: number;
  itemName: string;
  quantity: number;
  customerNote: string;
};

type CreatedOrderResponse = {
  ok: true;
  data: {
    order: {
      id: string;
      status: string;
    };
  };
};

type PublicOrderActionProps = {
  businessId: string;
  businessName: string;
  slug: string;
  instructions: string | null;
};

const fulfillmentOptions: Array<{
  value: FulfillmentType;
  label: string;
}> = [
  { value: "pickup", label: "Pickup" },
  { value: "delivery", label: "Delivery" },
  { value: "on_site", label: "At the place" },
];

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

function emptyItem(id: number): RequestedItem {
  return {
    id,
    itemName: "",
    quantity: 1,
    customerNote: "",
  };
}

export default function PublicOrderAction({
  businessId,
  businessName,
  slug,
  instructions,
}: PublicOrderActionProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RequestedItem[]>([emptyItem(1)]);
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [sentOrderId, setSentOrderId] = useState("");
  const [showMobileStickyAction, setShowMobileStickyAction] = useState(false);

  const primaryActionRef = useRef<HTMLDivElement | null>(null);

  const returnPath = `/places/${slug}?order=1`;

  useEffect(() => {
    const shouldOpen =
      new URLSearchParams(window.location.search).get("order") === "1";

    if (shouldOpen && getStoredAccessToken()) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !working) {
        closeOrder();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, working]);

  function resetForm() {
    setItems([emptyItem(1)]);
    setFulfillmentType("pickup");
    setDeliveryAddress("");
    setCustomerNote("");
    setError("");
    setSentOrderId("");
  }

  function startOrder() {
    if (!getStoredAccessToken()) {
      window.location.assign(
        `/login?redirectTo=${encodeURIComponent(returnPath)}`,
      );
      return;
    }

    setError("");
    setOpen(true);
  }

  function closeOrder() {
    if (working) return;

    setOpen(false);

    const openedFromReturn =
      new URLSearchParams(window.location.search).get("order") === "1";

    if (openedFromReturn) {
      router.replace(`/places/${slug}`, { scroll: false });
    }

    if (sentOrderId) {
      resetForm();
    }
  }

  function updateItem(
    id: number,
    values: Partial<Omit<RequestedItem, "id">>,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...values } : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => {
      if (current.length >= 30) return current;

      const nextId =
        current.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;

      return [...current, emptyItem(nextId)];
    });
  }

  function removeItem(id: number) {
    setItems((current) => {
      if (current.length === 1) return current;

      return current.filter((item) => item.id !== id);
    });
  }

  function changeQuantity(item: RequestedItem, change: number) {
    const next = Math.min(99, Math.max(1, item.quantity + change));
    updateItem(item.id, { quantity: next });
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();

    if (working) return;

    const cleanedItems = items.map((item) => ({
      itemName: item.itemName.trim(),
      quantity: item.quantity,
      customerNote: item.customerNote.trim() || null,
    }));

    if (cleanedItems.some((item) => !item.itemName)) {
      setError("Enter a name for every requested item.");
      return;
    }

    if (
      fulfillmentType === "delivery" &&
      !deliveryAddress.trim()
    ) {
      setError("Enter the delivery address.");
      return;
    }

    setWorking(true);
    setError("");

    try {
      const response = await apiRequest<CreatedOrderResponse>(
        `/businesses/${businessId}/orders`,
        {
          method: "POST",
          body: JSON.stringify({
            fulfillmentType,
            deliveryAddress:
              fulfillmentType === "delivery"
                ? deliveryAddress.trim()
                : null,
            customerNote: customerNote.trim() || null,
            items: cleanedItems,
          }),
        },
      );

      setSentOrderId(response.data.order.id);
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
          "Your order request could not be sent. Try again.",
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
        id="order"
        className="mt-5"
      >
        <button
          type="button"
          onClick={startOrder}
          className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5 sm:w-auto sm:min-w-[15rem]"
          style={{
            background: "var(--accent)",
            color: "var(--primary-text)",
          }}
        >
          <ShoppingBag size={18} aria-hidden="true" />
          Order from this place
        </button>

        <p
          className="mt-2 text-xs font-bold leading-5"
          style={{ color: "var(--muted)" }}
        >
          Send your request directly to {businessName}.
        </p>
      </div>

      {!open && showMobileStickyAction ? (
        <div
          className="fixed inset-x-0 bottom-0 z-[70] border-t px-3 pt-3 lg:hidden"
          style={{
            background: "var(--surface-strong)",
            borderColor: "var(--border)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={startOrder}
            className="mx-auto flex min-h-[3.25rem] w-full max-w-lg items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 text-sm font-black"
            style={{
              background: "var(--accent)",
              color: "var(--primary-text)",
            }}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            Order from this place
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[90] bg-black/55"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeOrder();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-order-title"
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
                paddingTop: "max(1rem, env(safe-area-inset-top))",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className="text-[0.68rem] font-black uppercase tracking-[0.18em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Order request
                  </p>

                  <h2
                    id="public-order-title"
                    className="mt-1 text-2xl font-black tracking-[-0.04em]"
                  >
                    {sentOrderId ? "Request sent" : "What would you like?"}
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
                  onClick={closeOrder}
                  disabled={working}
                  aria-label="Close order"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border disabled:opacity-50"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </div>
            </header>

            {sentOrderId ? (
              <div className="flex flex-1 items-center overflow-y-auto px-5 py-8 sm:px-7">
                <div className="mx-auto w-full max-w-md text-center">
                  <div
                    className="mx-auto grid h-16 w-16 place-items-center rounded-full"
                    style={{
                      background:
                        "color-mix(in srgb, var(--success) 14%, transparent)",
                      color: "var(--success)",
                    }}
                  >
                    <CheckCircle2 size={32} aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">
                    Your request was sent
                  </h3>

                  <p
                    className="mt-3 text-sm font-semibold leading-7"
                    style={{ color: "var(--muted)" }}
                  >
                    {businessName} will review the request before confirming
                    the order.
                  </p>

                  <div
                    className="mt-6 rounded-xl border px-4 py-4 text-left"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p
                      className="text-xs font-black uppercase tracking-[0.12em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Important
                    </p>

                    <p className="mt-1 text-sm font-bold leading-6">
                      Sending a request does not mean the business has accepted
                      the order yet.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={submitOrder}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  {instructions ? (
                    <div
                      className="mb-5 rounded-xl border px-4 py-3"
                      style={{
                        background: "var(--accent-soft)",
                        borderColor:
                          "color-mix(in srgb, var(--accent) 30%, var(--border))",
                      }}
                    >
                      <p
                        className="text-xs font-black uppercase tracking-[0.12em]"
                        style={{ color: "var(--accent)" }}
                      >
                        Ordering guidance
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-6">
                        {instructions}
                      </p>
                    </div>
                  ) : null}

                  {error ? (
                    <div
                      className="mb-5 rounded-xl border px-4 py-3 text-sm font-bold leading-6"
                      style={{
                        background:
                          "color-mix(in srgb, var(--danger) 8%, transparent)",
                        borderColor:
                          "color-mix(in srgb, var(--danger) 34%, var(--border))",
                        color: "var(--danger)",
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  <section>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p
                          className="text-xs font-black uppercase tracking-[0.14em]"
                          style={{ color: "var(--accent)" }}
                        >
                          Your order
                        </p>

                        <h3 className="mt-1 text-lg font-black">
                          Requested items
                        </h3>
                      </div>

                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--muted)" }}
                      >
                        {items.length}/30
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {items.map((item, index) => (
                        <article
                          key={item.id}
                          className="rounded-xl border p-4"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black">
                              Item {index + 1}
                            </p>

                            {items.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                aria-label={`Remove item ${index + 1}`}
                                className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-black"
                                style={{ color: "var(--danger)" }}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                                Remove
                              </button>
                            ) : null}
                          </div>

                          <label className="mt-3 block">
                            <span
                              className="text-xs font-black uppercase tracking-[0.1em]"
                              style={{ color: "var(--muted)" }}
                            >
                              Item name
                            </span>

                            <input
                              value={item.itemName}
                              maxLength={160}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  itemName: event.target.value,
                                })
                              }
                              placeholder="Example: Grilled chicken"
                              className="mt-1.5 min-h-12 w-full rounded-xl border px-3.5 text-sm font-bold outline-none focus:border-[var(--accent)]"
                              style={{
                                background: "var(--surface-strong)",
                                borderColor: "var(--border)",
                                color: "var(--text)",
                              }}
                            />
                          </label>

                          <div className="mt-3 flex items-end justify-between gap-4">
                            <div>
                              <span
                                className="text-xs font-black uppercase tracking-[0.1em]"
                                style={{ color: "var(--muted)" }}
                              >
                                Quantity
                              </span>

                              <div className="mt-1.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={item.quantity <= 1}
                                  onClick={() => changeQuantity(item, -1)}
                                  aria-label="Decrease quantity"
                                  className="grid h-11 w-11 place-items-center rounded-lg border disabled:opacity-35"
                                  style={{
                                    background: "var(--surface-strong)",
                                    borderColor: "var(--border)",
                                  }}
                                >
                                  <Minus size={16} aria-hidden="true" />
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={item.quantity}
                                  onChange={(event) => {
                                    const value = Math.min(
                                      99,
                                      Math.max(
                                        1,
                                        Number(event.target.value) || 1,
                                      ),
                                    );

                                    updateItem(item.id, {
                                      quantity: value,
                                    });
                                  }}
                                  aria-label="Quantity"
                                  className="h-11 w-16 rounded-lg border text-center text-sm font-black outline-none focus:border-[var(--accent)]"
                                  style={{
                                    background: "var(--surface-strong)",
                                    borderColor: "var(--border)",
                                    color: "var(--text)",
                                  }}
                                />

                                <button
                                  type="button"
                                  disabled={item.quantity >= 99}
                                  onClick={() => changeQuantity(item, 1)}
                                  aria-label="Increase quantity"
                                  className="grid h-11 w-11 place-items-center rounded-lg border disabled:opacity-35"
                                  style={{
                                    background: "var(--surface-strong)",
                                    borderColor: "var(--border)",
                                  }}
                                >
                                  <Plus size={16} aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <label className="mt-3 block">
                            <span
                              className="text-xs font-black uppercase tracking-[0.1em]"
                              style={{ color: "var(--muted)" }}
                            >
                              Item note
                            </span>

                            <textarea
                              rows={2}
                              maxLength={500}
                              value={item.customerNote}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  customerNote: event.target.value,
                                })
                              }
                              placeholder="Optional: no onions, extra spicy..."
                              className="mt-1.5 w-full resize-none rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--accent)]"
                              style={{
                                background: "var(--surface-strong)",
                                borderColor: "var(--border)",
                                color: "var(--text)",
                              }}
                            />
                          </label>
                        </article>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={items.length >= 30}
                      className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-black disabled:opacity-50"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <Plus size={17} aria-hidden="true" />
                      Add another item
                    </button>
                  </section>

                  <section
                    className="mt-7 border-t pt-6"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p
                      className="text-xs font-black uppercase tracking-[0.14em]"
                      style={{ color: "var(--accent)" }}
                    >
                      How will you get it?
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {fulfillmentOptions.map((option) => {
                        const selected =
                          fulfillmentType === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setFulfillmentType(option.value);
                              setError("");
                            }}
                            className="min-h-12 rounded-xl border px-2 py-2 text-xs font-black sm:text-sm"
                            style={{
                              background: selected
                                ? "var(--accent-soft)"
                                : "var(--surface)",
                              borderColor: selected
                                ? "var(--accent)"
                                : "var(--border)",
                              color: selected
                                ? "var(--accent)"
                                : "var(--text)",
                            }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {fulfillmentType === "delivery" ? (
                      <label className="mt-4 block">
                        <span
                          className="text-xs font-black uppercase tracking-[0.1em]"
                          style={{ color: "var(--muted)" }}
                        >
                          Delivery address
                        </span>

                        <textarea
                          rows={3}
                          maxLength={500}
                          value={deliveryAddress}
                          onChange={(event) =>
                            setDeliveryAddress(event.target.value)
                          }
                          placeholder="Enter the delivery location clearly"
                          className="mt-1.5 w-full resize-none rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--accent)]"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        />
                      </label>
                    ) : null}
                  </section>

                  <section
                    className="mt-7 border-t pt-6"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <label className="block">
                      <span
                        className="text-xs font-black uppercase tracking-[0.14em]"
                        style={{ color: "var(--accent)" }}
                      >
                        Note for the business
                      </span>

                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={customerNote}
                        onChange={(event) =>
                          setCustomerNote(event.target.value)
                        }
                        placeholder="Optional: anything else the business should know?"
                        className="mt-2 w-full resize-none rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--accent)]"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </label>
                  </section>
                </div>

                <footer
                  className="shrink-0 border-t px-4 pt-3 sm:px-6"
                  style={{
                    background: "var(--surface-strong)",
                    borderColor: "var(--border)",
                    paddingBottom:
                      "max(1rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <button
                    type="submit"
                    disabled={working}
                    className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-xl px-5 text-sm font-black disabled:opacity-60"
                    style={{
                      background: "var(--accent)",
                      color: "var(--primary-text)",
                    }}
                  >
                    {working ? "Sending request…" : "Send order request"}
                  </button>

                  <p
                    className="mt-2 text-center text-[0.68rem] font-bold leading-5"
                    style={{ color: "var(--muted)" }}
                  >
                    The business must accept the request before the order is
                    confirmed.
                  </p>
                </footer>
              </form>
            )}

            {sentOrderId ? (
              <footer
                className="shrink-0 border-t px-4 pt-3 sm:px-6"
                style={{
                  background: "var(--surface-strong)",
                  borderColor: "var(--border)",
                  paddingBottom:
                    "max(1rem, env(safe-area-inset-bottom))",
                }}
              >
                <button
                  type="button"
                  onClick={closeOrder}
                  className="min-h-12 w-full whitespace-nowrap rounded-xl px-5 text-sm font-black"
                  style={{
                    background: "var(--accent)",
                    color: "var(--primary-text)",
                  }}
                >
                  Done
                </button>
              </footer>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
