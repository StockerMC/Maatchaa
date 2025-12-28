import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const shopName = searchParams.get('shop_name'); // Legacy support

    // Support both company_id and shop_name parameters
    if (!companyId && !shopName) {
      return NextResponse.json(
        { error: 'Missing company_id or shop_name parameter' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('company_products')
      .select('*')
      .order('synced_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      products: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in products endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
