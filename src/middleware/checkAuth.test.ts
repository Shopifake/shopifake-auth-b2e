process.env.BETTER_AUTH_ME_URL = 'http://fake-url/me';
import { checkAuth } from './checkAuth';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('checkAuth middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if no Authorization header', async () => {
    await checkAuth(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is missing', async () => {
    req.headers = { authorization: 'Bearer' };
    await checkAuth(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user and call next if token is valid', async () => {
    req.headers = { authorization: 'Bearer validtoken' };
    // Mock jwt.verify to return the expected payload
    const jwt = require('jsonwebtoken');
    jwt.verify = jest.fn().mockReturnValue({ id: '123', email: 'test@test.com', roles: ['Admin'] });
    checkAuth(req as Request, res as Response, next as NextFunction);
    expect(req.user).toEqual({ id: '123', email: 'test@test.com', roles: ['Admin'] });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.headers = { authorization: 'Bearer invalidtoken' };
    const jwt = require('jsonwebtoken');
    jwt.verify = jest.fn(() => { throw new Error('Invalid token'); });
    checkAuth(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token verification failed' });
    expect(next).not.toHaveBeenCalled();
  });
});