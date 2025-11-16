import request from 'supertest';
import express from 'express';
import usersRouter from './users';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roles: ['Admin'] }),
        findMany: jest.fn().mockResolvedValue([{ id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', roles: ['Admin'] }]),
        update: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com', firstName: 'Updated', lastName: 'User', roles: ['Admin'] })
      }
    }))
  };
});

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: '1', email: 'test@test.com', roles: ['Admin'] };
  next();
});
app.use('/api/users', usersRouter);

describe('users routes', () => {
  it('GET /api/users/me should return user profile', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', '1');
    expect(res.body).toHaveProperty('email', 'test@test.com');
  });

  it('PUT /api/users/me should update user profile', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({ firstName: 'Updated', lastName: 'User' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('firstName', 'Updated');
  });

  it('GET /api/users should return all users (Admin)', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id', '1');
  });

  it('PUT /api/users/:id should update another user (Admin)', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .send({ firstName: 'Updated', lastName: 'User', role: 'Admin', accountStatus: 'active' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('firstName', 'Updated');
  });

  it('DELETE /api/users/:id should suspend a user (Admin)', async () => {
    const res = await request(app).delete('/api/users/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User successfully suspended');
  });
});
