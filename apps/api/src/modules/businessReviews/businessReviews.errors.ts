export class BusinessReviewDomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "BusinessReviewDomainError";
  }
}

export class ReviewNotFoundError extends BusinessReviewDomainError {
  constructor() {
    super("Review not found.", "REVIEW_NOT_FOUND", 404);
    this.name = "ReviewNotFoundError";
  }
}

export class ReviewSourceNotFoundError extends BusinessReviewDomainError {
  constructor(source: "order" | "booking") {
    super(
      `${source === "order" ? "Order" : "Booking"} not found.`,
      "REVIEW_SOURCE_NOT_FOUND",
      404,
    );
    this.name = "ReviewSourceNotFoundError";
  }
}

export class ReviewNotEligibleError extends BusinessReviewDomainError {
  constructor() {
    super(
      "You can review this business after this request is completed.",
      "REVIEW_NOT_ELIGIBLE",
      409,
    );
    this.name = "ReviewNotEligibleError";
  }
}

export class ReviewAlreadyExistsError extends BusinessReviewDomainError {
  constructor() {
    super(
      "You have already reviewed this completed request.",
      "REVIEW_ALREADY_EXISTS",
      409,
    );
    this.name = "ReviewAlreadyExistsError";
  }
}

export class PublicReviewsBusinessNotFoundError extends BusinessReviewDomainError {
  constructor() {
    super("Business not found.", "PUBLIC_BUSINESS_NOT_FOUND", 404);
    this.name = "PublicReviewsBusinessNotFoundError";
  }
}
