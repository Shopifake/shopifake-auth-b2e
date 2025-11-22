# Shopifake BetterAuth Microservice

This microservice manages user profiles for B2E (Back-Office to Employee) applications, with centralized authentication via BetterAuth.

- User profile management (view, edit)
- User administration (CRUD, roles)
- Automatic synchronization with BetterAuth via webhooks
- Service and database status check via `/healthz` (for Kubernetes)

Developed with Node.js, TypeScript, Express, and Prisma (PostgreSQL).

## Features

- **User Profile Management:** Users can view and update their own profile information.
- **Role-Based Access:** Admin users can view, update, and manage all user profiles.
- **BetterAuth Integration:** Authentication and user synchronization are handled via BetterAuth webhooks and token validation.
- **Webhooks:** Automatically sync user data from BetterAuth events.
- **Healthcheck Endpoint:** `/healthz` route for Kubernetes and monitoring, reporting service and database status.

## How It Works

- **Authentication:** Protected routes require a valid BetterAuth JWT token.
- **Database:** Uses Prisma ORM to interact with a PostgreSQL database.
- **Healthcheck:** The `/healthz` endpoint checks if the service and database are running.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.template` to `.env` and fill in your database and BetterAuth credentials.

3. **Run database migrations:**
   ```bash
   npm run db:push
   ```

4. **Start the service (development):**
   ```bash
   npm run dev
   ```

5. **Build and run (production):**
   ```bash
   npm run build
   npm start
   ```

## Test Strategy

This project uses **Jest** for unit and integration testing. The test strategy covers:

- **Middlewares:**
   - `checkAuth`: Ensures authentication logic is correct (valid/invalid tokens, missing headers, user payload).
   - `checkRole`: Verifies role-based access control (allowed/denied roles, unauthenticated users).

- **Routes:**
   - `users`: Tests user profile endpoints and admin actions (get, update, suspend users) with mocked database and authentication.

**Mocking:**
- External dependencies (Prisma, Axios, Express) are mocked to isolate business logic and avoid side effects.
- Environment variables are set in tests to simulate real configuration.

**How to run tests:**
```bash
npm run test
```

All critical logic is covered by tests to ensure reliability and prevent regressions.

## Endpoints

- `GET /api/auth/*` — Authentication endpoints (login, token validation, etc.)
- `GET /api/users/me` — Get current user's profile
- `PUT /api/users/me` — Update current user's profile
- `DELETE /api/users/me` — Delete current user's profile

**Other:**
- `GET /healthz` — Healthcheck for service and database
- `GET /` — Service info and available endpoints