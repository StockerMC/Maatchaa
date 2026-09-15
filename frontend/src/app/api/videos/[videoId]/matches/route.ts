import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// company_products is not readable with the publishable key, so this join has to run
// server-side with the secret key. Clients used to do it directly and silently got nulls.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  const limitParam = Number(new URL(req.url).searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;

  try {
    const { data, error } = await supabaseAdmin
      .from('product_creator_matches')
      .select('*, company_products ( id, title, image, price )')
      .eq('video_id', videoId)
      .limit(limit);

    if (error) throw error;

    const products = (data ?? [])
      .map((match) => match.company_products)
      .filter((p): p is { id: string; title: string; image: string; price: number } => Boolean(p))
      .map((p) => ({ id: p.id, title: p.title, name: p.title, image: p.image, price: p.price }));

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Error fetching matched products:', err);
    return NextResponse.json({ error: 'Failed to fetch matched products' }, { status: 500 });
  }
}
