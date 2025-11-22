import { GraphQLRequest, GraphQLResponse, RequestConfig } from '../types';
import { GraphQLError as GraphQLFetchError } from '../errors';

export class GraphQLClient {
  private endpoint: string;
  private defaultHeaders: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  buildRequest(request: GraphQLRequest): RequestConfig {
    return {
      url: this.endpoint,
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({
        query: request.query,
        variables: request.variables,
        operationName: request.operationName,
      }),
    };
  }

  parseResponse<T>(data: any, config: RequestConfig): GraphQLResponse<T> {
    const response = data as GraphQLResponse<T>;

    if (response.errors && response.errors.length > 0) {
      throw new GraphQLFetchError(
        'GraphQL request returned errors',
        config,
        response.errors
      );
    }

    return response;
  }

  createQuery(query: string, variables?: Record<string, any>, operationName?: string): GraphQLRequest {
    return {
      query,
      variables,
      operationName,
    };
  }

  createMutation(mutation: string, variables?: Record<string, any>, operationName?: string): GraphQLRequest {
    return {
      query: mutation,
      variables,
      operationName,
    };
  }
}

export function isGraphQLRequest(config: RequestConfig): boolean {
  try {
    if (config.method !== 'POST') return false;
    const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    return 'query' in body;
  } catch {
    return false;
  }
}
