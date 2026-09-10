import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { businessReviewsService } from "./businessReviews.service.js";
import {
  BusinessReviewBusinessParamsSchema,
  BusinessReviewItemParamsSchema,
  BusinessReviewListQuerySchema,
  BusinessReviewReplySchema,
  CustomerBookingReviewParamsSchema,
  CustomerOrderReviewParamsSchema,
  CustomerReviewSchema,
  PublicBusinessReviewsParamsSchema,
} from "./businessReviews.validators.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw new Error("Invalid token");
  }

  return request.user;
}

export async function createOrderReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { orderId } = CustomerOrderReviewParamsSchema.parse(
    request.params,
  );
  const body = CustomerReviewSchema.parse(request.body);

  const result = await businessReviewsService.createForOrder(
    user.id,
    orderId,
    body,
  );

  return reply.status(201).send(okResponse(result));
}

export async function updateOrderReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { orderId } = CustomerOrderReviewParamsSchema.parse(
    request.params,
  );
  const body = CustomerReviewSchema.parse(request.body);

  return reply.send(
    okResponse(
      await businessReviewsService.updateForOrder(
        user.id,
        orderId,
        body,
      ),
    ),
  );
}

export async function createBookingReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { bookingId } = CustomerBookingReviewParamsSchema.parse(
    request.params,
  );
  const body = CustomerReviewSchema.parse(request.body);

  const result = await businessReviewsService.createForBooking(
    user.id,
    bookingId,
    body,
  );

  return reply.status(201).send(okResponse(result));
}

export async function updateBookingReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { bookingId } = CustomerBookingReviewParamsSchema.parse(
    request.params,
  );
  const body = CustomerReviewSchema.parse(request.body);

  return reply.send(
    okResponse(
      await businessReviewsService.updateForBooking(
        user.id,
        bookingId,
        body,
      ),
    ),
  );
}

export async function listBusinessReviewsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { businessId } = BusinessReviewBusinessParamsSchema.parse(
    request.params,
  );
  const query = BusinessReviewListQuerySchema.parse(request.query);

  return reply.send(
    okResponse(
      await businessReviewsService.listForBusiness(
        user.id,
        businessId,
        query,
      ),
    ),
  );
}

export async function getBusinessReviewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { businessId, reviewId } =
    BusinessReviewItemParamsSchema.parse(request.params);

  return reply.send(
    okResponse(
      await businessReviewsService.getForBusiness(
        user.id,
        businessId,
        reviewId,
      ),
    ),
  );
}

export async function updateBusinessReviewReplyHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { businessId, reviewId } =
    BusinessReviewItemParamsSchema.parse(request.params);
  const body = BusinessReviewReplySchema.parse(request.body);

  return reply.send(
    okResponse(
      await businessReviewsService.updateReply(
        user.id,
        businessId,
        reviewId,
        body,
      ),
    ),
  );
}

export async function listPublicBusinessReviewsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { slug } = PublicBusinessReviewsParamsSchema.parse(
    request.params,
  );
  const query = BusinessReviewListQuerySchema.parse(request.query);

  return reply.send(
    okResponse(
      await businessReviewsService.listPublic(slug, query),
    ),
  );
}
