export class BookingDomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "BookingDomainError";
  }
}

export class BookingStatusConflictError extends BookingDomainError {
  constructor(message: string) {
    super(message, "BOOKING_STATUS_CONFLICT", 409);
    this.name = "BookingStatusConflictError";
  }
}

export class BookingNotFoundError extends BookingDomainError {
  constructor() {
    super("Booking not found.", "BOOKING_NOT_FOUND", 404);
    this.name = "BookingNotFoundError";
  }
}

export class BookingRequestsDisabledError extends BookingDomainError {
  constructor() {
    super(
      "This business is not accepting booking requests.",
      "BOOKING_REQUESTS_DISABLED",
      409,
    );
    this.name = "BookingRequestsDisabledError";
  }
}

export class BookingDateOutsideRangeError extends BookingDomainError {
  constructor(message: string) {
    super(message, "BOOKING_DATE_OUTSIDE_RANGE", 400);
    this.name = "BookingDateOutsideRangeError";
  }
}

export class BookingServiceUnavailableError extends BookingDomainError {
  constructor() {
    super(
      "This service is not available for booking.",
      "BOOKING_SERVICE_UNAVAILABLE",
      400,
    );
    this.name = "BookingServiceUnavailableError";
  }
}

export class BookingDateRequiredError extends BookingDomainError {
  constructor() {
    super(
      "Choose a date and time before accepting this booking.",
      "BOOKING_DATE_REQUIRED",
      400,
    );
    this.name = "BookingDateRequiredError";
  }
}

export class BookingOwnBusinessRequestError extends BookingDomainError {
  constructor() {
    super(
      "You cannot send a booking request to your own business.",
      "BOOKING_OWN_BUSINESS_NOT_ALLOWED",
      403,
    );
    this.name = "BookingOwnBusinessRequestError";
  }
}
