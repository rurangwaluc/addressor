export class BusinessOrderDomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "BusinessOrderDomainError";
  }
}

export class OrderNotFoundError extends BusinessOrderDomainError {
  constructor() {
    super("Order not found.", "ORDER_NOT_FOUND", 404);
    this.name = "OrderNotFoundError";
  }
}

export class OrderStatusConflictError extends BusinessOrderDomainError {
  constructor(message: string) {
    super(message, "ORDER_STATUS_CONFLICT", 409);
    this.name = "OrderStatusConflictError";
  }
}

export class OrderRequestsDisabledError extends BusinessOrderDomainError {
  constructor() {
    super("This business is not accepting order requests.", "ORDER_REQUESTS_DISABLED", 409);
    this.name = "OrderRequestsDisabledError";
  }
}
