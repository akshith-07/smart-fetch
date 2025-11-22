import { RequestConfig } from '../types';

export function buildURL(baseURL: string | undefined, url: string, params?: Record<string, any>): string {
  let fullURL = url;

  if (baseURL && !isAbsoluteURL(url)) {
    fullURL = combineURLs(baseURL, url);
  }

  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    if (queryString) {
      fullURL += (fullURL.includes('?') ? '&' : '?') + queryString;
    }
  }

  return fullURL;
}

export function isAbsoluteURL(url: string): boolean {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

export function combineURLs(baseURL: string, relativeURL: string): string {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

export function mergeConfig<T extends Record<string, any>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base };

  Object.keys(override).forEach((key) => {
    const overrideValue = override[key as keyof T];
    const baseValue = base[key as keyof T];

    if (isPlainObject(overrideValue) && isPlainObject(baseValue)) {
      result[key as keyof T] = mergeConfig(baseValue as any, overrideValue as any);
    } else if (overrideValue !== undefined) {
      result[key as keyof T] = overrideValue as any;
    }
  });

  return result;
}

export function isPlainObject(val: any): val is Record<string, any> {
  if (typeof val !== 'object' || val === null) return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

export function generateCacheKey(config: RequestConfig): string {
  const { url, method = 'GET', params, body } = config;
  const parts = [method, url];

  if (params) {
    parts.push(JSON.stringify(params));
  }

  if (body && method !== 'GET') {
    parts.push(JSON.stringify(body));
  }

  return parts.join('|');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createAbortController(timeout?: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;

  if (timeout) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  return {
    controller,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}

export function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export class Logger {
  private enabled: boolean;
  private prefix: string;

  constructor(enabled = false, prefix = '[SmartFetch]') {
    this.enabled = enabled;
    this.prefix = prefix;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  log(...args: any[]) {
    if (this.enabled) {
      console.log(this.prefix, ...args);
    }
  }

  warn(...args: any[]) {
    if (this.enabled) {
      console.warn(this.prefix, ...args);
    }
  }

  error(...args: any[]) {
    if (this.enabled) {
      console.error(this.prefix, ...args);
    }
  }

  info(...args: any[]) {
    if (this.enabled) {
      console.info(this.prefix, ...args);
    }
  }

  debug(...args: any[]) {
    if (this.enabled) {
      console.debug(this.prefix, ...args);
    }
  }
}
