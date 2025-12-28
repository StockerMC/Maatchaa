import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createShopifyDiscount } from '@/lib/shopify';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnershipId } = await params;

    if (!partnershipId) {
      return NextResponse.json({ error: 'Partnership ID is required' }, { status: 400 });
    }

    const body = await req.json();

    // Get partnership
    const { data: partnership, error: partnershipError } = await supabaseAdmin
      .from('partnerships')
      .select('*')
      .eq('id', partnershipId)
      .single();

    if (partnershipError || !partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    // Get shop domain
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shopify_shops')
      .select('shop_domain, myshopify_domain')
      .eq('company_id', partnership.company_id)
      .single();

    if (shopError || !shopData) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopDomain = shopData.shop_domain || shopData.myshopify_domain;

    // Generate affiliate link
    let creatorHandle = partnership.creator_handle || '';
    if (creatorHandle) {
      creatorHandle = creatorHandle.replace('@', '').toLowerCase();
    }

    if (!creatorHandle) {
      creatorHandle = (partnership.creator_name || 'creator').toLowerCase().replace(/\s+/g, '');
    }

    const affiliateLink = `https://${shopDomain}/ref/${creatorHandle}?pid=${partnershipId}`;

    // Optionally create Shopify discount code
    let discountCode: string | null = null;
    if (body.create_discount) {
      // Get access token
      const { data: tokenData } = await supabaseAdmin
        .from('shopify_oauth_tokens')
        .select('access_token')
        .eq('company_id', partnership.company_id)
        .eq('is_active', true)
        .single();

      if (tokenData?.access_token) {
        const discountAmount = body.discount_amount || 10;
        const discountType = body.discount_type || 'percentage';
        discountCode = `${creatorHandle.toUpperCase()}${discountAmount}`;

        const created = await createShopifyDiscount(
          shopData.myshopify_domain || shopDomain,
          tokenData.access_token,
          discountCode,
          discountAmount,
          discountType as 'percentage' | 'fixed_amount'
        );

        if (!created) {
          discountCode = null; // Failed to create
        }
      }
    }

    // Update partnership
    const updateData: Record<string, unknown> = {
      affiliate_link: affiliateLink,
      affiliate_link_generated: true,
      commission_rate: body.commission_rate || 10,
      updated_at: new Date().toISOString(),
    };

    if (discountCode) {
      updateData.discount_code = discountCode;
    }

    const { data: updatedPartnership, error: updateError } = await supabaseAdmin
      .from('partnerships')
      .update(updateData)
      .eq('id', partnershipId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating partnership:', updateError);
      return NextResponse.json({ error: 'Failed to update partnership' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Affiliate link generated successfully',
      partnership: updatedPartnership,
      affiliate_link: affiliateLink,
      discount_code: discountCode,
    });
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
