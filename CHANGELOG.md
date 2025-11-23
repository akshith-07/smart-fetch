# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-23

### Added
- Initial release of smart-fetch
- Promise-based API similar to Axios
- Automatic request/response caching with multiple strategies (memory, localStorage, IndexedDB)
- Cache invalidation and TTL support
- Automatic retry with exponential backoff
- Request deduplication to prevent duplicate simultaneous requests
- Global and per-request interceptors
- Rate limiting per endpoint
- Offline queue (store requests when offline, replay when online)
- Request/response transformers
- Full TypeScript support with generics for type-safe responses
- React hooks: useFetch, useMutation, useInfiniteQuery
- Request cancellation using AbortController
- Progress tracking for uploads/downloads
- Custom error classes for better error handling
- Debug mode with detailed logging
- Extensible middleware support
- Built-in GraphQL support
- Mock mode for testing
- Response validation with Zod
- Comprehensive test suite with Jest
- Full documentation with examples

### Dependencies
- idb ^7.1.1 - IndexedDB wrapper
- zod ^3.22.4 - Schema validation

### Dev Dependencies
- TypeScript ^5.3.3
- Jest ^29.7.0
- ESLint ^8.56.0
- React ^18.2.0 (peer dependency)

## [Unreleased]

### Planned Features
- Browser extension support
- Service Worker integration
- Request batching
- Streaming support
- WebSocket integration
- Performance metrics
- Advanced cache strategies (LRU, LFU)

---

For more details, see the [README](README.md) and [API documentation](API.md).
