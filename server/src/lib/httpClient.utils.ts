import axios, { AxiosError } from 'axios';
import logger from './logger';

export const httpClient = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

class HttpError extends Error {
  status?: number;
  type?: string;
  details?: any;
  validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status?: number,
    type?: string,
    details?: any
  ) {
    super(message);
    this.status = status;
    this.type = type;
    this.details = details;

    // 👇 Extract partner validation errors if present
    this.validationErrors = details?.data?.errors || null;
  }
}



httpClient.interceptors.response.use(
  //Success response
  (response) => {
    return response.data;
  },

  // Error response
  (error: AxiosError) => {
    logger.error('httpClient error interceptor', { error, data: error.response?.data });
    if (error.response) {
      const { status, data } = error.response;
      // 422 – Validation error
        if (status === 422) {
        return Promise.reject(
            new HttpError(
            'Partner validation failed',
            422,
            'VALIDATION_ERROR',
            data
            )
        );
        }
      // Other HTTP errors
     return Promise.reject(
        new HttpError(
          'External API error',
          status,
          'HTTP_ERROR',
          data
        )
      );
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        success: false,
        type: 'TIMEOUT_ERROR',
        message: 'Request timed out',
      });
    }

    // Network / unknown error
    return Promise.reject({
      success: false,
      type: 'NETWORK_ERROR',
      message: error.message,
    });
  }
);
