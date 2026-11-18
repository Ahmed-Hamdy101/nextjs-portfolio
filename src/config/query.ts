import { QueryClient } from "@tanstack/react-query";

/**
 * Shared client for the TanStack Query provider.
 *
 * The catalog is compile-time data, so queries here are mutations only; the
 * defaults keep one-off form submissions from retrying or refetching on focus.
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60_000,
                gcTime: 5 * 60_000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: 0,
            },
        },
    });
}
