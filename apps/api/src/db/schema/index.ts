import { authVerificationOtps } from "./auth.schema.js";
import { users, userProfiles } from "./users.schema.js";
import { roles, userRoles } from "./roles.schema.js";
import { businesses, businessTeamMembers } from "./businesses.schema.js";
import { businessBranches } from "./branches.schema.js";
import { platformSettings } from "./platform.schema.js";
import { auditLogs } from "./audit.schema.js";

export {
  authVerificationOtps,
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