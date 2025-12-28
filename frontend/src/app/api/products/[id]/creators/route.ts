import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { queryByText } from '@/lib/vectordb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get pre-matched creators from background worker results
    const { data: preMatches, error: matchError } = await supabaseAdmin
      .from('product_creator_matches')
      .select(`
        *,
        creator_videos (*)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (matchError) {
      console.error('Error fetching creator matches:', matchError);
    }

    const preMatchedCreators = (preMatches || []).map((match) => ({
      id: match.id,
      video_id: match.video_id,
      product_id: match.product_id,
      match_score: match.match_score,
      created_at: match.created_at,
      video: match.creator_videos,
      source: 'pre_computed',
    }));

    // Also do real-time vector search for fresh matches
    const { data: product } = await supabaseAdmin
      .from('company_products')
      .select('title, description, pinecone_id')
      .eq('id', productId)
      .single();

    let vectorMatches: Array<{
      id: string;
      video_id: string;
      product_id: string;
      match_score: number;
      video: unknown;
      source: string;
    }> = [];

    if (product) {
      try {
        // Search using product title + description
        const searchText = `${product.title} ${product.description || ''}`.slice(0, 500);
        const vectorResults = await queryByText(searchText, 20);

        // Get video details for vector matches
        const videoIds = vectorResults.matches.map((m) => m.metadata.video_id).filter(Boolean);

        if (videoIds.length > 0) {
          const { data: videos } = await supabaseAdmin
            .from('creator_videos')
            .select('*')
            .in('video_id', videoIds);

          vectorMatches = vectorResults.matches
            .map((match) => {
              const video = videos?.find((v) => v.video_id === match.metadata.video_id);
              return video
                ? {
                    id: `vector_${match.id}`,
                    video_id: match.metadata.video_id as string,
                    product_id: productId,
                    match_score: match.score,
                    video,
                    source: 'real_time_vector_search',
                  }
                : null;
            })
            .filter((m) => m !== null) as typeof vectorMatches;
        }
      } catch (vectorError) {
        console.error('Vector search failed:', vectorError);
        // Continue without vector results
      }
    }

    // Combine and deduplicate results
    const allCreators = [...preMatchedCreators, ...vectorMatches];
    const uniqueCreators = allCreators.filter(
      (creator, index, self) =>
        index === self.findIndex((c) => c.video_id === creator.video_id)
    );

    return NextResponse.json({
      creators: uniqueCreators.slice(0, limit),
      count: uniqueCreators.length,
      pre_computed_count: preMatchedCreators.length,
      vector_search_count: vectorMatches.length,
    });
  } catch (error) {
    console.error('Error fetching product creators:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
