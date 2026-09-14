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

    const products = data || [];
    const matchCounts = new Map<string, number>();

    if (products.length > 0) {
      const { data: matches, error: matchesError } = await supabaseAdmin
        .from('product_creator_matches')
        .select('product_id')
        .in('product_id', products.map((p) => p.id));

      if (matchesError) {
        console.error('Error fetching product match counts:', matchesError);
      } else {
        for (const m of matches || []) {
          matchCounts.set(m.product_id, (matchCounts.get(m.product_id) || 0) + 1);
        }
      }
    }

    return NextResponse.json({
      products: products.map((p) => ({ ...p, match_count: matchCounts.get(p.id) || 0 })),
      count: products.length,
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
