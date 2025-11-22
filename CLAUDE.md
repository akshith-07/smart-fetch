Create an enterprise-grade NPM package called "smart-fetch" - a universal API client with intelligent caching, retry logic, and offline support.

Features:
- Promise-based API similar to Axios
- Automatic request/response caching with multiple strategies (memory, localStorage, IndexedDB)
- Cache invalidation and TTL
- Automatic retry with exponential backoff
- Request deduplication (prevent duplicate simultaneous requests)
- Global and per-request interceptors
- Rate limiting per endpoint
- Offline queue (store requests when offline, replay when online)
- Request/response transformers
- TypeScript with generics for type-safe responses
- React hooks: useFetch, useMutation, useInfiniteQuery
- Request cancellation
- Progress tracking for uploads/downloads
- Error handling with custom error classes
- Debug mode with detailed logging
- Middleware support
- GraphQL support
- Mock mode for testing

Tech Stack:
- TypeScript
- IndexedDB for persistent caching
- React 18+ (for hooks)
- Zod for response validation
- Jest for testing

Provide complete production-ready code with proper NPM package structure, comprehensive documentation, examples for vanilla JS and React, tests, and publishing guide.
