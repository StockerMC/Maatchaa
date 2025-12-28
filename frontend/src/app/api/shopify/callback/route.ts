import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyShopifyRequest, exchangeCodeForToken, getShopInfo } from '@/lib/shopify';
import { NextRequest, NextResponse } from 'next/server';

const FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const code = searchParams.get('code');
    const hmac = searchParams.get('hmac');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const timestamp = searchParams.get('timestamp');

    // Validate required parameters
    if (!code || !hmac || !shop || !state) {
      return NextResponse.redirect(`${FRONTEND_URL}/get-started?error=missing_params`);
    }

    // Build query params object for HMAC verification
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Verify HMAC signature
    if (!verifyShopifyRequest(queryParams)) {
      return NextResponse.redirect(`${FRONTEND_URL}/get-started?error=invalid_hmac`);
    }

    // Verify and retrieve state from database
    const { data: stateRecord, error: stateError } = await supabaseAdmin
      .from('shopify_oauth_states')
      .select('*')
      .eq('state', state)
      .eq('used', false)
      .single();

    if (stateError || !stateRecord) {
      return NextResponse.redirect(`${FRONTEND_URL}/get-started?error=invalid_state`);
    }

    const companyId = stateRecord.company_id;

    // Mark state as used
    await supabaseAdmin
      .from('shopify_oauth_states')
      .update({ used: true })
      .eq('state', state);

    // Exchange authorization code for access token
    let tokenData;
    try {
      tokenData = await exchangeCodeForToken(shop, code);
    } catch (error) {
      console.error('Token exchange failed:', error);
      return NextResponse.redirect(`${FRONTEND_URL}/get-started?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    // Get shop information
    let shopInfo;
    try {
      shopInfo = await getShopInfo(shop, accessToken);
    } catch (error) {
      console.error('Failed to get shop info:', error);
      shopInfo = { name: shop, email: null };
    }

    // Deactivate any existing tokens for this company
    await supabaseAdmin
      .from('shopify_oauth_tokens')
      .update({ is_active: false })
      .eq('company_id', companyId);

    // Store access token
    const { error: tokenError } = await supabaseAdmin
      .from('shopify_oauth_tokens')
      .insert({
        company_id: companyId,
        shop_domain: shop,
        access_token: accessToken,
        scope: scope,
        is_active: true,
      });

    if (tokenError) {
      console.error('Error storing token:', tokenError);
      return NextResponse.redirect(`${FRONTEND_URL}/get-started?error=token_storage_failed`);
    }

    // Store/update shop information
    const shopData = {
      company_id: companyId,
      shop_domain: (shopInfo as Record<string, unknown>).domain || shop,
      myshopify_domain: shop,
      shop_name: (shopInfo as Record<string, unknown>).name || shop,
      shop_owner: (shopInfo as Record<string, unknown>).shop_owner || null,
      email: (shopInfo as Record<string, unknown>).email || null,
      plan_display_name: (shopInfo as Record<string, unknown>).plan_display_name || null,
      updated_at: new Date().toISOString(),
    };

    const { error: shopError } = await supabaseAdmin
      .from('shopify_shops')
      .upsert(shopData, { onConflict: 'company_id' });

    if (shopError) {
      console.error('Error storing shop info:', shopError);
    }

    // Redirect to dashboard with success
    return NextResponse.redirect(`${FRONTEND_URL}/dashboard?shopify=connected&company_id=${companyId}`);
  } catch (error) {
    console.error('Error in Shopify callback:', error);
    return NextResponse.redirect(`${FRONTEND_URL}/get-started?error=callback_failed`);
  }
}
