import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');

    // Build query
    let query = supabaseAdmin
      .from('shopify_shops')
      .select('*');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      return NextResponse.json({ error: 'No shop found' }, { status: 404 });
    }

    // Return relevant shop info
    return NextResponse.json({
      shop_name: data.shop_name,
      shop_owner: data.shop_owner,
      shop_domain: data.shop_domain,
      email: data.email,
      logo_url: data.logo_url,
      myshopify_domain: data.myshopify_domain,
      plan_display_name: data.plan_display_name,
    });
  } catch (error) {
    console.error('Error getting shop info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
