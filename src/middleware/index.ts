import { Middleware, RequestConfig, SmartFetchResponse } from '../types';

export class MiddlewareManager {
  private middleware: Middleware[] = [];

  add(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  remove(name: string): void {
    this.middleware = this.middleware.filter((m) => m.name !== name);
  }

  async executePre(config: RequestConfig): Promise<RequestConfig> {
    let currentConfig = config;

    for (const middleware of this.middleware) {
      if (middleware.pre) {
        currentConfig = await middleware.pre(currentConfig);
      }
    }

    return currentConfig;
  }

  async executePost<T>(response: SmartFetchResponse<T>): Promise<SmartFetchResponse<T>> {
    let currentResponse = response;

    for (const middleware of this.middleware) {
      if (middleware.post) {
        currentResponse = await middleware.post(currentResponse);
      }
    }

    return currentResponse;
  }

  async executeError(error: any): Promise<any> {
    let currentError = error;

    for (const middleware of this.middleware) {
      if (middleware.error) {
        currentError = await middleware.error(currentError);
      }
    }

    return currentError;
  }
}

// Built-in middleware examples
export const loggerMiddleware: Middleware = {
  name: 'logger',
  pre: async (config) => {
    console.log('[Request]', config.method, config.url);
    return config;
  },
  post: async (response) => {
    console.log('[Response]', response.status, response.config.url);
    return response;
  },
  error: async (error) => {
    console.error('[Error]', error);
    return error;
  },
};

export const timingMiddleware: Middleware = {
  name: 'timing',
  pre: async (config) => {
    return {
      ...config,
      metadata: {
        ...config.metadata,
        startTime: Date.now(),
      },
    };
  },
  post: async (response) => {
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`Request took ${duration}ms`);
    }
    return response;
  },
};

export const authMiddleware = (getToken: () => string | Promise<string>): Middleware => ({
  name: 'auth',
  pre: async (config) => {
    const token = await getToken();
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  },
});

export const retryMiddleware = (maxRetries = 3): Middleware => ({
  name: 'retry',
  error: async (error) => {
    const retryCount = error.config?.metadata?.retryCount || 0;
    if (retryCount < maxRetries) {
      error.config.metadata = {
        ...error.config.metadata,
        retryCount: retryCount + 1,
      };
      throw error; // Re-throw to trigger retry
    }
    return error;
  },
});
