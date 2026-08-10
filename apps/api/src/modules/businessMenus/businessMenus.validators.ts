import { z } from "zod";

export const BusinessMenuParamsSchema = z.object({
  businessId: z.string().uuid(),
});

export const BusinessMenuRevisionParamsSchema = BusinessMenuParamsSchema.extend({
  revisionId: z.string().uuid(),
});

export const BusinessMenuFileParamsSchema = BusinessMenuRevisionParamsSchema.extend({
  fileId: z.string().uuid(),
});

const menuFileLimits = {
  "application/pdf": 20 * 1024 * 1024,
  "image/jpeg": 8 * 1024 * 1024,
  "image/png": 8 * 1024 * 1024,
  "image/webp": 8 * 1024 * 1024,
} as const;

export const BusinessMenuUploadSchema = z
  .object({
    contentType: z.enum([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]),
    size: z.number().int().positive(),
    sortOrder: z.number().int().min(0).max(99).optional(),
  })
  .superRefine((value, context) => {
    if (value.size > menuFileLimits[value.contentType]) {
      context.addIssue({
        code: "custom",
        path: ["size"],
        message:
          value.contentType === "application/pdf"
            ? "Menu PDF must be 20 MB or smaller"
            : "Menu image must be 8 MB or smaller",
      });
    }
  });

export const BusinessMenuReorderSchema = z
  .object({
    fileIds: z.array(z.string().uuid()).min(1).max(20),
  })
  .superRefine((value, context) => {
    if (new Set(value.fileIds).size !== value.fileIds.length) {
      context.addIssue({
        code: "custom",
        path: ["fileIds"],
        message: "Each menu file can appear only once",
      });
    }
  });

export type BusinessMenuUploadSchemaType = z.infer<
  typeof BusinessMenuUploadSchema
>;

export type BusinessMenuReorderSchemaType = z.infer<
  typeof BusinessMenuReorderSchema
>;
