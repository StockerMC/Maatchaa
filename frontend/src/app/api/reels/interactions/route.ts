import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const interactionType = searchParams.get('interaction_type');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id parameter' }, { status: 400 });
    }

    // Build query
    let query = supabaseAdmin
      .from('reel_interactions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Optional type filter
    if (interactionType) {
      query = query.eq('interaction_type', interactionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reel interactions:', error);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }

    return NextResponse.json({
      interactions: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in reel interactions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }
    if (!body.video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }
    if (!body.interaction_type) {
      return NextResponse.json({ error: 'interaction_type is required' }, { status: 400 });
    }

    // Validate interaction type
    const validTypes = ['dismissed', 'partnered'];
    if (!validTypes.includes(body.interaction_type)) {
      return NextResponse.json(
        { error: `interaction_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert interaction (update if exists, insert if new)
    const interactionData = {
      company_id: body.company_id,
      video_id: body.video_id,
      interaction_type: body.interaction_type,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('reel_interactions')
      .upsert(interactionData, { onConflict: 'company_id,video_id' })
      .select()
      .single();

    if (error) {
      console.error('Error recording reel interaction:', error);
      return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Interaction recorded successfully',
      interaction: data,
    });
  } catch (error) {
    console.error('Error in reel interactions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
