export type AccessContext = {
  roles?: Array<{
    key: string;
    scope?: "global" | "platform" | "business";
    source?: "virtual" | "global" | "platform" | "business";
    businessId?: string | null;
    branchId?: string | null;
  }>;
  platform: {
    hasAccess: boolean;
    role: "platform_owner" | "platform_admin" | "platform_support" | null;
    permissions?: string[];
  };
  businesses: Array<{
    businessId: string;
    businessName: string;
    businessSlug: string;
    branchId: string | null;
    role: "business_owner" | "business_manager" | "business_staff";
    status: string;
  }>;
  activeBusiness?: {
    businessId: string;
    businessName: string;
    businessSlug: string;
    branchId: string | null;
    role: "business_owner" | "business_manager" | "business_staff";
    status: string;
  } | null;
  permissions?: string[];
  flags: {
    isVerified?: boolean;
    isOnboardingCompleted?: boolean;
    isPlatformUser: boolean;
    isBusinessUser: boolean;
    isBusinessOwner: boolean;
  };
};

const SAFE_FALLBACK_PATH = "/welcome";
const PLATFORM_HOME_PATH = "/platform";
const BUSINESS_HOME_PATH = "/business-dashboard";

function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;

  return true;
}

export function getSafeRedirectPath(
  redirectTo: string | null | undefined,
  fallback: string = SAFE_FALLBACK_PATH,
): string {
  if (isSafeInternalPath(redirectTo)) {
    return redirectTo;
  }

  if (isSafeInternalPath(fallback)) {
    return fallback;
  }

  return SAFE_FALLBACK_PATH;
}

export function hasPlatformAccess(access: AccessContext) {
  return Boolean(access.platform?.hasAccess || access.flags?.isPlatformUser);
}

export function hasBusinessAccess(access: AccessContext) {
  return Boolean(
    access.flags?.isBusinessUser ||
      access.flags?.isBusinessOwner ||
      access.businesses?.length,
  );
}

export function getPostAuthRedirectPath(params: {
  access: AccessContext;
  redirectTo?: string | null;
  fallback?: string;
}): string {
  if (hasPlatformAccess(params.access)) {
    return PLATFORM_HOME_PATH;
  }

  if (hasBusinessAccess(params.access)) {
    return BUSINESS_HOME_PATH;
  }

  return getSafeRedirectPath(params.redirectTo, params.fallback ?? SAFE_FALLBACK_PATH);
}

export function buildLoginPath(currentPath: string): string {
  const safePath = getSafeRedirectPath(currentPath, SAFE_FALLBACK_PATH);

  return `/login?redirectTo=${encodeURIComponent(safePath)}`;
}