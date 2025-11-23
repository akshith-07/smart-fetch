import { SmartFetch } from '../core/SmartFetch';
import { NetworkError } from '../errors';

describe('SmartFetch', () => {
  let client: SmartFetch;

  beforeEach(() => {
    client = new SmartFetch({ debug: false });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Basic requests', () => {
    it('should make a GET request', async () => {
      const mockData = { message: 'success' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const response = await client.get('/api/test');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should make a POST request with body', async () => {
      const mockData = { id: 1 };
      const requestBody = { name: 'test' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const response = await client.post('/api/test', requestBody);

      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  describe('Retry logic', () => {
    it('should retry on network error', async () => {
      const mockData = { message: 'success' };

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockData,
        });

      const response = await client.get('/api/test', {
        retry: { maxRetries: 3, delay: 10 },
      });

      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry beyond max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        client.get('/api/test', {
          retry: { maxRetries: 2, delay: 10 },
        })
      ).rejects.toThrow(NetworkError);

      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      const mockData = { message: 'cached' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      // First request
      const response1 = await client.get('/api/test', {
        cache: { strategy: 'memory' },
      });

      // Second request (should use cache)
      const response2 = await client.get('/api/test', {
        cache: { strategy: 'memory' },
      });

      expect(response1.data).toEqual(mockData);
      expect(response2.data).toEqual(mockData);
      expect(response2.cached).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request deduplication', () => {
    it('should deduplicate simultaneous requests', async () => {
      const mockData = { message: 'success' };

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  statusText: 'OK',
                  headers: new Headers({ 'content-type': 'application/json' }),
                  json: async () => mockData,
                }),
              50
            )
          )
      );

      // Make two simultaneous requests
      const [response1, response2] = await Promise.all([
        client.get('/api/test', { deduplicate: true }),
        client.get('/api/test', { deduplicate: true }),
      ]);

      expect(response1.data).toEqual(mockData);
      expect(response2.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interceptors', () => {
    it('should execute request interceptors', async () => {
      const mockData = { message: 'success' };
      const requestInterceptor = {
        onRequest: jest.fn((config) => ({
          ...config,
          headers: { ...config.headers, 'X-Custom': 'test' },
        })),
      };

      const clientWithInterceptor = new SmartFetch({
        interceptors: { request: [requestInterceptor] },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      await clientWithInterceptor.get('/api/test');

      expect(requestInterceptor.onRequest).toHaveBeenCalled();
    });

    it('should execute response interceptors', async () => {
      const mockData = { message: 'success' };
      const responseInterceptor = {
        onResponse: jest.fn((response) => response),
      };

      const clientWithInterceptor = new SmartFetch({
        interceptors: { response: [responseInterceptor] },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      await clientWithInterceptor.get('/api/test');

      expect(responseInterceptor.onResponse).toHaveBeenCalled();
    });
  });

  describe('Mock mode', () => {
    it('should return mock response when enabled', async () => {
      const mockData = { message: 'mocked' };
      const clientWithMock = new SmartFetch({ mockMode: true });

      clientWithMock.addMock({
        url: '/api/test',
        method: 'GET',
        response: mockData,
      });

      const response = await clientWithMock.get('/api/test');

      expect(response.data).toEqual(mockData);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
