"use client";

import { CheckCircle2, LoaderCircle, Pencil, ShieldCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { RequestDetailSection } from "@/components/account/AccountRequestUI";

export type CustomerReview = {
  id: string;
  rating: number;
  body: string | null;
  status: string;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewEligibility = {
  canReview: boolean;
  reason: "eligible" | "not_completed" | "already_reviewed";
};

type ReviewResponse = {
  ok: true;
  data: {
    review: CustomerReview;
  };
};

type CustomerReviewSectionProps = {
  source: "order" | "booking";
  requestId: string;
  businessName: string;
  review: CustomerReview | null | undefined;
  eligibility: ReviewEligibility | undefined;
  onSaved: (review: CustomerReview) => void;
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

function RatingDisplay({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={17}
          aria-hidden="true"
          fill={value <= rating ? "currentColor" : "none"}
          style={{
            color:
              value <= rating
                ? "var(--accent)"
                : "color-mix(in srgb, var(--muted) 45%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

export default function CustomerReviewSection({
  source,
  requestId,
  businessName,
  review,
  eligibility,
  onSaved,
}: CustomerReviewSectionProps) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [body, setBody] = useState(review?.body ?? "");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setRating(review?.rating ?? 0);
    setBody(review?.body ?? "");
    setEditing(false);
    setError("");
    setFeedback("");
  }, [review?.id, review?.rating, review?.body]);

  if (!review && eligibility?.canReview !== true) {
    return null;
  }

  function beginEditing() {
    setRating(review?.rating ?? 0);
    setBody(review?.body ?? "");
    setError("");
    setFeedback("");
    setEditing(true);
  }

  function cancelEditing() {
    if (working) return;

    setRating(review?.rating ?? 0);
    setBody(review?.body ?? "");
    setError("");
    setEditing(false);
  }

  async function saveReview() {
    if (rating < 1 || rating > 5) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }

    setWorking(true);
    setError("");
    setFeedback("");

    try {
      const endpoint =
        source === "order"
          ? `/account/orders/${requestId}/review`
          : `/account/bookings/${requestId}/review`;

      const response = await apiRequest<ReviewResponse>(endpoint, {
        method: review ? "PATCH" : "POST",
        body: JSON.stringify({
          rating,
          body: body.trim() || null,
        }),
      });

      onSaved(response.data.review);
      setEditing(false);
      setFeedback(review ? "Review updated." : "Review published.");

      window.setTimeout(() => {
        setFeedback("");
      }, 2500);
    } catch (nextError) {
      setError(
        getErrorMessage(
          nextError,
          review
            ? "Your review could not be updated."
            : "Your review could not be published.",
        ),
      );
    } finally {
      setWorking(false);
    }
  }

  if (!review && !editing) {
    return (
      <RequestDetailSection label="Review">
        <div
          className="rounded-xl border p-4"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Star size={18} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="font-black">How was your experience?</p>
              <p
                className="mt-1 text-sm font-semibold leading-6"
                style={{ color: "var(--muted)" }}
              >
                Your review is linked to this completed {source}, so people know
                it comes from a real Addressor experience.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={beginEditing}
            className="mt-4 inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
          >
            Review this business
          </button>
        </div>
      </RequestDetailSection>
    );
  }

  if (editing) {
    return (
      <RequestDetailSection label={review ? "Edit your review" : "Your review"}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-black">
              Rate your experience with {businessName}
            </p>

            <div className="mt-3 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  disabled={working}
                  className="grid h-10 w-10 place-items-center rounded-lg transition hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  aria-pressed={rating === value}
                >
                  <Star
                    size={24}
                    aria-hidden="true"
                    fill={value <= rating ? "currentColor" : "none"}
                    style={{
                      color:
                        value <= rating
                          ? "var(--accent)"
                          : "color-mix(in srgb, var(--muted) 52%, transparent)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor={`${source}-${requestId}-review`}
              className="text-sm font-black"
            >
              Feedback <span style={{ color: "var(--muted)" }}>(optional)</span>
            </label>

            <textarea
              id={`${source}-${requestId}-review`}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={1000}
              rows={4}
              disabled={working}
              placeholder="What went well? What should other customers know?"
              className="mt-2 min-h-[7.25rem] w-full resize-none rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 outline-none transition focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-60 sm:min-h-[8rem]"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />

            <p
              className="mt-1.5 text-right text-xs font-bold"
              style={{ color: "var(--muted)" }}
            >
              {body.length}/1000
            </p>
          </div>

          {error ? (
            <p className="text-sm font-black" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveReview()}
              disabled={working || rating === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "var(--accent-contrast)",
              }}
            >
              {working ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : null}
              {review ? "Save changes" : "Publish review"}
            </button>

            {review ? (
              <button
                type="button"
                onClick={cancelEditing}
                disabled={working}
                className="min-h-11 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-black disabled:opacity-50"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </RequestDetailSection>
    );
  }

  return (
    <RequestDetailSection label="Your review">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RatingDisplay rating={review!.rating} />

          <span
            className="inline-flex items-center gap-1.5 text-xs font-black"
            style={{ color: "var(--success)" }}
          >
            <ShieldCheck size={14} aria-hidden="true" />
            Verified {source}
          </span>
        </div>

        {review!.body ? (
          <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6">
            {review!.body}
          </p>
        ) : (
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--muted)" }}
          >
            You left a {review!.rating}-star rating.
          </p>
        )}

        {review!.status === "hidden" ? (
          <p
            className="text-xs font-bold"
            style={{ color: "var(--muted)" }}
          >
            This review is not currently visible on the public business page.
          </p>
        ) : null}

        {review!.ownerReply ? (
          <div
            className="border-l-2 pl-4"
            style={{ borderColor: "var(--accent)" }}
          >
            <p
              className="text-xs font-black uppercase tracking-[0.1em]"
              style={{ color: "var(--muted)" }}
            >
              Response from {businessName}
            </p>

            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-6">
              {review!.ownerReply}
            </p>
          </div>
        ) : null}

        {feedback ? (
          <p
            className="flex items-center gap-1.5 text-sm font-black"
            style={{ color: "var(--success)" }}
          >
            <CheckCircle2 size={15} />
            {feedback}
          </p>
        ) : null}

        <button
          type="button"
          onClick={beginEditing}
          className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap text-sm font-black"
          style={{ color: "var(--accent)" }}
        >
          <Pencil size={15} />
          Edit review
        </button>
      </div>
    </RequestDetailSection>
  );
}
