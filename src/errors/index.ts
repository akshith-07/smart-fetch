import { RequestConfig, SmartFetchResponse } from '../types';

export class SmartFetchError extends Error {
  public config: RequestConfig;
  public code?: string;
  public response?: SmartFetchResponse;

  constructor(message: string, config: RequestConfig, code?: string, response?: SmartFetchResponse) {
    super(message);
    this.name = 'SmartFetchError';
    this.config = config;
    this.code = code;
    this.response = response;
    Object.setPrototypeOf(this, SmartFetchError.prototype);
  }
}

export class NetworkError extends SmartFetchError {
  constructor(message: string, config: RequestConfig) {
    super(message, config, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends SmartFetchError {
  constructor(message: string, config: RequestConfig) {
    super(message, config, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class AbortError extends SmartFetchError {
  constructor(message: string, config: RequestConfig) {
    super(message, config, 'ABORT_ERROR');
    this.name = 'AbortError';
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}

export class ValidationError extends SmartFetchError {
  public validationErrors: any;

  constructor(message: string, config: RequestConfig, validationErrors?: any) {
    super(message, config, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RateLimitError extends SmartFetchError {
  public retryAfter?: number;

  constructor(message: string, config: RequestConfig, retryAfter?: number) {
    super(message, config, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class CacheError extends SmartFetchError {
  constructor(message: string, config: RequestConfig) {
    super(message, config, 'CACHE_ERROR');
    this.name = 'CacheError';
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

export class GraphQLError extends SmartFetchError {
  public graphQLErrors: any[];

  constructor(message: string, config: RequestConfig, errors: any[]) {
    super(message, config, 'GRAPHQL_ERROR');
    this.name = 'GraphQLError';
    this.graphQLErrors = errors;
    Object.setPrototypeOf(this, GraphQLError.prototype);
  }
}
