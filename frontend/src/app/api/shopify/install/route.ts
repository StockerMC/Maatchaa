import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateNonce, validateShopDomain, cleanShopDomain, buildInstallUrl } from '@/lib/shopify';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    const companyId = searchParams.get('company_id');

    if (!shop) {
      return NextResponse.json({ error: "Missing 'shop' parameter" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: "Missing 'company_id' parameter" }, { status: 400 });
    }

    // Clean and validate shop domain
    const cleanedShop = cleanShopDomain(shop);

    if (!validateShopDomain(cleanedShop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Generate random state for CSRF protection
    const state = generateNonce();

    // Store state in database for verification
    const { error: stateError } = await supabaseAdmin
      .from('shopify_oauth_states')
      .insert({
        state,
        company_id: companyId,
        shop_domain: cleanedShop,
      });

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
    }

    // Build OAuth authorization URL
    const redirectUrl = buildInstallUrl(cleanedShop, state);

    return NextResponse.json({ redirect_url: redirectUrl });
  } catch (error) {
    console.error('Error in Shopify install:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
