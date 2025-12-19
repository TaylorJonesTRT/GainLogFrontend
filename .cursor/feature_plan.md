---
name: Password Reset Auth Routes
overview: Implement forgot password and password reset screens, and reorganize all auth routes under `/auth/` hierarchy. Move existing login and signup routes, create new forgot-password and password-reset routes, and update all internal references.
todos:
  - id: "1"
    content: Create /auth directory structure and move login route to /auth/login/+page.svelte
    status: pending
  - id: "2"
    content: Move signup route to /auth/signup/+page.svelte
    status: pending
  - id: "3"
    content: Create forgot-password route at /auth/forgot-password/+page.svelte with email form
    status: pending
  - id: "4"
    content: Create password-reset route at /auth/password-reset/+page.svelte with password form and token handling
    status: pending
  - id: "5"
    content: Update all route references in +layout.svelte, api.ts, and auth.ts
    status: pending
  - id: "6"
    content: Update internal links in moved auth pages to use new /auth/* paths
    status: pending
  - id: "7"
    content: Delete old /login and /signup route directories
    status: pending
---

# Password Reset Auth Routes Implementation Plan

## Overview

This plan implements forgot password and password reset functionality, and reorganizes all authentication routes under the `/auth/` directory structure to match the user's requirements.

## Current State

- Login route: `/login`
- Signup route: `/signup`
- Login page already has a link to `/forgot-password` (line 85) but the route doesn't exist
- API service uses `apiRequest` function from `src/lib/api.ts`
- Auth stores in `src/lib/stores/auth.ts` (token, user)
- All auth pages use `AuthLayout` component for consistent design

## Implementation Tasks

### 1. Create `/auth/` Directory Structure

- Create `/src/routes/auth/` directory
- This will contain: `login/`, `signup/`, `forgot-password/`, and `password-reset/` subdirectories

### 2. Move Existing Auth Routes

- Move `/src/routes/login/+page.svelte` → `/src/routes/auth/login/+page.svelte`
- Move `/src/routes/signup/+page.svelte` → `/src/routes/auth/signup/+page.svelte`
- Update internal links in these moved files:
  - Login page: Update signup link from `/signup` to `/auth/signup`
  - Login page: Update forgot password link from `/forgot-password` to `/auth/forgot-password`
  - Signup page: Update login link from `/login` to `/auth/login`

### 3. Create Forgot Password Route

- Create `/src/routes/auth/forgot-password/+page.svelte`
- Design pattern: Match existing login/signup page structure using `AuthLayout`
- Form fields:
  - Email input field
- API call: POST to `password` endpoint with body: `{ user: { email } }`
- Success state: Show confirmation message that email was sent (don't reveal if email exists)
- Error handling: Display error messages similar to login/signup pages
- Navigation: Link back to `/auth/login` in footer

### 4. Create Password Reset Route

- Create `/src/routes/auth/password-reset/+page.svelte`
- Design pattern: Match existing login/signup page structure using `AuthLayout`
- Extract `reset_password_token` from query params (Devise convention: `?reset_password_token=TOKEN`)
- Form fields:
  - Password input
  - Password confirmation input
- Validation: Check passwords match and meet minimum length (6 characters, matching signup validation)
- API call: PATCH to `password` endpoint with body:
  ```typescript
  {
    user: {
      password,
      password_confirmation,
      reset_password_token // from query params
    }
  }
  ```

- Success state: Redirect to `/auth/login` with success message or show success message
- Error handling: Display error messages (especially for invalid/expired tokens)
- Navigation: Link back to `/auth/login` in footer

### 5. Update Route References

Update all files that reference `/login` or `/signup`:

- **`src/routes/+layout.svelte`** (line 15):
  - Update `publicPaths` array: `['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/password-reset']`

- **`src/lib/api.ts`** (lines 46, 52):
  - Update `goto('/login?expired=true')` → `goto('/auth/login?expired=true')`
  - Update `goto('/login')` → `goto('/auth/login')`

- **`src/lib/auth.ts`** (line 24):
  - Update `goto('/login')` → `goto('/auth/login')`

### 6. Handle Password Reset Token

- In password-reset page, read token from `$page.url.searchParams.get('reset_password_token')`
- Validate token exists before showing form (or show appropriate error)
- Include token in API request body

## API Endpoint Conventions (Devise)

Based on Rails Devise conventions, the endpoints will be:

- **Forgot Password**: `POST /password` with `{ user: { email } }`
- **Password Reset**: `PATCH /password` with `{ user: { password, password_confirmation, reset_password_token } }`

## Files to Create/Modify

### New Files

- `src/routes/auth/login/+page.svelte` (moved from `src/routes/login/+page.svelte`)
- `src/routes/auth/signup/+page.svelte` (moved from `src/routes/signup/+page.svelte`)
- `src/routes/auth/forgot-password/+page.svelte` (new)
- `src/routes/auth/password-reset/+page.svelte` (new)

### Modified Files

- `src/routes/+layout.svelte` - Update publicPaths array
- `src/lib/api.ts` - Update redirect paths
- `src/lib/auth.ts` - Update redirect path

### Files to Delete

- `src/routes/login/+page.svelte` (after move)
- `src/routes/signup/+page.svelte` (after move)

## Design Consistency

All new pages will follow the same pattern as existing auth pages:

- Use `AuthLayout` component with appropriate title and description
- Use Field components from shadcn-svelte
- Use consistent error display (red background, rounded)
- Use consistent button styling and loading states
- Maintain responsive design with same container classes
- Include navigation links in FieldDescription footer