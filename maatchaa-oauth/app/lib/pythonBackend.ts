/**
 * Python Backend Client
 * Connects Shopify app to Maatchaa's AI backend
 */

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export class PythonBackendClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = PYTHON_BACKEND_URL;
  }

  /**
   * Sync Shopify products to vector database for AI matching
   */
  async syncProducts(companyId: string, shopDomain: string, products: any[]) {
    const response = await fetch(`${this.baseUrl}/shopify/products/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        shop_domain: shopDomain,
        products,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync products: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Store Shopify OAuth token in backend database
   */
  async storeShopifyConnection(companyId: string, shopDomain: string, accessToken: string) {
    const response = await fetch(`${this.baseUrl}/shopify/connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        shop_domain: shopDomain,
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to store connection: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get AI creator matches for products
   */
  async getCreatorMatches(productId: string, topK: number = 10) {
    const response = await fetch(`${this.baseUrl}/matches/product/${productId}?top_k=${topK}`);

    if (!response.ok) {
      throw new Error(`Failed to get matches: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'unavailable', error: String(error) };
    }
  }
}

// Export singleton instance
export const pythonBackend = new PythonBackendClient();
