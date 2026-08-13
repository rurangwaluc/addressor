import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const uploadExpiresInSeconds = 300;

const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ProfileImagePurpose = "cover" | "logo";
export type ProfileImageContentType = keyof typeof imageExtensions;

export type R2Config = {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  publicUrl?: string;
};

const menuExtensions = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type MenuContentType = keyof typeof menuExtensions;
export type ServiceImageContentType = ProfileImageContentType;

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

function createR2Client(config: ReturnType<typeof requireR2Config>) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function createProfileImageUpload(
  config: R2Config,
  input: CreateProfileImageUploadInput,
) {
  const configuredR2 = requireR2Config(config);
  const client = createR2Client(configuredR2);
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

export async function createMenuFileUpload(
  config: R2Config,
  input: {
    businessId: string;
    revisionId: string;
    contentType: MenuContentType;
    size: number;
  },
) {
  const configuredR2 = requireR2Config(config);
  const key = `businesses/${input.businessId}/menus/${input.revisionId}/${randomUUID()}.${menuExtensions[input.contentType]}`;
  const uploadUrl = await getSignedUrl(
    createR2Client(configuredR2),
    new PutObjectCommand({
      Bucket: configuredR2.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
    }),
    { expiresIn: uploadExpiresInSeconds },
  );

  return {
    uploadUrl,
    publicUrl: joinPublicUrl(configuredR2.publicUrl, key),
    key,
    expiresInSeconds: uploadExpiresInSeconds,
  };
}

export async function confirmMenuFileUpload(
  config: R2Config,
  input: { key: string; contentType: MenuContentType; size: number },
) {
  const configuredR2 = requireR2Config(config);
  const result = await createR2Client(configuredR2).send(
    new HeadObjectCommand({ Bucket: configuredR2.bucket, Key: input.key }),
  );

  if (result.ContentLength !== input.size || result.ContentType !== input.contentType) {
    throw new Error("Uploaded menu file does not match the requested file");
  }
}

export async function deleteMenuFile(config: R2Config, key: string) {
  return deleteR2Object(config, key);
}

export async function createServiceImageUpload(
  config: R2Config,
  input: {
    businessId: string;
    serviceId: string;
    contentType: ServiceImageContentType;
    size: number;
  },
) {
  const configuredR2 = requireR2Config(config);
  const key = `businesses/${input.businessId}/services/${input.serviceId}/${randomUUID()}.${imageExtensions[input.contentType]}`;
  const uploadUrl = await getSignedUrl(
    createR2Client(configuredR2),
    new PutObjectCommand({
      Bucket: configuredR2.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
    }),
    { expiresIn: uploadExpiresInSeconds },
  );

  return {
    uploadUrl,
    publicUrl: joinPublicUrl(configuredR2.publicUrl, key),
    key,
    expiresInSeconds: uploadExpiresInSeconds,
  };
}

export async function confirmServiceImageUpload(
  config: R2Config,
  input: {
    businessId: string;
    serviceId: string;
    key: string;
    contentType: ServiceImageContentType;
    size: number;
  },
) {
  const configuredR2 = requireR2Config(config);
  const prefix = `businesses/${input.businessId}/services/${input.serviceId}/`;
  const extension = imageExtensions[input.contentType];
  const fileName = input.key.slice(prefix.length);

  if (
    !input.key.startsWith(prefix) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(fileName) ||
    !fileName.endsWith(`.${extension}`)
  ) {
    return null;
  }

  const result = await createR2Client(configuredR2).send(
    new HeadObjectCommand({ Bucket: configuredR2.bucket, Key: input.key }),
  );

  if (result.ContentLength !== input.size || result.ContentType !== input.contentType) {
    return null;
  }

  return {
    key: input.key,
    publicUrl: joinPublicUrl(configuredR2.publicUrl, input.key),
  };
}

export async function deleteR2Object(config: R2Config, key: string) {
  const configuredR2 = requireR2Config(config);
  await createR2Client(configuredR2).send(
    new DeleteObjectCommand({ Bucket: configuredR2.bucket, Key: key }),
  );
}
