# API Documentation

## Table of Contents

- [SmartFetch Class](#smartfetch-class)
- [Configuration](#configuration)
- [Request Methods](#request-methods)
- [Caching](#caching)
- [Error Handling](#error-handling)
- [React Hooks](#react-hooks)
- [Middleware](#middleware)
- [Types](#types)

## SmartFetch Class

The main class for creating API clients.

### Constructor

```typescript
new SmartFetch(config?: SmartFetchConfig)
```

**Parameters:**
- `config` (optional): Configuration object

**Example:**
```typescript
const client = new SmartFetch({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: { 'Authorization': 'Bearer token' }
});
```

## Configuration

### SmartFetchConfig

```typescript
interface SmartFetchConfig {
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
  offlineQueueEnabled?: boolean;
  validateStatus?: (status: number) => boolean;
}
```

### CacheConfig

```typescript
interface CacheConfig {
  strategy: 'memory' | 'localStorage' | 'indexedDB' | 'none';
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  invalidateOn?: string[]; // Patterns to invalidate cache
}
```

### RetryConfig

```typescript
interface RetryConfig {
  maxRetries: number;
  delay: number; // Initial delay in ms
  maxDelay?: number; // Maximum delay in ms
  backoff?: number; // Backoff multiplier (default: 2)
  retryOn?: number[]; // HTTP status codes to retry on
  retryCondition?: (error: any) => boolean;
}
```

### RateLimitConfig

```typescript
interface RateLimitConfig {
  maxRequests: number;
  perMilliseconds: number;
  queueRequests?: boolean; // Queue requests instead of rejecting
}
```

## Request Methods

### request()

Make a request with full configuration.

```typescript
request<T = any>(config: RequestConfig): Promise<SmartFetchResponse<T>>
```

**Example:**
```typescript
const response = await client.request({
  url: '/users',
  method: 'GET',
  cache: { strategy: 'memory', ttl: 60000 }
});
```

### get()

Make a GET request.

```typescript
get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>
```

**Example:**
```typescript
const response = await client.get('/users');
const users = response.data;
```

### post()

Make a POST request.

```typescript
post<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>
```

**Example:**
```typescript
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### put()

Make a PUT request.

```typescript
put<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>
```

### delete()

Make a DELETE request.

```typescript
delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>
```

### patch()

Make a PATCH request.

```typescript
patch<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>
```

### graphql()

Make a GraphQL request.

```typescript
graphql<T = any>(endpoint: string, request: GraphQLRequest, config?: Partial<RequestConfig>): Promise<T>
```

**Example:**
```typescript
const data = await client.graphql('/graphql', {
  query: 'query { users { id name } }',
  variables: {},
  operationName: 'GetUsers'
});
```

## Caching

### clearCache()

Clear cached data.

```typescript
clearCache(strategy?: 'memory' | 'localStorage' | 'indexedDB'): Promise<void>
```

**Examples:**
```typescript
// Clear specific cache
await client.clearCache('memory');

// Clear all caches
await client.clearCache();
```

### invalidateCache()

Invalidate cache by pattern.

```typescript
invalidateCache(pattern: string, strategy?: CacheStrategy): Promise<void>
```

## Mock Mode

### addMock()

Add a mock response for testing.

```typescript
addMock(mock: MockConfig): void
```

**Example:**
```typescript
client.addMock({
  url: '/api/users',
  method: 'GET',
  response: [{ id: 1, name: 'John' }],
  status: 200,
  delay: 100
});
```

### clearMocks()

Clear all mock responses.

```typescript
clearMocks(): void
```

## Error Handling

### Error Classes

Smart-fetch provides several custom error classes:

#### SmartFetchError

Base error class for all errors.

```typescript
class SmartFetchError extends Error {
  config: RequestConfig;
  code?: string;
  response?: SmartFetchResponse;
}
```

#### NetworkError

Thrown when a network error occurs.

```typescript
class NetworkError extends SmartFetchError {
  code: 'NETWORK_ERROR';
}
```

#### TimeoutError

Thrown when a request times out.

```typescript
class TimeoutError extends SmartFetchError {
  code: 'TIMEOUT_ERROR';
}
```

#### AbortError

Thrown when a request is aborted.

```typescript
class AbortError extends SmartFetchError {
  code: 'ABORT_ERROR';
}
```

#### ValidationError

Thrown when response validation fails.

```typescript
class ValidationError extends SmartFetchError {
  code: 'VALIDATION_ERROR';
  validationErrors: any;
}
```

#### RateLimitError

Thrown when rate limit is exceeded.

```typescript
class RateLimitError extends SmartFetchError {
  code: 'RATE_LIMIT_ERROR';
  retryAfter?: number;
}
```

#### GraphQLError

Thrown when GraphQL request returns errors.

```typescript
class GraphQLError extends SmartFetchError {
  code: 'GRAPHQL_ERROR';
  graphQLErrors: any[];
}
```

## React Hooks

### useFetch()

Fetch data with React hook.

```typescript
function useFetch<T = any>(
  url: string,
  options?: UseFetchOptions<T>
): UseFetchResult<T>
```

**Options:**
```typescript
interface UseFetchOptions<T> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  initialData?: T;
  // ... plus all RequestConfig options
}
```

**Returns:**
```typescript
interface UseFetchResult<T> {
  data: T | undefined;
  error: any;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}
```

### useMutation()

Perform mutations with React hook.

```typescript
function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<SmartFetchResponse<TData>>,
  options?: UseMutationOptions<TData, TVariables>
): UseMutationResult<TData, TVariables>
```

**Options:**
```typescript
interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: any, variables: TVariables) => void;
}
```

**Returns:**
```typescript
interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: any;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}
```

### useInfiniteQuery()

Fetch paginated data with React hook.

```typescript
function useInfiniteQuery<T = any>(
  url: string,
  options: UseInfiniteQueryOptions<T>
): UseInfiniteQueryResult<T>
```

**Options:**
```typescript
interface UseInfiniteQueryOptions<T> {
  enabled?: boolean;
  getNextPageParam: (lastPage: T, allPages: T[]) => any;
  getPreviousPageParam?: (firstPage: T, allPages: T[]) => any;
  onSuccess?: (data: T[]) => void;
  onError?: (error: any) => void;
  // ... plus all RequestConfig options
}
```

**Returns:**
```typescript
interface UseInfiniteQueryResult<T> {
  data: T[];
  error: any;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  refetch: () => Promise<void>;
}
```

## Middleware

### Middleware Interface

```typescript
interface Middleware {
  name: string;
  pre?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  post?: <T>(response: SmartFetchResponse<T>) => SmartFetchResponse<T> | Promise<SmartFetchResponse<T>>;
  error?: (error: any) => any;
}
```

### Built-in Middleware

#### loggerMiddleware

Logs requests and responses.

```typescript
import { loggerMiddleware } from 'smart-fetch';
```

#### timingMiddleware

Tracks request duration.

```typescript
import { timingMiddleware } from 'smart-fetch';
```

#### authMiddleware

Adds authentication to requests.

```typescript
import { authMiddleware } from 'smart-fetch';

const middleware = authMiddleware(() => localStorage.getItem('token'));
```

## Types

### RequestConfig

```typescript
interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
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
  offlineQueueable?: boolean;
  deduplicate?: boolean;
  metadata?: Record<string, any>;
}
```

### SmartFetchResponse

```typescript
interface SmartFetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
  cached?: boolean;
  retryCount?: number;
}
```

### GraphQLRequest

```typescript
interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}
```

### ProgressEvent

```typescript
interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}
```
