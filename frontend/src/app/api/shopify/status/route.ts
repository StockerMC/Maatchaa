import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id parameter' }, { status: 400 });
    }

    // Get active token for company
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('shopify_oauth_tokens')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({
        connected: false,
        shop: null,
      });
    }

    const shopDomain = tokenData.shop_domain;

    // Get shop info separately
    const { data: shopData } = await supabaseAdmin
      .from('shopify_shops')
      .select('*')
      .eq('shop_domain', shopDomain)
      .single();

    return NextResponse.json({
      connected: true,
      shop: {
        domain: shopDomain,
        name: shopData?.shop_name || null,
        email: shopData?.email || null,
        plan: shopData?.plan_display_name || null,
        last_synced_at: shopData?.last_synced_at || null,
      },
    });
  } catch (error) {
    console.error('Error checking Shopify status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
