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
import { platformSettings } from "./platform.schema.js";
import { auditLogs } from "./audit.schema.js";

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
  platformSettings,
  auditLogs,
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
  platformSettings: typeof platformSettings;
  auditLogs: typeof auditLogs;
};