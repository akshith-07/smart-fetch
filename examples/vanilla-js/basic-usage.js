// Basic usage example with vanilla JavaScript

import { smartFetch, SmartFetch } from 'smart-fetch';

// Simple GET request
async function getUsers() {
  try {
    const response = await smartFetch.get('https://jsonplaceholder.typicode.com/users');
    console.log('Users:', response.data);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

// POST request
async function createPost() {
  try {
    const response = await smartFetch.post('https://jsonplaceholder.typicode.com/posts', {
      title: 'My New Post',
      body: 'This is the content of my post',
      userId: 1
    });
    console.log('Created post:', response.data);
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

// Using cache
async function getCachedData() {
  const response = await smartFetch.get('https://jsonplaceholder.typicode.com/posts/1', {
    cache: {
      strategy: 'memory',
      ttl: 60000 // Cache for 1 minute
    }
  });

  console.log('Cached:', response.cached);
  console.log('Data:', response.data);
}

// Create custom instance with configuration
const api = new SmartFetch({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  cache: {
    strategy: 'localStorage',
    ttl: 300000 // 5 minutes
  },
  retry: {
    maxRetries: 3,
    delay: 1000,
    backoff: 2
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

async function useCustomInstance() {
  const response = await api.get('/posts');
  console.log('Posts:', response.data);
}

// Run examples
getUsers();
createPost();
getCachedData();
useCustomInstance();
