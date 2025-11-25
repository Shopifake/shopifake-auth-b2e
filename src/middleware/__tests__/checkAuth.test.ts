// src/middleware/__tests__/checkAuth.test.ts

process.env.BETTER_AUTH_SECRET = 'test-secret';

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { checkAuth } from '../checkAuth'; 

const SECRET = process.env.BETTER_AUTH_SECRET || 'test-secret';

describe('checkAuth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('Valid Token', () => {
    it('should authenticate user with valid Bearer token', () => {
      const payload = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
      }));
    });

    it('should set req.user with all payload data', () => {
      const payload = {
        id: 'user-456',
        email: 'owner@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const token = jwt.sign(payload, SECRET);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toMatchObject({
        id: payload.id,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle token without optional fields', () => {
      const payload = {
        id: 'user-789',
      };
      const token = jwt.sign(payload, SECRET);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toMatchObject({
        id: 'user-789',
        email: '',
      });
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Missing Authorization Header', () => {
    it('should return 401 when Authorization header is missing', () => {
      mockRequest.headers = {};

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing or invalid Authorization header',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'InvalidToken abc123',
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing or invalid Authorization header',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token', () => {
    it('should return 401 for invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token verification failed',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', () => {
      const payload = {
        id: 'user-789',
        email: 'expired@test.com',
      };
      const expiredToken = jwt.sign(payload, SECRET, { expiresIn: '-1s' });

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token verification failed',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for token signed with wrong secret', () => {
      const payload = { id: 'user-999', email: 'wrong@test.com' };
      const wrongToken = jwt.sign(payload, 'wrong-secret');

      mockRequest.headers = {
        authorization: `Bearer ${wrongToken}`,
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with extra spaces', () => {
      const payload = { id: 'user-111', email: 'test@test.com' };
      const token = jwt.sign(payload, SECRET);

      mockRequest.headers = {
        authorization: `  Bearer   ${token}  `,
      };

      // This should fail because we trim and check strictly
      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle empty Bearer token', () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      checkAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});