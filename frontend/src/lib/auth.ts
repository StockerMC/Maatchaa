/**
 * Authentication utilities
 * Get current user and company information
 */

// TODO: Replace with your actual auth implementation
// This could be NextAuth, Supabase Auth, or custom auth

export function getCurrentUser() {
  // Example: Get from session, cookie, or context
  // For now, returning mock data - REPLACE THIS!

  return {
    id: 'user-123',
    email: 'user@example.com',
    companyId: process.env.NEXT_PUBLIC_DEMO_COMPANY_ID || 'bbcd5209-93ed-4b50-a25a-fe3d9c67a909',
    name: 'John Doe',
  };
}

export async function getCompanyId(): Promise<string> {
  const user = getCurrentUser();

  if (!user || !user.companyId) {
    throw new Error('No company ID found. User must be logged in.');
  }

  return user.companyId;
}

// Helper to get API URLs
export function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}${path}`;
}
