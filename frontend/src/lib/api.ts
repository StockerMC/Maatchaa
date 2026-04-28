const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWithFallback(
  backendPath: string,
  fallbackPath: string,
  options?: RequestInit
): Promise<Response> {
  if (BACKEND_URL) {
    try {
      const response = await fetch(`${BACKEND_URL}${backendPath}`, options);
      if (response.status < 500) return response;
    } catch {
      // Network error — fall through to local API
    }
  }
  return fetch(fallbackPath, options);
}
