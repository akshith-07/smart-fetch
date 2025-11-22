import React from 'react';
import { useFetch, useMutation, useInfiniteQuery } from 'smart-fetch';
import { smartFetch } from 'smart-fetch';

// Example 1: useFetch hook
function UserList() {
  const { data, error, isLoading, refetch } = useFetch<User[]>(
    'https://jsonplaceholder.typicode.com/users',
    {
      cache: { strategy: 'memory', ttl: 60000 },
      refetchOnWindowFocus: true,
      onSuccess: (data) => console.log('Users loaded:', data.length),
      onError: (error) => console.error('Failed to load users:', error)
    }
  );

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Users</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Example 2: useMutation hook
function CreatePost() {
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');

  const { mutate, data, isLoading, error, isSuccess } = useMutation<Post, NewPost>(
    (newPost) => smartFetch.post('https://jsonplaceholder.typicode.com/posts', newPost),
    {
      onSuccess: (data) => {
        console.log('Post created:', data);
        setTitle('');
        setBody('');
      },
      onError: (error) => {
        console.error('Failed to create post:', error);
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ title, body, userId: 1 });
  };

  return (
    <div>
      <h2>Create Post</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      {isSuccess && <div style={{ color: 'green' }}>Post created successfully!</div>}
    </div>
  );
}

// Example 3: useInfiniteQuery hook
function PostsList() {
  const {
    data,
    error,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery<PostsPage>(
    'https://jsonplaceholder.typicode.com/posts',
    {
      getNextPageParam: (lastPage, allPages) => {
        // Simulate pagination (JSONPlaceholder doesn't support it)
        if (allPages.length < 3) {
          return allPages.length + 1;
        }
        return null;
      },
      cache: { strategy: 'memory' }
    }
  );

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Infinite Posts</h2>
      {data.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.items?.map((post) => (
            <article key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
            </article>
          ))}
        </div>
      ))}
      {hasNextPage && (
        <button onClick={fetchNextPage} disabled={isFetching}>
          {isFetching ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

// Main App component
export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Smart Fetch React Examples</h1>
      <UserList />
      <hr />
      <CreatePost />
      <hr />
      <PostsList />
    </div>
  );
}

// TypeScript interfaces
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface NewPost {
  title: string;
  body: string;
  userId: number;
}

interface PostsPage {
  items: Post[];
  nextCursor?: number;
}
