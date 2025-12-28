import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendPartnershipEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnershipId } = await params;
    const body = await req.json();

    if (!partnershipId) {
      return NextResponse.json({ error: 'Partnership ID is required' }, { status: 400 });
    }

    // Get partnership
    const { data: partnership, error: partnershipError } = await supabaseAdmin
      .from('partnerships')
      .select('*')
      .eq('id', partnershipId)
      .single();

    if (partnershipError || !partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    // Get email (from request body or partnership record)
    const toEmail = body.to_email || partnership.creator_email;
    if (!toEmail) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Get shop info
    const { data: shop } = await supabaseAdmin
      .from('shopify_shops')
      .select('shop_name')
      .eq('company_id', partnership.company_id)
      .single();

    const shopName = shop?.shop_name || 'Our Brand';

    // Generate partnership URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const partnershipUrl = `${appUrl}/partnership/${partnershipId}`;

    // Send email
    const { success, message } = await sendPartnershipEmail(
      toEmail,
      partnership.creator_name,
      shopName,
      partnership.matched_products || [],
      body.custom_message,
      partnershipUrl
    );

    if (!success) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Update partnership record if requested (default: true)
    if (body.save_email !== false) {
      const updateData: Record<string, unknown> = {
        email_sent: true,
        last_contact_date: new Date().toISOString(),
        status: 'contacted',
        contacted_at: new Date().toISOString(),
      };

      // Save email if it was provided and different
      if (body.to_email && body.to_email !== partnership.creator_email) {
        updateData.creator_email = body.to_email;
      }

      // Save custom message as draft if provided
      if (body.custom_message) {
        updateData.email_draft = body.custom_message;
      }

      await supabaseAdmin.from('partnerships').update(updateData).eq('id', partnershipId);
    }

    return NextResponse.json({
      message: 'Email sent successfully',
      to: toEmail,
    });
  } catch (error) {
    console.error('Error sending partnership email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
