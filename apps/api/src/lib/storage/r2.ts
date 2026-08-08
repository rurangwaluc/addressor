import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const uploadExpiresInSeconds = 300;

const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ProfileImagePurpose = "cover" | "logo";
export type ProfileImageContentType = keyof typeof imageExtensions;

type R2Config = {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  publicUrl?: string;
};

type CreateProfileImageUploadInput = {
  businessId: string;
  purpose: ProfileImagePurpose;
  contentType: ProfileImageContentType;
  size: number;
};

function joinPublicUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${key}`;
}

export class R2StorageNotConfiguredError extends Error {
  constructor() {
    super("Image uploads are not configured");
    this.name = "R2StorageNotConfiguredError";
  }
}

function requireR2Config(config: R2Config) {
  if (
    !config.accountId ||
    !config.accessKeyId ||
    !config.secretAccessKey ||
    !config.bucket ||
    !config.publicUrl
  ) {
    throw new R2StorageNotConfiguredError();
  }

  return {
    accountId: config.accountId,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    publicUrl: config.publicUrl,
  };
}

export async function createProfileImageUpload(
  config: R2Config,
  input: CreateProfileImageUploadInput,
) {
  const configuredR2 = requireR2Config(config);
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${configuredR2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: configuredR2.accessKeyId,
      secretAccessKey: configuredR2.secretAccessKey,
    },
  });
  const extension = imageExtensions[input.contentType];
  const key = `businesses/${input.businessId}/profile/${input.purpose}/${randomUUID()}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: configuredR2.bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: uploadExpiresInSeconds,
  });

  return {
    uploadUrl,
    publicUrl: joinPublicUrl(configuredR2.publicUrl, key),
    key,
    expiresInSeconds: uploadExpiresInSeconds,
  };
}
