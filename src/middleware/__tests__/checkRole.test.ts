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
      const middleware = checkRole(['Owner']);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not authenticated',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when req.user is null', () => {
      mockRequest.user = null as any;
      const middleware = checkRole(['CM']);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Valid Roles', () => {
    it('should allow Owner role when Owner is required', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'owner@test.com',
        role: 'Owner',
      };

      const middleware = checkRole(['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow CM role when CM is required', () => {
      mockRequest.user = {
        id: 'user-2',
        email: 'cm@test.com',
        role: 'CM',
      };

      const middleware = checkRole(['CM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow SM role when SM is required', () => {
      mockRequest.user = {
        id: 'user-3',
        email: 'sm@test.com',
        role: 'SM',
      };

      const middleware = checkRole(['SM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow Owner when multiple roles are accepted', () => {
      mockRequest.user = {
        id: 'user-4',
        email: 'owner@test.com',
        role: 'Owner',
      };

      const middleware = checkRole(['Owner', 'CM', 'SM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow CM when Owner or CM are accepted', () => {
      mockRequest.user = {
        id: 'user-5',
        email: 'cm@test.com',
        role: 'CM',
      };

      const middleware = checkRole(['Owner', 'CM']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Invalid Roles', () => {
    it('should reject CM when only Owner is allowed', () => {
      mockRequest.user = {
        id: 'user-6',
        email: 'cm@test.com',
        role: 'CM',
      };

      const middleware = checkRole(['Owner']);
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
        role: 'SM',
      };

      const middleware = checkRole(['Owner', 'CM']);
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
        role: 'Owner',
      };

      const middleware = checkRole(['CM']);
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
        role: 'Owner',
      };

      const middleware = checkRole([]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle invalid role value', () => {
      mockRequest.user = {
        id: 'user-10',
        email: 'invalid@test.com',
        role: 'InvalidRole' as any,
      };

      const middleware = checkRole(['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for roles', () => {
      mockRequest.user = {
        id: 'user-11',
        email: 'owner@test.com',
        role: 'owner' as any, // lowercase
      };

      const middleware = checkRole(['Owner']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});