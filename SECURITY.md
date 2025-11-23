# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of smart-fetch seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

* Open a public GitHub issue for security vulnerabilities
* Disclose the vulnerability publicly before it has been addressed

### Please Do

1. **Email**: Send details to the repository maintainer (check package.json for contact info)
2. **Include**:
   * Type of vulnerability
   * Full paths of source file(s) related to the vulnerability
   * Location of the affected source code (tag/branch/commit)
   * Step-by-step instructions to reproduce the issue
   * Proof-of-concept or exploit code (if possible)
   * Impact of the issue, including how an attacker might exploit it

### What to Expect

* **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
* **Updates**: We will send you regular updates about our progress
* **Fix Timeline**: We aim to address critical vulnerabilities within 7 days
* **Disclosure**: Once the vulnerability is fixed, we will:
  * Release a security patch
  * Publish a security advisory
  * Credit you for the discovery (if you wish)

## Security Best Practices

When using smart-fetch:

### 1. Keep Dependencies Updated

```bash
npm audit
npm update
```

### 2. Secure Configuration

```typescript
const api = new SmartFetch({
  // Use HTTPS endpoints
  baseURL: 'https://api.example.com',

  // Set reasonable timeouts
  timeout: 10000,

  // Validate responses
  validateResponse: ResponseSchema,

  // Don't cache sensitive data
  cache: false // or use memory cache only
});
```

### 3. Sensitive Data

* **Don't cache sensitive data** in localStorage or IndexedDB
* **Use memory cache** for temporary sensitive data
* **Clear caches** when logging out:

```typescript
await api.clearCache('localStorage');
await api.clearCache('indexedDB');
```

### 4. Authentication Tokens

* **Don't expose tokens** in client-side code
* **Use secure storage** for tokens
* **Implement token refresh** logic:

```typescript
const api = new SmartFetch({
  interceptors: {
    request: [{
      onRequest: async (config) => {
        const token = await getSecureToken();
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
        return config;
      }
    }],
    response: [{
      onResponseError: async (error) => {
        if (error.response?.status === 401) {
          await refreshToken();
          return api.request(error.config);
        }
        return error;
      }
    }]
  }
});
```

### 5. CORS and CSP

Ensure your Content Security Policy allows fetch requests:

```http
Content-Security-Policy: connect-src 'self' https://api.example.com
```

### 6. Input Validation

Always validate user input before sending requests:

```typescript
import { z } from 'zod';

const UserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100)
});

const input = UserInputSchema.parse(userInput);
await api.post('/users', input);
```

### 7. Offline Queue Security

Be careful with offline queue for sensitive operations:

```typescript
// Don't queue sensitive operations
await api.post('/payment', data, {
  offlineQueueable: false
});
```

## Known Security Considerations

### IndexedDB

* Data stored in IndexedDB is accessible to any script running on the same origin
* Don't store unencrypted sensitive data
* Consider encrypting sensitive cached data

### localStorage

* Limited to ~5-10MB
* Synchronous operations can block UI
* Same security considerations as IndexedDB

### Request Deduplication

* Deduplication is based on URL and method
* Sensitive requests with same URL might be deduplicated
* Disable for sensitive unique requests:

```typescript
await api.post('/transaction', data, {
  deduplicate: false
});
```

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledgment and initial assessment
3. **Day 3-7**: Fix development and testing
4. **Day 7-10**: Security patch release
5. **Day 10-14**: Public disclosure (if appropriate)

## Contact

For security concerns, please contact the repository maintainer through GitHub or the email listed in package.json.

## Attribution

We appreciate responsible disclosure and will credit researchers who report vulnerabilities responsibly.
