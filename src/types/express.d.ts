// src/types/express.d.ts

// 1. Define the structure of the user object returned by BetterAuth (the JWT payload)
export interface BetterAuthUser {
  id: string; // The BetterAuth User ID (sub claim)
  email: string;
  roles: string[]; // e.g., ['Owner', 'CM']
  // Add any other fields provided by the JWT payload
}

// 2. Extend Express Request to include our custom 'user' property
declare global {
  namespace Express {
    export interface Request {
      user?: BetterAuthUser;
    }
  }
}
