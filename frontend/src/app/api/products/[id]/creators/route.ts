import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isCreatorVideoMatch, queryByText } from '@/lib/vectordb';
import { candidatePool, rerankDocuments, rerankTopN } from '@/lib/rerank';
import { rerankServingEnabled } from '@/lib/featureFlags';
import { NextRequest, NextResponse } from 'next/server';

type CreatorVideoRow = {
  video_id?: string;
  title?: string;
  channel_title?: string;
  description?: string;
  [key: string]: unknown;
};

type CreatorEntry = {
  id: string;
  video_id: string;
  product_id: string;
  match_score: number;
  created_at?: string;
  video: CreatorVideoRow | null;
  source: string;
  relevance_score?: number;
};

// Text a creator video is reranked on.
function creatorDocumentText(entry: CreatorEntry): string {
  const video = entry.video || {};
  return [video.title || '', video.channel_title || '', (video.description || '').slice(0, 500)]
    .filter(Boolean)
    .join(' ')
    .trim() || entry.video_id;
}

// Score pre-computed and vector candidates in one rerank pass. One pass means
// both sources get scores on the same scale, which the hand-written keyword
// scores and Pinecone similarities are not.
async function rankCreators(
  query: string,
  creators: CreatorEntry[],
  keep: number
): Promise<{ creators: CreatorEntry[]; ranking: string }> {
  const ranked = await rerankDocuments(query, creators.map(creatorDocumentText), keep);

  if (!ranked) {
    const byScore = (a: CreatorEntry, b: CreatorEntry) => (b.match_score || 0) - (a.match_score || 0);
    const preComputed = creators.filter((c) => c.source === 'pre_computed').sort(byScore);
    const vector = creators.filter((c) => c.source !== 'pre_computed').sort(byScore);
    return { creators: [...preComputed, ...vector].slice(0, keep), ranking: 'similarity' };
  }

  return {
    creators: ranked.map(({ index, relevanceScore }) => ({
      ...creators[index],
      relevance_score: relevanceScore,
    })),
    ranking: 'rerank',
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const rerankEnabled = rerankServingEnabled();

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

    const preMatchedCreators: CreatorEntry[] = (preMatches || []).map((match) => ({
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

    let vectorMatches: CreatorEntry[] = [];
    let searchText = '';

    if (product) {
      try {
        // Search using product title + description
        searchText = `${product.title} ${product.description || ''}`.slice(0, 500);
        const vectorResults = await queryByText(searchText, rerankEnabled ? candidatePool() : 20);

        const candidates = rerankEnabled
          ? vectorResults.matches.filter((m) => isCreatorVideoMatch(m.metadata))
          : vectorResults.matches;

        // Get video details for vector matches
        const videoIds = candidates.map((m) => m.metadata.video_id).filter(Boolean);

        if (videoIds.length > 0) {
          const { data: videos } = await supabaseAdmin
            .from('creator_videos')
            .select('*')
            .in('video_id', videoIds);

          vectorMatches = candidates
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
            .filter((m) => m !== null) as CreatorEntry[];
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

    if (!rerankEnabled) {
      return NextResponse.json({
        creators: uniqueCreators.slice(0, limit),
        count: uniqueCreators.length,
        pre_computed_count: preMatchedCreators.length,
        vector_search_count: vectorMatches.length,
      });
    }

    const { creators, ranking } = await rankCreators(
      searchText,
      uniqueCreators,
      Math.min(limit, rerankTopN())
    );

    return NextResponse.json({
      creators,
      // The reels UI reads `matches` with a nested `creator_videos`, the shape
      // the Python endpoint returns. Emitting it here is what puts the ranked
      // order in front of the user.
      matches: creators.map((creator) => ({ ...creator, creator_videos: creator.video })),
      count: creators.length,
      pre_computed_count: preMatchedCreators.length,
      vector_search_count: vectorMatches.length,
      ranking,
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
