"use client";

import {
  ChevronRight,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import BusinessPageFrame from "@/components/business/BusinessPageFrame";
import {
  RequestDrawerShell,
  RequestPagination,
} from "@/components/account/AccountRequestUI";
import { apiRequest } from "@/lib/api";
import type { AccessContext } from "@/lib/authRedirect";
import { getStoredAccessContext } from "@/lib/authSession";
import { chooseActiveBusiness, getBusinessId } from "@/lib/businessSession";

type ReviewInteraction = {
  type: "order" | "booking";
  id: string;
};

type BusinessReview = {
  id: string;
  customerName: string | null;
  rating: number;
  body: string | null;
  status: string;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  interaction: ReviewInteraction;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  reviewCount: number;
  averageRating: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type ListResponse = {
  ok: true;
  data: {
    reviews: BusinessReview[];
    summary: Summary;
    pagination: Pagination;
  };
};

type DetailResponse = {
  ok: true;
  data: {
    review: BusinessReview;
  };
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function interactionLabel(type: ReviewInteraction["type"]) {
  return type === "order" ? "Verified order" : "Verified booking";
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          fill={value <= rating ? "currentColor" : "none"}
          aria-hidden="true"
          style={{
            color:
              value <= rating
                ? "var(--accent)"
                : "color-mix(in srgb, var(--muted) 42%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

export default function BusinessReviewsPage() {
  const [access] = useState<AccessContext | null>(() => getStoredAccessContext());
  const business = chooseActiveBusiness(access?.businesses);
  const businessId = getBusinessId(business);

  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReview, setSelectedReview] = useState<BusinessReview | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [reply, setReply] = useState("");
  const [savedReply, setSavedReply] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replyFeedback, setReplyFeedback] = useState("");

  async function loadReviews(requestedPage = page) {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<ListResponse>(
        `/businesses/${businessId}/reviews?page=${requestedPage}&limit=10`,
      );

      setReviews(response.data.reviews);
      setSummary(response.data.summary);
      setPagination(response.data.pagination);

      const validPage = Math.max(1, response.data.pagination.totalPages);

      if (requestedPage > validPage) {
        setPage(validPage);
      }
    } catch (nextError) {
      setError(
        getErrorMessage(nextError, "We could not load customer reviews."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews(page);

    // Active business and page define this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, page]);

  useEffect(() => {
    if (!selectedReview) return;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !replySaving) {
        setSelectedReview(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedReview, replySaving]);

  async function openReview(review: BusinessReview) {
    if (!businessId) return;

    setSelectedReview(review);
    setReply(review.ownerReply ?? "");
    setSavedReply(review.ownerReply ?? "");
    setDetailLoading(true);
    setDetailError("");
    setReplyError("");
    setReplyFeedback("");

    try {
      const response = await apiRequest<DetailResponse>(
        `/businesses/${businessId}/reviews/${review.id}`,
      );

      const detail = response.data.review;

      setSelectedReview(detail);
      setReply(detail.ownerReply ?? "");
      setSavedReply(detail.ownerReply ?? "");
    } catch (nextError) {
      setDetailError(
        getErrorMessage(nextError, "We could not load this review."),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function saveReply(nextReply = reply) {
    if (!businessId || !selectedReview) return;

    setReplySaving(true);
    setReplyError("");
    setReplyFeedback("");

    try {
      const response = await apiRequest<DetailResponse>(
        `/businesses/${businessId}/reviews/${selectedReview.id}/reply`,
        {
          method: "PATCH",
          body: JSON.stringify({
            body: nextReply.trim() || null,
          }),
        },
      );

      const updated = response.data.review;

      setSelectedReview(updated);
      setReply(updated.ownerReply ?? "");
      setSavedReply(updated.ownerReply ?? "");
      setReviews((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setReplyFeedback(updated.ownerReply ? "Reply saved." : "Reply removed.");

      window.setTimeout(() => {
        setReplyFeedback("");
      }, 2500);
    } catch (nextError) {
      setReplyError(
        getErrorMessage(nextError, "Your reply could not be saved."),
      );
    } finally {
      setReplySaving(false);
    }
  }

  const average = summary?.averageRating ?? null;
  const reviewCount = summary?.reviewCount ?? 0;

  return (
    <BusinessPageFrame
      eyebrow="Reviews"
      title="Customer reviews"
      subtitle="Verified feedback from completed Addressor orders and bookings. Reply publicly from here."
      compact
    >
      <div className="space-y-5">
        <section
          className="overflow-hidden rounded-[1.2rem] border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="grid min-w-0 md:grid-cols-[14rem_minmax(0,1fr)]">
            <div
              className="border-b p-5 sm:p-6 md:border-b-0 md:border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="text-xs font-black uppercase tracking-[0.14em]"
                style={{ color: "var(--muted)" }}
              >
                Overall rating
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-black tracking-[-0.06em]">
                  {average === null ? "—" : average.toFixed(1)}
                </span>
                <span
                  className="pb-1 text-sm font-black"
                  style={{ color: "var(--muted)" }}
                >
                  / 5
                </span>
              </div>

              {average !== null ? (
                <div className="mt-3">
                  <Stars rating={Math.round(average)} size={18} />
                </div>
              ) : null}

              <p
                className="mt-3 text-sm font-bold"
                style={{ color: "var(--muted)" }}
              >
                {reviewCount} verified{" "}
                {reviewCount === 1 ? "experience" : "experiences"}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <p
                className="text-xs font-black uppercase tracking-[0.14em]"
                style={{ color: "var(--muted)" }}
              >
                Rating breakdown
              </p>

              <div className="mt-4 space-y-2.5">
                {([5, 4, 3, 2, 1] as const).map((rating) => {
                  const count = summary?.distribution[rating] ?? 0;
                  const percent =
                    reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;

                  return (
                    <div
                      key={rating}
                      className="grid grid-cols-[2.2rem_minmax(0,1fr)_2.2rem] items-center gap-3"
                    >
                      <span className="text-sm font-black">{rating} ★</span>

                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ background: "var(--surface-strong)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            background: "var(--accent)",
                          }}
                        />
                      </div>

                      <span
                        className="text-right text-xs font-black"
                        style={{ color: "var(--muted)" }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          className="overflow-hidden rounded-[1.2rem] border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="hidden grid-cols-[minmax(0,1.1fr)_minmax(8rem,0.65fr)_minmax(8rem,0.65fr)_minmax(8rem,0.65fr)_1.5rem] gap-4 border-b px-5 py-3 text-[0.66rem] font-black uppercase tracking-[0.12em] md:grid"
            style={{
              color: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            <span>Customer</span>
            <span>Experience</span>
            <span>Rating</span>
            <span>Reply</span>
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
          ) : error ? (
            <div className="p-6">
              <p className="font-black">{error}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-6 sm:p-8">
              <MessageSquareText size={23} style={{ color: "var(--muted)" }} />
              <h2 className="mt-4 text-lg font-black">
                No verified reviews yet
              </h2>
              <p
                className="mt-1 max-w-xl text-sm font-semibold leading-6"
                style={{ color: "var(--muted)" }}
              >
                Reviews will appear here after customers complete an Addressor
                order or booking and share their experience.
              </p>
            </div>
          ) : (
            <div>
              {reviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => void openReview(review)}
                  className="group grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-b px-4 py-3.5 text-left outline-none transition-colors last:border-b-0 hover:bg-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:px-5 md:grid-cols-[minmax(0,1.1fr)_minmax(8rem,0.65fr)_minmax(8rem,0.65fr)_minmax(8rem,0.65fr)_1.5rem] md:items-center md:gap-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {review.customerName || "Addressor customer"}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs font-semibold md:hidden"
                      style={{ color: "var(--muted)" }}
                    >
                      {interactionLabel(review.interaction.type)} /{" "}
                      {formatDate(review.createdAt)}
                    </p>
                  </div>

                  <div className="justify-self-end md:col-start-3 md:justify-self-start">
                    <Stars rating={review.rating} />
                  </div>

                  <span
                    className="col-span-2 inline-flex items-center gap-1.5 text-xs font-black md:col-span-1 md:col-start-2 md:row-start-1"
                    style={{ color: "var(--success)" }}
                  >
                    <ShieldCheck size={14} />
                    {review.interaction.type === "order" ? "Order" : "Booking"}
                  </span>

                  <span
                    className="hidden text-sm font-bold md:block"
                    style={{
                      color: review.ownerReply
                        ? "var(--success)"
                        : "var(--muted)",
                    }}
                  >
                    {review.ownerReply ? "Replied" : "Not replied"}
                  </span>

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

        {pagination ? (
          <RequestPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            hasPreviousPage={pagination.hasPreviousPage}
            hasNextPage={pagination.hasNextPage}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        ) : null}
      </div>

      {selectedReview ? (
        <RequestDrawerShell
          title={selectedReview.customerName || "Customer review"}
          subtitle="Verified review"
          onClose={() => {
            if (!replySaving) setSelectedReview(null);
          }}
          footer={
            <button
              type="button"
              onClick={() => setSelectedReview(null)}
              disabled={replySaving}
              className="min-h-12 w-full whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-black disabled:opacity-50"
              style={{
                background: "var(--surface-strong)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              Close
            </button>
          }
        >
          {detailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl"
                  style={{ background: "var(--surface)" }}
                />
              ))}
            </div>
          ) : detailError ? (
            <p className="text-sm font-black" style={{ color: "var(--danger)" }}>
              {detailError}
            </p>
          ) : (
            <div className="space-y-6">
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Stars rating={selectedReview.rating} size={20} />

                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-black"
                    style={{ color: "var(--success)" }}
                  >
                    <ShieldCheck size={14} />
                    {interactionLabel(selectedReview.interaction.type)}
                  </span>
                </div>

                <p
                  className="mt-2 text-xs font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  {formatDate(selectedReview.createdAt)}
                </p>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm font-semibold leading-7">
                  {selectedReview.body ||
                    `Customer left a ${selectedReview.rating}-star rating.`}
                </p>
              </section>

              <section
                className="border-t pt-5"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p
                      className="text-xs font-black uppercase tracking-[0.12em]"
                      style={{ color: "var(--muted)" }}
                    >
                      Your response
                    </p>
                    <p className="mt-1 text-sm font-black">
                      Reply publicly and professionally.
                    </p>
                  </div>

                  {savedReply ? (
                    <span
                      className="shrink-0 text-xs font-black"
                      style={{ color: "var(--success)" }}
                    >
                      Published
                    </span>
                  ) : null}
                </div>

                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  maxLength={1000}
                  rows={6}
                  disabled={replySaving}
                  placeholder="Write a short response to this customer..."
                  className="mt-4 w-full resize-none rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-60"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--muted)" }}
                  >
                    {reply.length}/1000
                  </span>

                  <div className="flex flex-wrap justify-end gap-2">
                    {savedReply ? (
                      <button
                        type="button"
                        onClick={() => void saveReply("")}
                        disabled={replySaving}
                        className="min-h-10 whitespace-nowrap px-2 text-sm font-black disabled:opacity-50"
                        style={{ color: "var(--danger)" }}
                      >
                        Remove reply
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void saveReply()}
                      disabled={replySaving || reply.trim() === savedReply.trim()}
                      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: "var(--accent)",
                        color: "var(--accent-contrast)",
                      }}
                    >
                      {replySaving ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : null}
                      {savedReply ? "Save reply" : "Publish reply"}
                    </button>
                  </div>
                </div>

                {replyError ? (
                  <p
                    className="mt-3 text-sm font-black"
                    style={{ color: "var(--danger)" }}
                  >
                    {replyError}
                  </p>
                ) : null}

                {replyFeedback ? (
                  <p
                    className="mt-3 text-sm font-black"
                    style={{ color: "var(--success)" }}
                  >
                    {replyFeedback}
                  </p>
                ) : null}
              </section>
            </div>
          )}
        </RequestDrawerShell>
      ) : null}
    </BusinessPageFrame>
  );
}
