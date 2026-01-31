# Clerk Setup (Next.js App Router)

This project uses Clerk with the App Router. Follow these steps to configure authentication locally.

## 1) Install Clerk

```bash
pnpm add @clerk/nextjs@latest
```

## 2) Add environment variables

Create a `.env.local` file (not committed) and set your keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Notes:
- Only store real keys in `.env.local`.
- `.env*` is already ignored by `.gitignore`.

## 3) Middleware proxy

A Clerk middleware proxy is defined in `src/proxy.ts` using `clerkMiddleware()` and the standard matcher config.

## 4) App layout

`src/app/layout.tsx` wraps the app in `<ClerkProvider>` and renders Clerk UI components for signed-in/signed-out states.

## 5) Auth routes

The app includes:
- `/sign-in` (`src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`)
- `/sign-up` (`src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`)

## 6) Run the app

```bash
pnpm dev
```

Open `http://localhost:3000` and sign in or sign up to confirm user creation.
