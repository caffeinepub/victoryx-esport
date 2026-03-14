# VictoryX Esport

## Current State
Admin panel is accessible via `/admin` route and conditionally shown via a gold button on the Profile page when `isAdmin` is true. However, `isAdmin` check fails intermittently, making the button invisible.

## Requested Changes (Diff)

### Add
- New secret admin login page at `/vx-secure-admin`
- Login form with Username + Password fields
- Hardcoded credentials: Username `VictoryX`, Password `VictoryX@Admin2024`
- On successful login: redirect to `/admin`
- On failed login: show error message
- Page is not linked from anywhere in the app — only accessible via direct URL

### Modify
- ProfilePage: remove the `isAdmin` conditional Admin Panel button entirely

### Remove
- Nothing else removed

## Implementation Plan
1. Add `/vx-secure-admin` route in the router
2. Create `AdminLoginPage.tsx` with username/password form, validation, and redirect to `/admin` on success
3. Remove Admin Panel button from `ProfilePage.tsx`
