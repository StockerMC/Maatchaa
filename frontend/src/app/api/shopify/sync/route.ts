import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProducts } from '@/lib/shopify';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Sync a connected store's Shopify catalog into `company_products`.
 *
 * This ports the product-sync half of the Python backend's post-OAuth job to a
 * Next.js route so it runs on Vercel without the backend. It does NOT do creator
 * discovery / embeddings — that genuinely needs the long-running Python worker
 * (Cloud Run). Products are stored raw so the dashboard's Products page and the
 * reels matching have a catalog to work with.
 *
 * Called fire-and-forget from /api/shopify/callback after a successful connect,
 * and exposed directly so the dashboard's "Resync" can reuse it.
 *
 * Auth: requires the company to already have an active Shopify token row (i.e.
 * it has completed OAuth). The token is never accepted from the caller.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const companyId: string | undefined = body.company_id;

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    // Look up the store's stored OAuth token (server-side; service role).
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('shopify_oauth_tokens')
      .select('shop_domain, access_token, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokenRow) {
      return NextResponse.json(
        { error: 'No active Shopify connection for this company' },
        { status: 404 }
      );
    }

    const shopDomain: string = tokenRow.shop_domain;
    const accessToken: string = tokenRow.access_token;

    // Fetch the catalog from Shopify.
    let products;
    try {
      products = await getProducts(shopDomain, accessToken);
    } catch (e) {
      console.error('Shopify product fetch failed:', e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Failed to fetch products from Shopify' },
        { status: 502 }
      );
    }

    if (products.length === 0) {
      // Mark the attempt so the UI can show "synced, 0 products" rather than an error.
      await supabaseAdmin
        .from('shopify_oauth_tokens')
        .update({ products_synced: true, last_product_sync: new Date().toISOString(), product_count: 0 })
        .eq('company_id', companyId)
        .eq('shop_domain', shopDomain);
      return NextResponse.json({ success: true, synced: 0, message: 'No products found in store.' });
    }

    // Replace this company's catalog with the freshly fetched one so re-syncs
    // don't accumulate duplicates (no natural unique key on company_products).
    await supabaseAdmin.from('company_products').delete().eq('company_id', companyId);

    const rows = products.map((p) => ({
      company_id: companyId,
      shop_domain: shopDomain,
      title: p.title,
      description: p.description,
      image: p.image,
      price: p.price,
      synced_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin.from('company_products').insert(rows);
    if (insertError) {
      console.error('Error inserting products:', insertError);
      return NextResponse.json({ error: 'Failed to store products' }, { status: 500 });
    }

    // Record sync status on the token row.
    await supabaseAdmin
      .from('shopify_oauth_tokens')
      .update({
        products_synced: true,
        last_product_sync: new Date().toISOString(),
        product_count: rows.length,
      })
      .eq('company_id', companyId)
      .eq('shop_domain', shopDomain);

    // Flag the company as ingested so the rest of the app treats it as ready.
    await supabaseAdmin.from('companies').update({ ingested: true }).eq('company_id', companyId);

    return NextResponse.json({
      success: true,
      synced: rows.length,
      message: `Synced ${rows.length} products.`,
      note: 'Creator discovery/embeddings are handled separately by the sync service.',
    });
  } catch (error) {
    console.error('Error in Shopify sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
