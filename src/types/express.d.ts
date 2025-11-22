// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'Owner' | 'CM' | 'SM'; // Single role instead of array
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

export {};