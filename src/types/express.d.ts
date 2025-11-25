declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles?: { siteId: string; role: 'Owner' | 'CM' | 'SM' }[];
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

export {};