// Advanced features example

import { SmartFetch, authMiddleware } from 'smart-fetch';

// Create instance with interceptors
const api = new SmartFetch({
  baseURL: 'https://api.example.com',
  interceptors: {
    request: [{
      onRequest: async (config) => {
        // Add timestamp to all requests
        config.headers = {
          ...config.headers,
          'X-Request-Time': new Date().toISOString()
        };
        return config;
      }
    }],
    response: [{
      onResponse: (response) => {
        console.log(`Request to ${response.config.url} took ${Date.now() - startTime}ms`);
        return response;
      },
      onResponseError: async (error) => {
        if (error.response?.status === 401) {
          // Refresh token and retry
          console.log('Unauthorized, refreshing token...');
          await refreshToken();
          return api.request(error.config);
        }
        throw error;
      }
    }]
  }
});

// Using middleware
const apiWithMiddleware = new SmartFetch({
  baseURL: 'https://api.example.com',
  middleware: [
    authMiddleware(() => localStorage.getItem('auth_token')),
    {
      name: 'logger',
      pre: (config) => {
        console.log('Making request to:', config.url);
        return config;
      },
      post: (response) => {
        console.log('Response status:', response.status);
        return response;
      }
    }
  ]
});

// Rate limiting example
async function searchWithRateLimit(query) {
  const response = await api.get('/search', {
    params: { q: query },
    rateLimit: {
      maxRequests: 10,
      perMilliseconds: 60000, // 10 requests per minute
      queueRequests: true
    }
  });
  return response.data;
}

// Request deduplication
async function deduplicateRequests() {
  // All three requests will be deduplicated into one
  const [result1, result2, result3] = await Promise.all([
    api.get('/api/data'),
    api.get('/api/data'),
    api.get('/api/data')
  ]);

  console.log('All three results are the same:',
    result1.data === result2.data && result2.data === result3.data);
}

// Offline queue
const offlineApi = new SmartFetch({
  offlineQueueEnabled: true
});

async function trackAnalytics(event) {
  // This will be queued if offline and sent when back online
  await offlineApi.post('/analytics', {
    event,
    timestamp: Date.now()
  }, {
    offlineQueueable: true
  });
}

// Mock mode for testing
const mockApi = new SmartFetch({
  mockMode: true
});

mockApi.addMock({
  url: '/api/users',
  method: 'GET',
  response: [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' }
  ],
  delay: 100
});

async function testWithMocks() {
  const response = await mockApi.get('/api/users');
  console.log('Mock data:', response.data);
}

// Helper functions
async function refreshToken() {
  // Implement token refresh logic
  return 'new-token';
}

// Run examples
deduplicateRequests();
testWithMocks();
