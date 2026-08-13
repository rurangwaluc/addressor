export class BusinessServiceDomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "BusinessServiceDomainError";
  }
}

export class ServiceNotFoundError extends BusinessServiceDomainError {
  constructor() {
    super("Service not found.", "SERVICE_NOT_FOUND", 404);
    this.name = "ServiceNotFoundError";
  }
}

export class ServiceImageInvalidError extends BusinessServiceDomainError {
  constructor() {
    super("This service image upload is not valid.", "SERVICE_IMAGE_INVALID", 400);
    this.name = "ServiceImageInvalidError";
  }
}
