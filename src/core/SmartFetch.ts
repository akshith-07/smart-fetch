import {
  SmartFetchConfig,
  RequestConfig,
  SmartFetchResponse,
  HttpMethod,
  CacheConfig,
  RetryConfig,
  RateLimitConfig,
  MockConfig,
  GraphQLRequest,
} from '../types';
import { CacheManager } from '../cache';
import { OfflineQueue } from '../offline';
import { MiddlewareManager } from '../middleware';
import { GraphQLClient, isGraphQLRequest } from '../graphql';
import {
  SmartFetchError,
  NetworkError,
  TimeoutError,
  AbortError,
  ValidationError,
  RateLimitError,
} from '../errors';
import {
  buildURL,
  mergeConfig,
  generateCacheKey,
  sleep,
  createAbortController,
  isOnline,
  Logger,
} from '../utils';

export class SmartFetch {
  private config: SmartFetchConfig;
  private cacheManager: CacheManager;
  private offlineQueue: OfflineQueue;
  private middlewareManager: MiddlewareManager;
  private logger: Logger;
  private pendingRequests: Map<string, Promise<SmartFetchResponse>>;
  private rateLimiters: Map<string, { tokens: number; lastRefill: number }>;
  private mockResponses: Map<string, MockConfig>;

  constructor(config: SmartFetchConfig = {}) {
    this.config = {
      timeout: 30000,
      cache: false,
      retry: false,
      debug: false,
      mockMode: false,
      offlineQueueEnabled: true,
      validateStatus: (status) => status >= 200 && status < 300,
      ...config,
    };

    this.cacheManager = new CacheManager();
    this.offlineQueue = new OfflineQueue();
    this.middlewareManager = new MiddlewareManager();
    this.logger = new Logger(this.config.debug);
    this.pendingRequests = new Map();
    this.rateLimiters = new Map();
    this.mockResponses = new Map();

    // Setup middleware
    if (this.config.middleware) {
      this.config.middleware.forEach((m) => this.middlewareManager.add(m));
    }

    // Setup offline queue processing
    this.offlineQueue.onProcessed(() => {
      this.processOfflineQueue();
    });
  }

  async request<T = any>(config: RequestConfig): Promise<SmartFetchResponse<T>> {
    this.logger.log('Request:', config);

    // Merge with default config
    const mergedConfig = this.mergeRequestConfig(config);

    try {
      // Execute middleware pre-hooks
      let processedConfig = await this.middlewareManager.executePre(mergedConfig);

      // Execute request interceptors
      if (this.config.interceptors?.request) {
        for (const interceptor of this.config.interceptors.request) {
          if (interceptor.onRequest) {
            processedConfig = await interceptor.onRequest(processedConfig);
          }
        }
      }

      // Check if mock mode is enabled
      if (this.config.mockMode) {
        const mockResponse = this.getMockResponse(processedConfig);
        if (mockResponse) {
          return mockResponse;
        }
      }

      // Check cache
      const cacheKey = generateCacheKey(processedConfig);
      const cachedResponse = await this.checkCache<T>(processedConfig, cacheKey);
      if (cachedResponse) {
        this.logger.log('Cache hit:', cacheKey);
        return cachedResponse;
      }

      // Check for pending duplicate requests
      if (processedConfig.deduplicate !== false) {
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
          this.logger.log('Deduplicating request:', cacheKey);
          return pendingRequest as Promise<SmartFetchResponse<T>>;
        }
      }

      // Check rate limit
      await this.checkRateLimit(processedConfig);

      // Check if offline and queueable
      if (!isOnline() && processedConfig.offlineQueueable !== false) {
        if (this.config.offlineQueueEnabled) {
          await this.offlineQueue.enqueue(processedConfig);
          throw new NetworkError('Request queued for offline processing', processedConfig);
        }
      }

      // Make the request
      const requestPromise = this.executeRequest<T>(processedConfig, cacheKey);

      // Store pending request for deduplication
      if (processedConfig.deduplicate !== false) {
        this.pendingRequests.set(cacheKey, requestPromise);
      }

      let response = await requestPromise;

      // Execute response interceptors
      if (this.config.interceptors?.response) {
        for (const interceptor of this.config.interceptors.response) {
          if (interceptor.onResponse) {
            response = await interceptor.onResponse(response);
          }
        }
      }

      // Execute middleware post-hooks
      response = await this.middlewareManager.executePost(response);

      // Clean up pending request
      if (processedConfig.deduplicate !== false) {
        this.pendingRequests.delete(cacheKey);
      }

      return response;
    } catch (error) {
      // Execute error interceptors
      let processedError = error;

      if (this.config.interceptors?.response) {
        for (const interceptor of this.config.interceptors.response) {
          if (interceptor.onResponseError) {
            processedError = await interceptor.onResponseError(processedError);
          }
        }
      }

      // Execute middleware error hooks
      processedError = await this.middlewareManager.executeError(processedError);

      throw processedError;
    }
  }

  private async executeRequest<T>(
    config: RequestConfig,
    cacheKey: string,
    retryCount = 0
  ): Promise<SmartFetchResponse<T>> {
    const url = buildURL(this.config.baseURL, config.url, config.params);
    const { controller, cleanup } = createAbortController(config.timeout);

    try {
      // Combine signals if provided
      const signal = config.signal
        ? this.combineAbortSignals([controller.signal, config.signal])
        : controller.signal;

      // Transform request body
      let body = config.body;
      if (config.transformRequest && body) {
        body = config.transformRequest(body);
      }

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: config.method || 'GET',
        headers: this.buildHeaders(config),
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        signal,
        credentials: config.credentials,
        mode: config.mode,
      };

      const startTime = Date.now();
      const response = await fetch(url, fetchOptions);
      cleanup();

      // Validate status
      const validateStatus = this.config.validateStatus || ((status) => status >= 200 && status < 300);
      if (!validateStatus(response.status)) {
        throw new SmartFetchError(
          `Request failed with status ${response.status}`,
          config,
          `HTTP_${response.status}`
        );
      }

      // Parse response
      let data = await this.parseResponse<T>(response);

      // Transform response
      if (config.transformResponse) {
        data = config.transformResponse(data);
      }

      // Validate response schema
      if (config.validateResponse) {
        try {
          data = config.validateResponse.parse(data);
        } catch (error) {
          throw new ValidationError('Response validation failed', config, error);
        }
      }

      const smartResponse: SmartFetchResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
        retryCount,
      };

      // Cache the response
      await this.cacheResponse(config, cacheKey, smartResponse);

      return smartResponse;
    } catch (error) {
      cleanup();

      // Handle different error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AbortError('Request aborted', config);
        }
        if (error.message.includes('timeout')) {
          throw new TimeoutError('Request timeout', config);
        }
      }

      // Retry logic
      const retryConfig = this.getRetryConfig(config);
      if (retryConfig && this.shouldRetry(error, retryCount, retryConfig)) {
        const delay = this.calculateRetryDelay(retryCount, retryConfig);
        this.logger.log(`Retrying request (${retryCount + 1}/${retryConfig.maxRetries}) after ${delay}ms`);
        await sleep(delay);
        return this.executeRequest<T>(config, cacheKey, retryCount + 1);
      }

      // Wrap in NetworkError if not already a SmartFetchError
      if (!(error instanceof SmartFetchError)) {
        throw new NetworkError(
          error instanceof Error ? error.message : 'Network request failed',
          config
        );
      }

      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    if (contentType.includes('text/')) {
      return response.text() as any;
    }

    if (contentType.includes('application/octet-stream') || contentType.includes('image/')) {
      return response.blob() as any;
    }

    return response.text() as any;
  }

  private buildHeaders(config: RequestConfig): HeadersInit {
    const headers: Record<string, string> = {
      ...this.config.headers,
      ...config.headers,
    };

    // Set content-type for JSON bodies
    if (config.body && typeof config.body === 'object' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private mergeRequestConfig(config: RequestConfig): RequestConfig {
    return mergeConfig(
      {
        method: 'GET' as HttpMethod,
        timeout: this.config.timeout,
        cache: this.config.cache,
        retry: this.config.retry,
        rateLimit: this.config.rateLimit,
        deduplicate: true,
        offlineQueueable: true,
        ...config,
      },
      config
    );
  }

  private async checkCache<T>(
    config: RequestConfig,
    cacheKey: string
  ): Promise<SmartFetchResponse<T> | null> {
    if (!config.cache) return null;

    const cacheConfig = typeof config.cache === 'object' ? config.cache : { strategy: 'memory' as const };
    const strategy = cacheConfig.strategy;

    const cached = await this.cacheManager.get<T>(strategy, cacheConfig.key || cacheKey);

    if (cached) {
      return {
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        config,
        cached: true,
      };
    }

    return null;
  }

  private async cacheResponse<T>(
    config: RequestConfig,
    cacheKey: string,
    response: SmartFetchResponse<T>
  ): Promise<void> {
    if (!config.cache) return;

    const cacheConfig = typeof config.cache === 'object' ? config.cache : { strategy: 'memory' as const };
    const strategy = cacheConfig.strategy;

    await this.cacheManager.set(strategy, cacheConfig.key || cacheKey, {
      data: response.data,
      timestamp: Date.now(),
      ttl: cacheConfig.ttl,
      key: cacheConfig.key || cacheKey,
    });
  }

  private async checkRateLimit(config: RequestConfig): Promise<void> {
    if (!config.rateLimit && !this.config.rateLimit) return;

    const rateLimitConfig = (config.rateLimit || this.config.rateLimit) as RateLimitConfig;
    const key = config.url;

    let limiter = this.rateLimiters.get(key);
    if (!limiter) {
      limiter = {
        tokens: rateLimitConfig.maxRequests,
        lastRefill: Date.now(),
      };
      this.rateLimiters.set(key, limiter);
    }

    // Refill tokens
    const now = Date.now();
    const timePassed = now - limiter.lastRefill;
    const refills = Math.floor(timePassed / rateLimitConfig.perMilliseconds);

    if (refills > 0) {
      limiter.tokens = Math.min(
        rateLimitConfig.maxRequests,
        limiter.tokens + refills * rateLimitConfig.maxRequests
      );
      limiter.lastRefill = now;
    }

    // Check if we have tokens
    if (limiter.tokens < 1) {
      const waitTime = rateLimitConfig.perMilliseconds - (now - limiter.lastRefill);

      if (rateLimitConfig.queueRequests) {
        await sleep(waitTime);
        limiter.tokens = rateLimitConfig.maxRequests;
        limiter.lastRefill = Date.now();
      } else {
        throw new RateLimitError('Rate limit exceeded', config, waitTime);
      }
    }

    limiter.tokens--;
  }

  private getRetryConfig(config: RequestConfig): RetryConfig | null {
    if (!config.retry && !this.config.retry) return null;

    const retry = config.retry || this.config.retry;
    if (typeof retry === 'boolean') {
      return retry ? { maxRetries: 3, delay: 1000, backoff: 2 } : null;
    }

    return retry;
  }

  private shouldRetry(error: any, retryCount: number, config: RetryConfig): boolean {
    if (retryCount >= config.maxRetries) return false;

    if (config.retryCondition) {
      return config.retryCondition(error);
    }

    if (config.retryOn) {
      const status = error?.response?.status;
      return status ? config.retryOn.includes(status) : false;
    }

    // Default: retry on network errors and 5xx errors
    if (error instanceof NetworkError || error instanceof TimeoutError) return true;
    if (error?.response?.status >= 500) return true;

    return false;
  }

  private calculateRetryDelay(retryCount: number, config: RetryConfig): number {
    const backoff = config.backoff || 2;
    const delay = config.delay * Math.pow(backoff, retryCount);
    return config.maxDelay ? Math.min(delay, config.maxDelay) : delay;
  }

  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    signals.forEach((signal) => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort());
      }
    });

    return controller.signal;
  }

  private getMockResponse<T = any>(config: RequestConfig): SmartFetchResponse<T> | null {
    for (const [key, mock] of this.mockResponses) {
      const urlMatch =
        typeof mock.url === 'string'
          ? config.url === mock.url
          : mock.url.test(config.url);

      const methodMatch = !mock.method || mock.method === config.method;

      if (urlMatch && methodMatch) {
        return {
          data: mock.response,
          status: mock.status || 200,
          statusText: 'OK',
          headers: new Headers(),
          config,
        };
      }
    }

    return null;
  }

  private async processOfflineQueue(): Promise<void> {
    const entries = await this.offlineQueue.getAll();

    for (const entry of entries) {
      try {
        await this.request(entry.config);
      } catch (error) {
        this.logger.error('Failed to process offline request:', error);
      }
    }
  }

  // Convenience methods
  async get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(
    url: string,
    body?: any,
    config?: Partial<RequestConfig>
  ): Promise<SmartFetchResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body });
  }

  async put<T = any>(
    url: string,
    body?: any,
    config?: Partial<RequestConfig>
  ): Promise<SmartFetchResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', body });
  }

  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<SmartFetchResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async patch<T = any>(
    url: string,
    body?: any,
    config?: Partial<RequestConfig>
  ): Promise<SmartFetchResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body });
  }

  // GraphQL support
  async graphql<T = any>(
    endpoint: string,
    request: GraphQLRequest,
    config?: Partial<RequestConfig>
  ): Promise<T> {
    const client = new GraphQLClient(endpoint, config?.headers);
    const requestConfig = client.buildRequest(request);
    const response = await this.request({ ...config, ...requestConfig });
    const graphqlResponse = client.parseResponse<T>(response.data, requestConfig);
    return graphqlResponse.data!;
  }

  // Mock management
  addMock(mock: MockConfig): void {
    const key = typeof mock.url === 'string' ? mock.url : mock.url.toString();
    this.mockResponses.set(key, mock);
  }

  clearMocks(): void {
    this.mockResponses.clear();
  }

  // Cache management
  async clearCache(strategy?: 'memory' | 'localStorage' | 'indexedDB'): Promise<void> {
    if (strategy) {
      await this.cacheManager.clear(strategy);
    } else {
      await Promise.all([
        this.cacheManager.clear('memory'),
        this.cacheManager.clear('localStorage'),
        this.cacheManager.clear('indexedDB'),
      ]);
    }
  }

  async invalidateCache(pattern: string, strategy?: 'memory' | 'localStorage' | 'indexedDB'): Promise<void> {
    if (strategy) {
      await this.cacheManager.invalidatePattern(strategy, pattern);
    } else {
      await Promise.all([
        this.cacheManager.invalidatePattern('memory', pattern),
        this.cacheManager.invalidatePattern('localStorage', pattern),
        this.cacheManager.invalidatePattern('indexedDB', pattern),
      ]);
    }
  }
}

// Create a default instance
export const smartFetch = new SmartFetch();

// Export convenience methods
export const get = smartFetch.get.bind(smartFetch);
export const post = smartFetch.post.bind(smartFetch);
export const put = smartFetch.put.bind(smartFetch);
export const del = smartFetch.delete.bind(smartFetch);
export const patch = smartFetch.patch.bind(smartFetch);
