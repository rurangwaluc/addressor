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
