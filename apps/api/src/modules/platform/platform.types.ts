export type PlatformRole =
  | "platform_owner"
  | "platform_admin"
  | "platform_support";

export type PlatformAccessResult = {
  hasAccess: boolean;
  role: PlatformRole | null;
};

export type PlatformMeResponse = {
  userId: string;
  role: PlatformRole;
  permissions: string[];
};