// Core
export { SmartFetch, smartFetch, get, post, put, del as delete, patch } from './core/SmartFetch';

// Types
export type {
  HttpMethod,
  CacheStrategy,
  CacheConfig,
  RetryConfig,
  RateLimitConfig,
  RequestInterceptor,
  ResponseInterceptor,
  Middleware,
  ProgressEvent,
  RequestConfig,
  SmartFetchConfig,
  SmartFetchResponse,
  GraphQLRequest,
  GraphQLResponse,
  CacheEntry,
  OfflineQueueEntry,
  MockConfig,
} from './types';

// Errors
export {
  SmartFetchError,
  NetworkError,
  TimeoutError,
  AbortError,
  ValidationError,
  RateLimitError,
  CacheError,
  GraphQLError,
} from './errors';

// Cache
export {
  CacheAdapter,
  MemoryCacheAdapter,
  LocalStorageCacheAdapter,
  IndexedDBCacheAdapter,
  CacheManager,
} from './cache';

// Offline
export { OfflineQueue } from './offline';

// Middleware
export {
  MiddlewareManager,
  loggerMiddleware,
  timingMiddleware,
  authMiddleware,
  retryMiddleware,
} from './middleware';

// GraphQL
export { GraphQLClient, isGraphQLRequest } from './graphql';

// Utils
export {
  buildURL,
  isAbsoluteURL,
  combineURLs,
  mergeConfig,
  isPlainObject,
  generateCacheKey,
  sleep,
  createAbortController,
  isOnline,
  debounce,
  throttle,
  Logger,
} from './utils';

// React hooks (only export if React is available)
export { useFetch, useMutation, useInfiniteQuery } from './react/hooks';
export type {
  UseFetchOptions,
  UseFetchResult,
  UseMutationOptions,
  UseMutationResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './react/hooks';
