import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = body.company_id;

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 });
    }

    // Deactivate token by setting is_active to false
    const { error } = await supabaseAdmin
      .from('shopify_oauth_tokens')
      .update({ is_active: false })
      .eq('company_id', companyId);

    if (error) {
      console.error('Error disconnecting Shopify:', error);
      return NextResponse.json({ error: 'Failed to disconnect Shopify' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Shopify store disconnected successfully',
    });
  } catch (error) {
    console.error('Error in disconnect endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
