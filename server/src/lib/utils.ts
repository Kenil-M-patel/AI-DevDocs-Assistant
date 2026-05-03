import logger from './logger';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const statusCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export type ErrorResponse = {
  status: string;
  message: string;
};

export function sendErrorResponse(data: { message: string }): ErrorResponse {
  return {
    status: 'error',
    ...data,
  };
}

function parseError(err: Error): string {
  logger.error(err.stack);
  return err.message;
}

export function getErrorMsg(err: unknown): { message: string } {
  if (typeof err === 'string') {
    logger.error(err);
    return { message: err };
  } else {
    return { message: parseError(err as Error) };
  }
}

export function getErrorStatusCode(err: unknown) {
  if (typeof err === 'string') {
    logger.error(err);
    return statusCode.BAD_REQUEST;
  } else {
    return statusCode.INTERNAL_SERVER_ERROR;
  }
}

export interface SuccessResponse {
  status: string;
  message?: string;
  data: unknown;
}

export function sendSuccessResponse({
  message,
  ...data
}: Record<string, unknown>): SuccessResponse {
  return {
    status: 'success',
    ...(message && { message: message as string }),
    data: data as Record<string, unknown>,
  };
}

export function sendSuccessRes<T>(payload: T, message?: string) {
  return {
    status: 'success',
    ...(message ? { message } : {}),
    data: payload,
  };
}

export function throwError(err: Error | string): void {
  if (typeof err === 'string') {
    throw new AppError(err, statusCode.BAD_REQUEST);
  }
  throw err;
}

export interface FilePathInfo {
  filepath: string;
  extension: string;
  name: string;
  filename: string;
}

export function extractFilePath(path: string): FilePathInfo {
  const url: string = path;
  const ind1: number = url.lastIndexOf('/');
  return {
    filepath: url.substring(0, ind1 + 1),
    extension: url.substring(url.lastIndexOf('.') + 1, url.length),
    name: url
      .substring(url.lastIndexOf('/') + 1, url.length)
      .split('.')
      .slice(0, -1)
      .join('.'),
    filename: url.substring(url.lastIndexOf('/') + 1, url.length),
  };
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateResetToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

type AsyncFunction = (req: any, res: Response, next: NextFunction) => Promise<any>;

export function asyncHandler(fn: AsyncFunction) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  
}

export function generateWebhookAuthKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generate4DigitOtp(): string {
  return crypto.randomInt(1000, 10000).toString();
}