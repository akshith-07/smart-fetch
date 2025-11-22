# smart-fetch

> Enterprise-grade universal API client with intelligent caching, retry logic, and offline support

[![npm version](https://badge.fury.io/js/smart-fetch.svg)](https://badge.fury.io/js/smart-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✨ **Promise-based API** - Similar to Axios, easy to use
🎯 **TypeScript** - Full type safety with generics
💾 **Smart Caching** - Memory, localStorage, and IndexedDB support
🔄 **Auto Retry** - Exponential backoff retry logic
🔌 **Offline Support** - Queue requests when offline, replay when online
⚡ **Request Deduplication** - Prevent duplicate simultaneous requests
🎣 **React Hooks** - useFetch, useMutation, useInfiniteQuery
🚦 **Rate Limiting** - Per-endpoint rate limiting
🔗 **Interceptors** - Global and per-request interceptors
🧩 **Middleware** - Extensible middleware system
📊 **GraphQL** - Built-in GraphQL support
🧪 **Mock Mode** - Easy testing with mock responses
📈 **Progress Tracking** - Upload/download progress events
❌ **Error Handling** - Custom error classes
🐛 **Debug Mode** - Detailed logging

## Installation

```bash
npm install smart-fetch
```

Or with yarn:

```bash
yarn add smart-fetch
```

## Quick Start

### Basic Usage

```typescript
import { smartFetch } from 'smart-fetch';

// Simple GET request
const response = await smartFetch.get('/api/users');
console.log(response.data);

// POST request with body
const newUser = await smartFetch.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Other HTTP methods
await smartFetch.put('/api/users/1', { name: 'Jane' });
await smartFetch.delete('/api/users/1');
await smartFetch.patch('/api/users/1', { email: 'jane@example.com' });
```

### Create Custom Instance

```typescript
import { SmartFetch } from 'smart-fetch';

const api = new SmartFetch({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  cache: {
    strategy: 'indexedDB',
    ttl: 60000 // 1 minute
  },
  retry: {
    maxRetries: 3,
    delay: 1000,
    backoff: 2
  },
  debug: true
});

const users = await api.get('/users');
```

## Core Features

### 1. Caching

Smart-fetch supports three caching strategies:

```typescript
// Memory cache (fastest, not persistent)
await smartFetch.get('/api/data', {
  cache: {
    strategy: 'memory',
    ttl: 60000 // 1 minute
  }
});

// localStorage cache (persistent, ~5-10MB limit)
await smartFetch.get('/api/data', {
  cache: {
    strategy: 'localStorage',
    ttl: 3600000 // 1 hour
  }
});

// IndexedDB cache (persistent, large storage)
await smartFetch.get('/api/data', {
  cache: {
    strategy: 'indexedDB',
    ttl: 86400000 // 24 hours
  }
});

// Custom cache key
await smartFetch.get('/api/users', {
  cache: {
    strategy: 'memory',
    key: 'all-users',
    ttl: 300000
  }
});

// Clear cache
await api.clearCache('memory');
await api.clearCache(); // Clear all
```

### 2. Retry Logic

Automatic retry with exponential backoff:

```typescript
await smartFetch.get('/api/data', {
  retry: {
    maxRetries: 3,
    delay: 1000, // Initial delay: 1s
    backoff: 2, // Multiplier: 2x each retry
    maxDelay: 10000, // Max delay: 10s
    retryOn: [408, 429, 500, 502, 503, 504], // HTTP status codes
    retryCondition: (error) => {
      // Custom retry logic
      return error.code === 'NETWORK_ERROR';
    }
  }
});
```

### 3. Request Deduplication

Prevent duplicate simultaneous requests:

```typescript
// These will only make one actual request
const [res1, res2, res3] = await Promise.all([
  smartFetch.get('/api/users'),
  smartFetch.get('/api/users'),
  smartFetch.get('/api/users')
]);

// Disable deduplication for specific request
await smartFetch.get('/api/users', { deduplicate: false });
```

### 4. Offline Queue

Automatically queue requests when offline:

```typescript
const api = new SmartFetch({
  offlineQueueEnabled: true
});

// This will be queued if offline and sent when back online
await api.post('/api/analytics', {
  event: 'button_clicked',
  timestamp: Date.now()
}, {
  offlineQueueable: true
});
```

### 5. Interceptors

Modify requests and responses globally:

```typescript
const api = new SmartFetch({
  interceptors: {
    request: [{
      onRequest: async (config) => {
        // Add auth token
        const token = await getAuthToken();
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
        return config;
      },
      onRequestError: (error) => {
        console.error('Request error:', error);
        return error;
      }
    }],
    response: [{
      onResponse: (response) => {
        // Transform response
        console.log('Response received:', response.status);
        return response;
      },
      onResponseError: async (error) => {
        // Handle 401 errors
        if (error.response?.status === 401) {
          await refreshToken();
          // Retry the request
          return api.request(error.config);
        }
        return error;
      }
    }]
  }
});
```

### 6. Middleware

Extensible middleware system:

```typescript
import { SmartFetch, authMiddleware, timingMiddleware } from 'smart-fetch';

const api = new SmartFetch({
  middleware: [
    timingMiddleware, // Built-in timing middleware
    authMiddleware(() => localStorage.getItem('token')), // Built-in auth middleware
    {
      name: 'custom',
      pre: async (config) => {
        console.log('Before request:', config.url);
        return config;
      },
      post: async (response) => {
        console.log('After response:', response.status);
        return response;
      },
      error: async (error) => {
        console.error('Error:', error);
        return error;
      }
    }
  ]
});
```

### 7. Rate Limiting

Limit requests per endpoint:

```typescript
await smartFetch.get('/api/search', {
  rateLimit: {
    maxRequests: 10,
    perMilliseconds: 60000, // 10 requests per minute
    queueRequests: true // Queue instead of rejecting
  }
});
```

### 8. GraphQL Support

Built-in GraphQL client:

```typescript
const data = await smartFetch.graphql('/graphql', {
  query: `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
      }
    }
  `,
  variables: { id: '123' },
  operationName: 'GetUser'
});
```

### 9. Request/Response Transformation

```typescript
await smartFetch.post('/api/users', userData, {
  transformRequest: (data) => {
    // Transform before sending
    return { ...data, timestamp: Date.now() };
  },
  transformResponse: (data) => {
    // Transform after receiving
    return data.result;
  }
});
```

### 10. Response Validation

Validate responses with Zod:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

const response = await smartFetch.get('/api/users/1', {
  validateResponse: UserSchema
});

// response.data is fully typed and validated
```

### 11. Progress Tracking

Track upload/download progress:

```typescript
await smartFetch.post('/api/upload', formData, {
  onUploadProgress: (progress) => {
    console.log(`Upload: ${progress.percentage}%`);
  },
  onDownloadProgress: (progress) => {
    console.log(`Download: ${progress.percentage}%`);
  }
});
```

### 12. Mock Mode

Easy testing with mock responses:

```typescript
const api = new SmartFetch({ mockMode: true });

api.addMock({
  url: '/api/users',
  method: 'GET',
  response: [{ id: 1, name: 'John' }],
  status: 200,
  delay: 100 // Simulate network delay
});

const users = await api.get('/api/users');
// Returns mock data
```

## React Hooks

### useFetch

```typescript
import { useFetch } from 'smart-fetch';

function UserProfile({ userId }) {
  const { data, error, isLoading, refetch } = useFetch(`/api/users/${userId}`, {
    cache: { strategy: 'memory', ttl: 60000 },
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30s
    onSuccess: (data) => console.log('Data loaded:', data),
    onError: (error) => console.error('Error:', error)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useMutation

```typescript
import { useMutation } from 'smart-fetch';
import { smartFetch } from 'smart-fetch';

function CreateUser() {
  const { mutate, data, isLoading, error } = useMutation(
    (userData) => smartFetch.post('/api/users', userData),
    {
      onSuccess: (data) => {
        console.log('User created:', data);
      },
      onError: (error) => {
        console.error('Failed to create user:', error);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ name: 'John', email: 'john@example.com' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

### useInfiniteQuery

```typescript
import { useInfiniteQuery } from 'smart-fetch';

function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading
  } = useInfiniteQuery('/api/posts', {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    cache: { strategy: 'memory' }
  });

  return (
    <div>
      {data.map((page, i) => (
        <div key={i}>
          {page.items.map((item) => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      ))}
      {hasNextPage && (
        <button onClick={fetchNextPage}>
          Load More
        </button>
      )}
    </div>
  );
}
```

## Error Handling

Smart-fetch provides custom error classes:

```typescript
import {
  NetworkError,
  TimeoutError,
  AbortError,
  ValidationError,
  RateLimitError
} from 'smart-fetch';

try {
  await smartFetch.get('/api/data');
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timeout');
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.validationErrors);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry after:', error.retryAfter);
  }
}
```

## TypeScript Support

Full TypeScript support with generics:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const response = await smartFetch.get<User>('/api/users/1');
// response.data is typed as User

const users = await smartFetch.get<User[]>('/api/users');
// users.data is typed as User[]
```

## API Reference

### SmartFetch Class

#### Constructor

```typescript
new SmartFetch(config?: SmartFetchConfig)
```

#### Methods

- `request<T>(config: RequestConfig): Promise<SmartFetchResponse<T>>`
- `get<T>(url: string, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>`
- `post<T>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>`
- `put<T>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>`
- `delete<T>(url: string, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>`
- `patch<T>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>>`
- `graphql<T>(endpoint: string, request: GraphQLRequest, config?: Partial<RequestConfig>): Promise<T>`
- `clearCache(strategy?: CacheStrategy): Promise<void>`
- `addMock(mock: MockConfig): void`
- `clearMocks(): void`

## Examples

See the [examples](./examples) directory for:
- Vanilla JavaScript examples
- React examples
- TypeScript examples
- GraphQL examples
- Advanced usage patterns

## Publishing

To publish this package:

1. Build the package:
```bash
npm run build
```

2. Run tests:
```bash
npm test
```

3. Update version:
```bash
npm version patch|minor|major
```

4. Publish to npm:
```bash
npm publish
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © 2025
