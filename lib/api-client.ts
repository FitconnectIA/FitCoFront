type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type TokenGetter = () => Promise<string | null>;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Isomorphic API fetch core. Carries no Clerk import so it's safe to bundle
 * for both server and client — callers supply the token getter:
 * see lib/api-client.server.ts (server components) and
 * lib/use-api-client.ts (client components).
 */
export async function fetchAPI<T = unknown>(
  path: string,
  options: RequestInit = {},
  tokenGetter: TokenGetter,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  const token = await tokenGetter();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? "unknown_error",
      errorBody?.error?.message ?? response.statusText,
    );
  }

  return body as T;
}
