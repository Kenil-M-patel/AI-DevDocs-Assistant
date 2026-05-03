import request from 'supertest';
import { createServer } from '../../lib/server.utils';
import { Express } from 'express';
import { sequelize } from '../../connection/db.connection';
import redisHelper from '../../lib/redis.helper';

export interface TestResponse extends request.Response {
  data: any;
}

export interface TestContext {
  app: Express;
  request: any;
  userToken: string;
  teardown: () => Promise<void>;
}

/**
 * Standardizes response access by unwrapping nested data.
 * Handles both { data: { ... } } and { data: { data: [...] } } patterns.
 */
export const unwrap = (res: any) => {
  const body = res.body || res;

  if (body && body.data) {
    if (body.data.data !== undefined) return body.data.data;
    return body.data;
  }
  return body;
};

/**
 * Common success assertion that also returns unwrapped data for convenience.
 */
export const expectSuccess = (res: request.Response, statusCode = 200) => {
  expect(res.status).toBe(statusCode);
  expect(res.body.status).toBe('success');
  return unwrap(res);
};

/**
 * Common error assertion.
 */
export const expectError = (res: request.Response, statusCode: number) => {
  expect(res.status).toBe(statusCode);
  expect(res.body.status).toBe('error');
};

/**
 * Creates a pre-authenticated request wrapper.
 */
export const authRequest = (app: Express, token: string) => {
  const req = request(app);
  return {
    get: (url: string) => req.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => req.post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => req.patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => req.delete(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => req.put(url).set('Authorization', `Bearer ${token}`),
  };
};

/**
 * Highly optimized entry point for integration tests.
 * Initializes the server, seeds essential entities, and returns common tools.
 */
export const initIntegrationTest = async (): Promise<TestContext> => {
  const app = await createServer();
  
  // Generic token for testing
  const userToken = 'mock_jwt_token';

  return {
    app,
    request: request(app),
    userToken,
    teardown: async () => {
      await sequelize.close();
      if ((redisHelper as any).client?.status === 'ready') {
        await (redisHelper as any).client?.quit();
      }
    },
  };
};
