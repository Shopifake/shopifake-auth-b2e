import checkRole from './checkRole';
import { Request, Response, NextFunction } from 'express';

describe('checkRole middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { user: { id: '1', email: 'test@test.com', roles: ['Admin', 'User'] } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next if user has allowed role', () => {
    const middleware = checkRole(['Admin']);
    middleware(req as Request, res as Response, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 if user does not have allowed role', () => {
    req.user = { id: '1', email: 'test@test.com', roles: ['User'] };
    const middleware = checkRole(['Admin']);
    middleware(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Required role: Admin' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not authenticated', () => {
    req.user = undefined;
    const middleware = checkRole(['Admin']);
    middleware(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });
});
