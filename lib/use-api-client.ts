"use client";

import { useAuth } from "@clerk/nextjs";
import { fetchAPI } from "@/lib/api-client";

/**
 * Client component hook: binds fetchAPI to the token from useAuth(), so
 * components don't have to thread getToken through themselves.
 */
export function useApiClient() {
  const { getToken } = useAuth();

  return function fetchAPIClient<T = unknown>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    return fetchAPI<T>(path, options, getToken);
  };
}
