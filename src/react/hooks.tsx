import { useState, useEffect, useCallback, useRef } from 'react';
import { SmartFetch } from '../core/SmartFetch';
import { RequestConfig, SmartFetchResponse } from '../types';

export interface UseFetchOptions<T> extends Partial<RequestConfig> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  initialData?: T;
}

export interface UseFetchResult<T> {
  data: T | undefined;
  error: any;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

export function useFetch<T = any>(
  url: string,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    onSuccess,
    onError,
    initialData,
    ...requestConfig
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const clientRef = useRef<SmartFetch>(new SmartFetch());
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController>();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsFetching(true);
    setError(null);

    try {
      const response = await clientRef.current.request<T>({
        url,
        method: 'GET',
        ...requestConfig,
        signal: abortControllerRef.current.signal,
      });

      if (mountedRef.current) {
        setData(response.data);
        setIsLoading(false);
        setIsFetching(false);
        onSuccess?.(response.data);
      }
    } catch (err) {
      if (mountedRef.current && err.name !== 'AbortError') {
        setError(err);
        setIsLoading(false);
        setIsFetching(false);
        onError?.(err);
      }
    }
  }, [url, enabled, JSON.stringify(requestConfig)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, fetchData]);

  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => fetchData();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, enabled, fetchData]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    isFetching,
    isError: !!error,
    isSuccess: !!data && !error,
    refetch: fetchData,
  };
}

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: any, variables: TVariables) => void;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: any;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<SmartFetchResponse<TData>>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await mutationFn(variables);
        setData(response.data);
        setIsLoading(false);
        options.onSuccess?.(response.data, variables);
        options.onSettled?.(response.data, null, variables);
        return response.data;
      } catch (err) {
        setError(err);
        setIsLoading(false);
        options.onError?.(err, variables);
        options.onSettled?.(undefined, err, variables);
        throw err;
      }
    },
    [mutationFn, options]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error is already handled in mutateAsync
      });
      return mutateAsync(variables);
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading,
    isError: !!error,
    isSuccess: !!data && !error,
    reset,
  };
}

export interface UseInfiniteQueryOptions<T> extends Partial<RequestConfig> {
  enabled?: boolean;
  getNextPageParam: (lastPage: T, allPages: T[]) => any;
  getPreviousPageParam?: (firstPage: T, allPages: T[]) => any;
  onSuccess?: (data: T[]) => void;
  onError?: (error: any) => void;
}

export interface UseInfiniteQueryResult<T> {
  data: T[];
  error: any;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInfiniteQuery<T = any>(
  url: string,
  options: UseInfiniteQueryOptions<T>
): UseInfiniteQueryResult<T> {
  const {
    enabled = true,
    getNextPageParam,
    getPreviousPageParam,
    onSuccess,
    onError,
    ...requestConfig
  } = options;

  const [pages, setPages] = useState<T[]>([]);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const clientRef = useRef<SmartFetch>(new SmartFetch());
  const mountedRef = useRef(true);
  const nextPageParamRef = useRef<any>(null);
  const previousPageParamRef = useRef<any>(null);

  const fetchPage = useCallback(
    async (pageParam: any = null, direction: 'next' | 'previous' | 'initial' = 'initial') => {
      setIsFetching(true);
      setError(null);

      try {
        const response = await clientRef.current.request<T>({
          url,
          method: 'GET',
          ...requestConfig,
          params: {
            ...requestConfig.params,
            ...(pageParam && { cursor: pageParam }),
          },
        });

        if (mountedRef.current) {
          if (direction === 'next') {
            setPages((prev) => [...prev, response.data]);
            nextPageParamRef.current = getNextPageParam(response.data, [...pages, response.data]);
          } else if (direction === 'previous') {
            setPages((prev) => [response.data, ...prev]);
            if (getPreviousPageParam) {
              previousPageParamRef.current = getPreviousPageParam(response.data, [
                response.data,
                ...pages,
              ]);
            }
          } else {
            setPages([response.data]);
            nextPageParamRef.current = getNextPageParam(response.data, [response.data]);
            if (getPreviousPageParam) {
              previousPageParamRef.current = getPreviousPageParam(response.data, [response.data]);
            }
          }

          setIsLoading(false);
          setIsFetching(false);
          onSuccess?.(pages);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
          setIsLoading(false);
          setIsFetching(false);
          onError?.(err);
        }
      }
    },
    [url, getNextPageParam, getPreviousPageParam, JSON.stringify(requestConfig), pages]
  );

  const fetchNextPage = useCallback(async () => {
    if (nextPageParamRef.current) {
      await fetchPage(nextPageParamRef.current, 'next');
    }
  }, [fetchPage]);

  const fetchPreviousPage = useCallback(async () => {
    if (previousPageParamRef.current) {
      await fetchPage(previousPageParamRef.current, 'previous');
    }
  }, [fetchPage]);

  const refetch = useCallback(async () => {
    setPages([]);
    await fetchPage(null, 'initial');
  }, [fetchPage]);

  useEffect(() => {
    if (enabled) {
      fetchPage();
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data: pages,
    error,
    isLoading,
    isFetching,
    isError: !!error,
    isSuccess: pages.length > 0 && !error,
    hasNextPage: nextPageParamRef.current !== null && nextPageParamRef.current !== undefined,
    hasPreviousPage:
      previousPageParamRef.current !== null && previousPageParamRef.current !== undefined,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
  };
}
