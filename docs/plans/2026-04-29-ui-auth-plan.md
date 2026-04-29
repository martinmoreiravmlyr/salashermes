# Salas WPP UI + Auth.js plan

Goal: replace request-body user identity with session-backed Auth.js credentials login, and keep the booking UI usable for real create/cancel flows against Mongo.

Architecture:
- Add a Mongo-backed user repository using Mongoose.
- Use NextAuth credentials provider with JWT sessions so the app does not depend on Prisma for auth.
- Make server actions and API routes read identity from the session instead of trusting requester/actorEmail from forms.
- Keep the existing booking form and cancel button, but wire them to the authenticated user and expose sign in/sign up/sign out UI.

Tasks:
1. Inspect existing page and mutation boundaries.
2. Add failing tests for auth helpers and session-backed booking mutations.
3. Implement Mongo user repository and password hashing helpers.
4. Implement NextAuth config, route, and server auth helper.
5. Update server actions and API routes to require session identity.
6. Update page and client components for sign in/sign up/sign out + authenticated booking flows.
7. Run lint, tests, prisma validate, and build.
