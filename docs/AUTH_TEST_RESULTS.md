# Addressor Auth Test Results

Date: 2026-07-01

## Manual browser tests

- [ ] Customer login redirects to `/welcome`
- [ ] Customer logout clears session and returns to `/login`
- [ ] Business login redirects to `/business-dashboard`
- [ ] Business logout clears session and returns to `/login`
- [ ] Platform login redirects to `/platform`
- [ ] Platform logout clears session and returns to `/login`
- [ ] Customer blocked from `/business-dashboard`
- [ ] Customer blocked from `/platform`

## Refresh token tests

- [ ] Expired access token refreshes automatically
- [ ] User stays logged in after refresh
- [ ] New access token replaces old token
- [ ] Refresh token remains available
- [ ] Cached access context remains valid

## Rate-limit tests

- [ ] Login endpoint returns `RATE_LIMITED` after too many attempts

## Password reset tests

- [ ] Forgot password page requests reset
- [ ] Development reset link appears locally
- [ ] Reset password page changes password
- [ ] New password logs in successfully
- [ ] Old password no longer works

## Verification tests

- [ ] Signup redirects to `/verify`
- [ ] Email OTP verification works
- [ ] Phone OTP verification works
- [ ] Resend email OTP works
- [ ] Resend phone OTP works
- [ ] Verified user can login

## Notes

Write any issue found here before continuing auth work.
