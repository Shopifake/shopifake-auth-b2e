import request from 'supertest';
import express, { Express } from 'express';
import userRoutes from '../users';
import { prisma } from '../../lib/prisma.config';
import jwt from 'jsonwebtoken';

jest.mock('../../lib/prisma.config');

describe('User Routes', () => {
  let app: Express;
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };
  const ACCESS_SECRET = 'test-secret';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const cookieParser = require('cookie-parser');
    app.use(cookieParser());
    process.env.BETTER_AUTH_SECRET = ACCESS_SECRET;
    app.use('/api/users', userRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function getAuthCookie(user = testUser) {
    const token = jwt.sign(user, ACCESS_SECRET);
    return `accessToken=${token}`;
  }

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/me')
        .set('Cookie', getAuthCookie());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: expect.any(Object),
      });
    });

    it('should return 404 when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/me')
        .set('Cookie', getAuthCookie());

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Profile not found. Contact an administrator.',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/users/me')
        .set('Cookie', getAuthCookie());

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+9876543210',
        address: '456 Oak Ave',
      };

      const mockUpdatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/me')
        .set('Cookie', getAuthCookie())
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('Jane');
      expect(response.body.lastName).toBe('Smith');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+9876543210',
        }),
      });
    });

    it('should handle partial updates', async () => {
      const updateData = {
        firstName: 'UpdatedName',
      };

      const mockUpdatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'UpdatedName',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/me')
        .set('Cookie', getAuthCookie())
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('UpdatedName');
    });

    it('should return 500 on update failure', async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      const response = await request(app)
        .put('/api/users/me')
        .set('Cookie', getAuthCookie())
        .send({ firstName: 'Test' });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/users/me', () => {
    it('should delete user account (RGPD)', async () => {
      const mockAnonymizedUser = {
        id: 'test-user-id',
        email: 'deleted_test-user-id@anonymized.com',
        firstName: 'Deleted',
        lastName: 'User',
        deletedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockAnonymizedUser);

      const response = await request(app)
        .delete('/api/users/me')
        .set('Cookie', getAuthCookie())
        .send({ reason: 'No longer need account' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Account successfully deleted',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          email: 'deleted_test-user-id@anonymized.com',
          firstName: 'Deleted',
          lastName: 'User',
          deletionReason: 'No longer need account',
        }),
      });
    });

    it('should handle deletion without reason', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/users/me')
        .set('Cookie', getAuthCookie());

      expect(response.status).toBe(200);
    });
  });
});