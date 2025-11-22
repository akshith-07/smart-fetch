import { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type CacheStrategy = 'memory' | 'localStorage' | 'indexedDB' | 'none';

export interface CacheConfig {
  strategy: CacheStrategy;
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  invalidateOn?: string[]; // Patterns to invalidate cache
}

export interface RetryConfig {
  maxRetries: number;
  delay: number; // Initial delay in ms
  maxDelay?: number; // Maximum delay in ms
  backoff?: number; // Backoff multiplier (default: 2)
  retryOn?: number[]; // HTTP status codes to retry on
  retryCondition?: (error: any) => boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  perMilliseconds: number;
  queueRequests?: boolean; // Queue requests instead of rejecting
}

export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: any) => any;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: SmartFetchResponse<T>) => SmartFetchResponse<T> | Promise<SmartFetchResponse<T>>;
  onResponseError?: (error: any) => any;
}

export interface Middleware {
  name: string;
  pre?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  post?: <T>(response: SmartFetchResponse<T>) => SmartFetchResponse<T> | Promise<SmartFetchResponse<T>>;
  error?: (error: any) => any;
}

export interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  cache?: CacheConfig | boolean;
  retry?: RetryConfig | boolean;
  rateLimit?: RateLimitConfig;
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
  validateResponse?: z.ZodSchema;
  signal?: AbortSignal;
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  priority?: RequestPriority;
  offlineQueueable?: boolean; // Whether to queue when offline
  deduplicate?: boolean; // Prevent duplicate simultaneous requests
  metadata?: Record<string, any>; // Custom metadata
}

export interface SmartFetchConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  cache?: CacheConfig | boolean;
  retry?: RetryConfig | boolean;
  rateLimit?: RateLimitConfig;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
  middleware?: Middleware[];
  debug?: boolean;
  mockMode?: boolean;
  mockResponses?: Map<string, any>;
  offlineQueueEnabled?: boolean;
  validateStatus?: (status: number) => boolean;
}

export interface SmartFetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
  cached?: boolean;
  retryCount?: number;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl?: number;
  key: string;
}

export interface OfflineQueueEntry {
  id: string;
  config: RequestConfig;
  timestamp: number;
  retryCount: number;
}

export interface MockConfig {
  url: string | RegExp;
  method?: HttpMethod;
  response: any;
  delay?: number;
  status?: number;
}
