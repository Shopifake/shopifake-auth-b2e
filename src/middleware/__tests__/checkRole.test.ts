// src/middleware/__tests__/checkRole.test.ts
import { Request, Response, NextFunction } from 'express';
import checkRole from '../checkRole';

describe('checkRole Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('User Not Authenticated', () => {
    it('should return 403 when req.user is undefined', () => {
      const middleware = checkRole('site-123', ['Owner']);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not authenticated',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when req.user is null', () => {
      mockRequest.user = null as any;
      const middleware = checkRole('site-456', ['CM']);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('User Has No Access to Site', () => {
    it('should return 403 when user has no roles array', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'test@example.com',
      };

      const middleware = checkRole('site-123', ['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied. You don\'t have access to this site.',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when user has roles but not for this site', () => {
      mockRequest.user = {
        id: 'user-2',
        email: 'test@example.com',
        roles: [
          { siteId: 'site-456', role: 'Owner' },
          { siteId: 'site-789', role: 'CM' },
        ],
      };

      const middleware = checkRole('site-123', ['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied. You don\'t have access to this site.',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Valid Roles for Site', () => {
    it('should allow Owner role when Owner is required', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'owner@test.com',
        roles: [
          { siteId: 'site-123', role: 'Owner' },
        ],
      };

      const middleware = checkRole('site-123', ['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow CM role when CM is required', () => {
      mockRequest.user = {
        id: 'user-2',
        email: 'cm@test.com',
        roles: [
          { siteId: 'site-123', role: 'CM' },
        ],
      };

      const middleware = checkRole('site-123', ['CM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow SM role when SM is required', () => {
      mockRequest.user = {
        id: 'user-3',
        email: 'sm@test.com',
        roles: [
          { siteId: 'site-123', role: 'SM' },
        ],
      };

      const middleware = checkRole('site-123', ['SM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow Owner when multiple roles are accepted', () => {
      mockRequest.user = {
        id: 'user-4',
        email: 'owner@test.com',
        roles: [
          { siteId: 'site-123', role: 'Owner' },
        ],
      };

      const middleware = checkRole('site-123', ['Owner', 'CM', 'SM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow CM when Owner or CM are accepted', () => {
      mockRequest.user = {
        id: 'user-5',
        email: 'cm@test.com',
        roles: [
          { siteId: 'site-123', role: 'CM' },
        ],
      };

      const middleware = checkRole('site-123', ['Owner', 'CM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should check correct site when user has multiple sites', () => {
      mockRequest.user = {
        id: 'user-6',
        email: 'multi@test.com',
        roles: [
          { siteId: 'site-123', role: 'Owner' },
          { siteId: 'site-456', role: 'SM' },
          { siteId: 'site-789', role: 'CM' },
        ],
      };

      const middleware = checkRole('site-456', ['SM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Invalid Roles for Site', () => {
    it('should reject CM when only Owner is allowed', () => {
      mockRequest.user = {
        id: 'user-6',
        email: 'cm@test.com',
        roles: [
          { siteId: 'site-123', role: 'CM' },
        ],
      };

      const middleware = checkRole('site-123', ['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied. Required role: Owner',
        userRole: 'CM',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject SM when only Owner or CM are allowed', () => {
      mockRequest.user = {
        id: 'user-7',
        email: 'sm@test.com',
        roles: [
          { siteId: 'site-123', role: 'SM' },
        ],
      };

      const middleware = checkRole('site-123', ['Owner', 'CM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied. Required role: Owner or CM',
        userRole: 'SM',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject Owner when only CM is allowed', () => {
      mockRequest.user = {
        id: 'user-8',
        email: 'owner@test.com',
        roles: [
          { siteId: 'site-123', role: 'Owner' },
        ],
      };

      const middleware = checkRole('site-123', ['CM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty allowedRoles array', () => {
      mockRequest.user = {
        id: 'user-9',
        email: 'test@test.com',
        roles: [
          { siteId: 'site-123', role: 'Owner' },
        ],
      };

      const middleware = checkRole('site-123', []);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for roles', () => {
      mockRequest.user = {
        id: 'user-11',
        email: 'owner@test.com',
        roles: [
          { siteId: 'site-123', role: 'owner' as any }, // lowercase
        ],
      };

      const middleware = checkRole('site-123', ['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});