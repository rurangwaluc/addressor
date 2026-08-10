import type { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { businessMenusService } from "./businessMenus.service.js";
import {
  BusinessMenuFileParamsSchema,
  BusinessMenuParamsSchema,
  BusinessMenuReorderSchema,
  BusinessMenuRevisionParamsSchema,
  BusinessMenuUploadSchema,
} from "./businessMenus.validators.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) throw new Error("Invalid token");
  return request.user;
}

function getR2(request: FastifyRequest) {
  return {
    accountId: request.server.env.R2_ACCOUNT_ID,
    accessKeyId: request.server.env.R2_ACCESS_KEY_ID,
    secretAccessKey: request.server.env.R2_SECRET_ACCESS_KEY,
    bucket: request.server.env.R2_BUCKET,
    publicUrl: request.server.env.R2_PUBLIC_URL,
  };
}

export async function getOwnerMenuHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessMenuParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessMenusService.getOwnerState(user.id, businessId)));
}

export async function getPublicMenuHandler(request: FastifyRequest, reply: FastifyReply) {
  const { businessId } = BusinessMenuParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessMenusService.getPublished(businessId)));
}

export async function createMenuDraftHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessMenuParamsSchema.parse(request.params);
  const result = await businessMenusService.createDraft(user.id, businessId);
  return reply.status(201).send(okResponse(result));
}

export async function requestMenuUploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, revisionId } = BusinessMenuRevisionParamsSchema.parse(request.params);
  const body = BusinessMenuUploadSchema.parse(request.body);
  const result = await businessMenusService.requestUpload(
    user.id,
    businessId,
    revisionId,
    body,
    getR2(request),
  );
  return reply.send(okResponse(result));
}

export async function confirmMenuUploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, revisionId, fileId } = BusinessMenuFileParamsSchema.parse(request.params);
  const result = await businessMenusService.confirmUpload(
    user.id,
    businessId,
    revisionId,
    fileId,
    getR2(request),
  );
  return reply.send(okResponse(result));
}

export async function removeMenuFileHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, revisionId, fileId } = BusinessMenuFileParamsSchema.parse(request.params);
  const result = await businessMenusService.removeDraftFile(
    user.id,
    businessId,
    revisionId,
    fileId,
    getR2(request),
  );
  return reply.send(okResponse(result));
}

export async function reorderMenuFilesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = requireUser(request);
  const { businessId, revisionId } = BusinessMenuRevisionParamsSchema.parse(
    request.params,
  );
  const body = BusinessMenuReorderSchema.parse(request.body);
  const result = await businessMenusService.reorderDraftFiles(
    user.id,
    businessId,
    revisionId,
    body,
  );

  return reply.send(okResponse(result));
}

export async function publishMenuHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, revisionId } = BusinessMenuRevisionParamsSchema.parse(request.params);
  return reply.send(
    okResponse(await businessMenusService.publish(user.id, businessId, revisionId)),
  );
}

export async function unpublishMenuHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessMenuParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessMenusService.unpublish(user.id, businessId)));
}
