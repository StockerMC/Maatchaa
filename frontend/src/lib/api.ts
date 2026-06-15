const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

// Max time to wait on the (optional) external backend before falling back to the
// local Next.js API route. Without this, a backend that accepts the connection
// but never responds (e.g. a cold/hung Cloud Run instance) would hang the caller
// forever instead of degrading gracefully.
const BACKEND_TIMEOUT_MS = 8000;

export async function fetchWithFallback(
  backendPath: string,
  fallbackPath: string,
  options?: RequestInit
): Promise<Response> {
  if (BACKEND_URL) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
    try {
      const response = await fetch(`${BACKEND_URL}${backendPath}`, {
        ...options,
        signal: controller.signal,
      });
      if (response.status < 500) return response;
    } catch {
      // Network error, timeout, or abort — fall through to local API.
    } finally {
      clearTimeout(timeout);
    }
  }
  return fetch(fallbackPath, options);
}
