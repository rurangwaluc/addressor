import {
  authOauthAccounts,
  authPasswordResetTokens,
  authSessions,
  authVerificationOtps,
} from "./auth.schema.js";
import { users, userProfiles } from "./users.schema.js";
import { roles, userRoles } from "./roles.schema.js";
import { businesses, businessTeamMembers } from "./businesses.schema.js";
import { businessBranches } from "./branches.schema.js";
import {
  businessBookingRequests,
  businessMenuCategories,
  businessMenuItems,
  businessProfileViews,
  businessReviewComments,
  businessReviews,
  businessUpdateSubscribers,
} from "./business-account.schema.js";
import { platformSettings } from "./platform.schema.js";
import { auditLogs } from "./audit.schema.js";
import { businessMenuFiles, businessMenus } from "./uploaded-menu.schema.js";

export {
  authVerificationOtps,
  authSessions,
  authPasswordResetTokens,
  authOauthAccounts,
  users,
  userProfiles,
  roles,
  userRoles,
  businesses,
  businessTeamMembers,
  businessBranches,
  businessProfileViews,
  businessReviews,
  businessReviewComments,
  businessBookingRequests,
  businessMenuCategories,
  businessMenuItems,
  businessUpdateSubscribers,
  platformSettings,
  auditLogs,
  businessMenus,
  businessMenuFiles,
};

export type Schema = {
  authVerificationOtps: typeof authVerificationOtps;
  authSessions: typeof authSessions;
  authPasswordResetTokens: typeof authPasswordResetTokens;
  authOauthAccounts: typeof authOauthAccounts;
  users: typeof users;
  userProfiles: typeof userProfiles;
  roles: typeof roles;
  userRoles: typeof userRoles;
  businesses: typeof businesses;
  businessTeamMembers: typeof businessTeamMembers;
  businessBranches: typeof businessBranches;
  businessProfileViews: typeof businessProfileViews;
  businessReviews: typeof businessReviews;
  businessReviewComments: typeof businessReviewComments;
  businessBookingRequests: typeof businessBookingRequests;
  businessMenuCategories: typeof businessMenuCategories;
  businessMenuItems: typeof businessMenuItems;
  businessUpdateSubscribers: typeof businessUpdateSubscribers;
  platformSettings: typeof platformSettings;
  auditLogs: typeof auditLogs;
  businessMenus: typeof businessMenus;
  businessMenuFiles: typeof businessMenuFiles;
};
