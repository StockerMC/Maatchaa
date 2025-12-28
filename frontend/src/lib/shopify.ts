import crypto from 'crypto';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || '';
const SHOPIFY_SCOPES = 'read_products,write_products,read_orders,write_orders,read_price_rules,write_price_rules,read_discounts,write_discounts';

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function validateShopDomain(shop: string): boolean {
  const cleanShop = shop.replace('https://', '').replace('http://', '');

  if (!cleanShop.endsWith('.myshopify.com')) {
    return false;
  }

  const subdomain = cleanShop.replace('.myshopify.com', '');

  if (!subdomain || subdomain[0] === '-' || subdomain[subdomain.length - 1] === '-') {
    return false;
  }

  return /^[a-zA-Z0-9-]+$/.test(subdomain);
}

export function cleanShopDomain(shop: string): string {
  let cleanShop = shop.replace('https://', '').replace('http://', '').replace(/\/$/, '');

  // Handle admin URL format
  if (cleanShop.includes('admin.shopify.com/store/')) {
    cleanShop = cleanShop.split('admin.shopify.com/store/')[1].split('/')[0];
  }

  cleanShop = cleanShop.replace('.myshopify.com', '');

  return `${cleanShop}.myshopify.com`;
}

export function verifyHmac(queryParams: Record<string, string>, hmacToVerify: string): boolean {
  if (!SHOPIFY_API_SECRET) {
    throw new Error('SHOPIFY_API_SECRET not configured');
  }

  const sortedParams = Object.keys(queryParams)
    .filter(key => key !== 'hmac')
    .sort()
    .map(key => `${key}=${queryParams[key]}`)
    .join('&');

  const calculatedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac, 'hex'),
    Buffer.from(hmacToVerify, 'hex')
  );
}

export function verifyShopifyRequest(queryParams: Record<string, string>): boolean {
  const hmac = queryParams.hmac;
  if (!hmac) return false;

  try {
    return verifyHmac(queryParams, hmac);
  } catch {
    return false;
  }
}

export function buildInstallUrl(shop: string, state: string): string {
  if (!SHOPIFY_API_KEY || !SHOPIFY_REDIRECT_URI) {
    throw new Error('Missing Shopify configuration');
  }

  const cleanShop = shop.replace('https://', '').replace('http://', '');
  const shopDomain = cleanShop.endsWith('.myshopify.com') ? cleanShop : `${cleanShop}.myshopify.com`;

  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: SHOPIFY_REDIRECT_URI,
    state: state,
  });

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(shop: string, code: string): Promise<{ access_token: string; scope: string }> {
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    throw new Error('Missing Shopify API credentials');
  }

  let shopDomain = shop.replace('https://', '').replace('http://', '');
  if (!shopDomain.endsWith('.myshopify.com')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }

  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code: code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function getShopInfo(shop: string, accessToken: string): Promise<Record<string, unknown>> {
  let shopDomain = shop.replace('https://', '').replace('http://', '');
  if (!shopDomain.endsWith('.myshopify.com')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }

  const response = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shop info');
  }

  const data = await response.json();
  return data.shop;
}

export async function createShopifyDiscount(
  shop: string,
  accessToken: string,
  code: string,
  value: number,
  valueType: 'percentage' | 'fixed_amount' = 'percentage'
): Promise<boolean> {
  let shopDomain = shop.replace('https://', '').replace('http://', '');
  if (!shopDomain.endsWith('.myshopify.com')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }

  const baseUrl = `https://${shopDomain}/admin/api/2024-01`;

  try {
    // Create price rule first
    const priceRuleResponse = await fetch(`${baseUrl}/price_rules.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_rule: {
          title: `Creator Discount: ${code}`,
          target_type: 'line_item',
          target_selection: 'all',
          allocation_method: 'across',
          value_type: valueType,
          value: `-${value}`,
          customer_selection: 'all',
          starts_at: new Date().toISOString(),
        },
      }),
    });

    if (!priceRuleResponse.ok) {
      console.error('Failed to create price rule:', await priceRuleResponse.text());
      return false;
    }

    const priceRuleData = await priceRuleResponse.json();
    const priceRuleId = priceRuleData.price_rule.id;

    // Create discount code
    const discountResponse = await fetch(`${baseUrl}/price_rules/${priceRuleId}/discount_codes.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discount_code: { code },
      }),
    });

    if (!discountResponse.ok) {
      console.error('Failed to create discount code:', await discountResponse.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating Shopify discount:', error);
    return false;
  }
}
