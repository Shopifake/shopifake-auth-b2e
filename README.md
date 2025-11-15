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
- **Webhooks:** The `/api/webhooks/sync` endpoint receives events from BetterAuth to create, update, or suspend users.
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

## Endpoints

- `GET /api/users/me` — Get current user's profile
- `PUT /api/users/me` — Update current user's profile

**Admin endpoints (require Admin role):**
- `GET /api/users` — List all users
- `POST /api/users` — Create a new user
- `GET /api/users/:id` — Get a user by ID
- `PUT /api/users/:id` — Update a user (role, status, profile)
- `DELETE /api/users/:id` — Suspend/deactivate a user

**Other:**
- `POST /api/webhooks/sync` — Webhook for BetterAuth user sync
- `GET /healthz` — Healthcheck for service and database