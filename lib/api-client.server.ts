import "server-only";
import { auth } from "@clerk/nextjs/server";
import { fetchAPI } from "@/lib/api-client";

/**
 * Server component / route handler variant: resolves the Clerk JWT via
 * auth() on the server, never bundled into client code.
 */
export async function fetchAPIServer<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { getToken } = await auth();
  return fetchAPI<T>(path, options, getToken);
}
