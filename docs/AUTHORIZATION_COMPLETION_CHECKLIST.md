# Addressor Authentication & Authorization Completion Checklist

Addressor must complete authentication and authorization before moving deeply into business onboarding and dashboard features.

## Current completed foundation

- [x] One shared login form at `/login`
- [x] Business login intent through `/login?intent=business`
- [x] Platform login intent through `/login?intent=platform`
- [x] Legacy `/business-login` redirects to business login intent
- [x] Legacy `/platform-login` redirects to platform login intent
- [x] Legacy `/owner` redirects to `/platform`
- [x] Customer redirects to `/welcome`
- [x] Business owner/team redirects to `/business-dashboard`
- [x] Platform owner/admin/support redirects to `/platform`
- [x] Business dashboard protected by business/platform access
- [x] Platform dashboard protected by platform access
- [x] Logout clears access token, refresh token, and cached access context
- [x] Access context cached for faster protected page transitions
- [x] Local seed users working for customer, business owner, and platform owner

## Must finish before moving to business onboarding

### 1. Auth helper cleanup

- [x] All current protected pages use shared auth helpers instead of direct `localStorage` auth checks
- [x] `/welcome` uses `RequireAccess mode="auth"`
- [x] No current page manually removes only `addressorAuthToken`
- [ ] No generic global loading screen should appear

### 2. Refresh token flow

- [x] API exposes refresh session endpoint
- [x] Frontend calls refresh endpoint when access token expires
- [x] Expired refresh token clears auth state cleanly
- [x] Cached access context is cleared when refresh fails

### 3. Password reset

- [x] API request password reset endpoint
- [x] API reset password endpoint
- [x] Web forgot password page
- [x] Web reset password page
- [x] Password reset token expiry handling through backend reset token validation
- [x] User-friendly success/error states

### 4. Verification flow polish

- [ ] Email verification status should be clearly represented in `/auth/me`
- [ ] Phone verification status should be clearly represented in `/auth/me`
- [x] Verification page handles expired/invalid OTPs
- [x] Resend OTP flow is available
- [ ] Auth redirects should respect required verification where needed

### 5. Rate limiting and brute-force protection

- [x] Login endpoint rate limited
- [x] Signup endpoint rate limited
- [x] OTP request endpoint rate limited
- [x] Password reset request endpoint rate limited
- [ ] Clear error messages without leaking account existence

### 6. Audit logs

- [ ] Login success logged
- [ ] Login failure logged
- [ ] Logout logged where possible
- [ ] Password reset requested logged
- [ ] Password reset completed logged
- [ ] Business/platform access denial logged

### 7. Session management

- [ ] API lists active sessions for current user
- [ ] User can revoke other sessions
- [ ] Logout current session clears current session server-side if supported
- [ ] Session expiry UI is clean and not generic

### 8. Authorization rules

- [ ] Customer-only routes defined
- [ ] Business-only routes defined
- [ ] Platform-only routes defined
- [ ] Business permissions mapped to actual future dashboard features
- [ ] Platform permissions mapped to actual future platform features
- [ ] Wrong-role access produces clear premium blocked state

### 9. Production security plan

- [ ] Decide whether to keep bearer tokens or migrate to HTTP-only cookies
- [ ] Document token expiry values
- [ ] Document refresh token expiry values
- [ ] Document CORS rules
- [ ] Document secure cookie settings for production
- [ ] Document local/dev behavior separately from production behavior

### 10. Final auth tests

- [ ] Customer login test
- [ ] Business owner login test
- [ ] Platform owner login test
- [ ] Wrong account to business dashboard test
- [ ] Wrong account to platform dashboard test
- [ ] Logout clears all local auth state
- [ ] Expired token behavior test
- [ ] Refresh token behavior test
- [ ] Password reset test
- [ ] Verification test
- [ ] `pnpm check` passes
