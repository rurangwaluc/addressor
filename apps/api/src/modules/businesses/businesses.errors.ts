export class BusinessPublicDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "BusinessPublicDomainError";
  }
}

export class PublicBusinessNotFoundError extends BusinessPublicDomainError {
  constructor() {
    super("Business not found.", "BUSINESS_NOT_FOUND", 404);
    this.name = "PublicBusinessNotFoundError";
  }
}
