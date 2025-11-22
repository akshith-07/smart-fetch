import {
  buildURL,
  isAbsoluteURL,
  combineURLs,
  generateCacheKey,
  isPlainObject,
  mergeConfig,
} from '../utils';

describe('Utils', () => {
  describe('buildURL', () => {
    it('should build URL with base URL', () => {
      const url = buildURL('https://api.example.com', '/users');
      expect(url).toBe('https://api.example.com/users');
    });

    it('should build URL with query params', () => {
      const url = buildURL(undefined, '/users', { id: 1, name: 'test' });
      expect(url).toBe('/users?id=1&name=test');
    });

    it('should handle absolute URLs', () => {
      const url = buildURL('https://api.example.com', 'https://other.com/users');
      expect(url).toBe('https://other.com/users');
    });
  });

  describe('isAbsoluteURL', () => {
    it('should return true for absolute URLs', () => {
      expect(isAbsoluteURL('https://example.com')).toBe(true);
      expect(isAbsoluteURL('http://example.com')).toBe(true);
      expect(isAbsoluteURL('//example.com')).toBe(true);
    });

    it('should return false for relative URLs', () => {
      expect(isAbsoluteURL('/users')).toBe(false);
      expect(isAbsoluteURL('users')).toBe(false);
    });
  });

  describe('combineURLs', () => {
    it('should combine base and relative URLs', () => {
      expect(combineURLs('https://api.example.com', 'users')).toBe(
        'https://api.example.com/users'
      );
      expect(combineURLs('https://api.example.com/', '/users')).toBe(
        'https://api.example.com/users'
      );
    });
  });

  describe('generateCacheKey', () => {
    it('should generate cache key from request config', () => {
      const key = generateCacheKey({
        url: '/api/users',
        method: 'GET',
        params: { id: 1 },
      });
      expect(key).toContain('GET');
      expect(key).toContain('/api/users');
    });

    it('should include body in cache key for POST requests', () => {
      const key = generateCacheKey({
        url: '/api/users',
        method: 'POST',
        body: { name: 'test' },
      });
      expect(key).toContain('POST');
      expect(key).toContain('name');
    });
  });

  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });

    it('should return false for non-plain objects', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
    });
  });

  describe('mergeConfig', () => {
    it('should merge configs deeply', () => {
      const base = {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      };
      const override = {
        headers: { Authorization: 'Bearer token' },
      };
      const merged = mergeConfig(base, override);

      expect(merged.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });
      expect(merged.timeout).toBe(5000);
    });
  });
});
