import { QueryClient, type QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = res.statusText;
    try {
      text = await res.text();
    } catch (e) {
      // If we can't read the response text, use statusText
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      let text = res.statusText;
      try {
        text = await res.text();
      } catch (e) {
        // If we can't read the response text, use statusText
      }
      throw new Error(`${res.status}: ${text}`);
    }
    
    // Clone the response before trying to parse JSON
    const responseClone = res.clone();
    
    // Add better error handling for JSON parsing
    try {
      return await res.json();
    } catch (error) {
      // Get the response text for debugging
      let responseText = '';
      try {
        responseText = await responseClone.text();
      } catch (e) {
        responseText = 'Could not read response text';
      }
      throw new Error(`JSON.parse error: Response was not valid JSON. Status: ${res.status}. Response: ${responseText.substring(0, 200)}...`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
