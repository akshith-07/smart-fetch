// Advanced TypeScript usage examples

import { SmartFetch, SmartFetchResponse } from 'smart-fetch';
import { z } from 'zod';

// Define schemas with Zod
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest'])
});

const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  authorId: z.number(),
  createdAt: z.string().datetime()
});

// Infer TypeScript types from Zod schemas
type User = z.infer<typeof UserSchema>;
type Post = z.infer<typeof PostSchema>;

// Create typed API client
class TypedApiClient {
  private client: SmartFetch;

  constructor(baseURL: string) {
    this.client = new SmartFetch({
      baseURL,
      timeout: 10000,
      cache: {
        strategy: 'indexedDB',
        ttl: 300000
      },
      retry: {
        maxRetries: 3,
        delay: 1000
      }
    });
  }

  async getUser(id: number): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`, {
      validateResponse: UserSchema
    });
    return response.data;
  }

  async getUsers(): Promise<User[]> {
    const UsersSchema = z.array(UserSchema);
    const response = await this.client.get<User[]>('/users', {
      validateResponse: UsersSchema
    });
    return response.data;
  }

  async createPost(post: Omit<Post, 'id' | 'createdAt'>): Promise<Post> {
    const response = await this.client.post<Post>('/posts', post, {
      validateResponse: PostSchema
    });
    return response.data;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const response = await this.client.patch<User>(`/users/${id}`, updates, {
      validateResponse: UserSchema
    });
    return response.data;
  }
}

// Generic repository pattern
class Repository<T> {
  constructor(
    private client: SmartFetch,
    private endpoint: string,
    private schema: z.ZodSchema<T>
  ) {}

  async findAll(): Promise<T[]> {
    const response = await this.client.get<T[]>(this.endpoint, {
      validateResponse: z.array(this.schema),
      cache: { strategy: 'memory', ttl: 60000 }
    });
    return response.data;
  }

  async findById(id: number | string): Promise<T> {
    const response = await this.client.get<T>(`${this.endpoint}/${id}`, {
      validateResponse: this.schema
    });
    return response.data;
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await this.client.post<T>(this.endpoint, data, {
      validateResponse: this.schema
    });
    return response.data;
  }

  async update(id: number | string, data: Partial<T>): Promise<T> {
    const response = await this.client.patch<T>(`${this.endpoint}/${id}`, data, {
      validateResponse: this.schema
    });
    return response.data;
  }

  async delete(id: number | string): Promise<void> {
    await this.client.delete(`${this.endpoint}/${id}`);
  }
}

// Usage examples
async function examples() {
  const api = new TypedApiClient('https://api.example.com');

  // Type-safe user fetching
  const user = await api.getUser(1);
  console.log(user.name); // TypeScript knows this is a string
  console.log(user.role); // TypeScript knows this is 'admin' | 'user' | 'guest'

  // Type-safe post creation
  const newPost = await api.createPost({
    title: 'My Post',
    body: 'Content here',
    authorId: 1
  });
  console.log(newPost.id); // TypeScript knows this is a number

  // Using repository pattern
  const client = new SmartFetch({ baseURL: 'https://api.example.com' });
  const userRepo = new Repository(client, '/users', UserSchema);
  const postRepo = new Repository(client, '/posts', PostSchema);

  const users = await userRepo.findAll();
  const post = await postRepo.findById(1);

  await postRepo.update(1, { title: 'Updated Title' });
  await userRepo.delete(999);
}

// Advanced error handling with type guards
import {
  SmartFetchError,
  NetworkError,
  ValidationError,
  TimeoutError
} from 'smart-fetch';

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

async function handleRequestWithTypes() {
  const client = new SmartFetch();

  try {
    const response = await client.get<User>('/api/user/1', {
      validateResponse: UserSchema
    });

    // response.data is fully typed as User
    console.log(response.data.email);

  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
    } else if (error instanceof TimeoutError) {
      console.error('Request timed out');
    } else if (isValidationError(error)) {
      console.error('Validation failed:', error.validationErrors);
    } else if (error instanceof SmartFetchError) {
      console.error('API error:', error.code, error.response?.status);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

// GraphQL with TypeScript
interface GraphQLUser {
  id: string;
  username: string;
  email: string;
  posts: {
    edges: Array<{
      node: {
        id: string;
        title: string;
      };
    }>;
  };
}

async function graphqlExample() {
  const client = new SmartFetch();

  const userData = await client.graphql<GraphQLUser>('/graphql', {
    query: `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          username
          email
          posts {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      }
    `,
    variables: { id: '123' }
  });

  // userData is fully typed as GraphQLUser
  console.log(userData.username);
  console.log(userData.posts.edges[0].node.title);
}

export { TypedApiClient, Repository, examples, handleRequestWithTypes, graphqlExample };
