import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { customerAccountService } from "./customerAccount.service.js";
import {
  CustomerAccountListQuerySchema,
  CustomerBookingParamsSchema,
  CustomerOrderParamsSchema,
} from "./customerAccount.validators.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw new Error("Invalid token");
  }

  return request.user;
}

export async function listCustomerBookingsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const query = CustomerAccountListQuerySchema.parse(request.query);

  return reply.send(
    okResponse(
      await customerAccountService.listBookings(user.id, query),
    ),
  );
}

export async function getCustomerBookingHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { bookingId } = CustomerBookingParamsSchema.parse(
    request.params,
  );

  return reply.send(
    okResponse(
      await customerAccountService.getBooking(user.id, bookingId),
    ),
  );
}

export async function listCustomerOrdersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const query = CustomerAccountListQuerySchema.parse(request.query);

  return reply.send(
    okResponse(
      await customerAccountService.listOrders(user.id, query),
    ),
  );
}

export async function getCustomerOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { orderId } = CustomerOrderParamsSchema.parse(
    request.params,
  );

  return reply.send(
    okResponse(
      await customerAccountService.getOrder(user.id, orderId),
    ),
  );
}
