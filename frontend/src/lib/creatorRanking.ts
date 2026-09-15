/**
 * Ordering for the creator list served by /api/products/[id]/creators.
 * Mirrors backend/utils/creator_ranking.py.
 *
 * Two candidate sources with incomparable scores: pre-computed rows from
 * product_creator_matches carry the keyword scorer's 0-10 `relevance_score`,
 * vector rows carry a Pinecone cosine score. The rerank path rescores both in
 * one pass and writes the Cohere 0-1 score to `rerank_score`, so
 * `relevance_score` keeps meaning what the database says it means.
 *
 * Pure and dependency-free so it can be exercised offline.
 */

export const PRE_COMPUTED = 'pre_computed';

export type CreatorVideoRow = {
  video_id?: string;
  title?: string;
  channel_title?: string;
  description?: string;
  [key: string]: unknown;
};

export type CreatorEntry = {
  id: string;
  video_id: string;
  product_id: string;
  /** Pinecone cosine score on vector rows. Never set on pre-computed rows. */
  match_score?: number;
  /** Stored 0-10 keyword score, pre-computed rows only. */
  relevance_score?: number;
  similarity_score?: number;
  /** Cohere 0-1 score, only present on the successful rerank path. */
  rerank_score?: number;
  created_at?: string;
  video: CreatorVideoRow | null;
  source: string;
};

export type RerankFn = (
  query: string,
  documents: string[],
  limit?: number
) => Promise<Array<{ index: number; relevanceScore: number }> | null>;

// Text a creator video is reranked on.
export function creatorDocumentText(entry: CreatorEntry): string {
  const video = entry.video || {};
  return (
    [video.title || '', video.channel_title || '', (video.description || '').slice(0, 500)]
      .filter(Boolean)
      .join(' ')
      .trim() || entry.video_id
  );
}

// `match_score` is not a column on product_creator_matches, it belongs to the
// legacy product_matches table, so sorting pre-computed rows on it was a no-op.
export function entryScore(entry: CreatorEntry): number {
  const raw =
    entry.source === PRE_COMPUTED
      ? entry.relevance_score ?? entry.similarity_score
      : entry.match_score;
  const value = Number(raw ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/**
 * On success the combined list is truncated to `keep` (the configured top_n).
 * On any failure the caller's `limit` applies instead and nothing is dropped,
 * so an unavailable rerank degrades to the pre-flag response.
 */
export async function rankCreators(
  query: string,
  creators: CreatorEntry[],
  limit: number,
  keep: number,
  rerank: RerankFn
): Promise<{ creators: CreatorEntry[]; ranking: 'rerank' | 'similarity' }> {
  const ranked =
    query && creators.length > 0
      ? await rerank(query, creators.map(creatorDocumentText), Math.min(limit, keep))
      : null;

  if (!ranked) {
    const byScore = (a: CreatorEntry, b: CreatorEntry) => entryScore(b) - entryScore(a);
    const preComputed = creators.filter((c) => c.source === PRE_COMPUTED).sort(byScore);
    const vector = creators.filter((c) => c.source !== PRE_COMPUTED).sort(byScore);
    return { creators: [...preComputed, ...vector].slice(0, limit), ranking: 'similarity' };
  }

  return {
    creators: ranked.map(({ index, relevanceScore }) => ({
      ...creators[index],
      rerank_score: relevanceScore,
    })),
    ranking: 'rerank',
  };
}

// The reels UI reads `matches` with a nested `creator_videos`, the shape the
// Python endpoint returns. A row whose FK embed missed has no video and would
// null-deref there, so it is dropped rather than emitted.
export function toMatchRows(
  creators: CreatorEntry[]
): Array<CreatorEntry & { creator_videos: CreatorVideoRow }> {
  return creators
    .filter((creator) => creator.video)
    .map((creator) => ({ ...creator, creator_videos: creator.video as CreatorVideoRow }));
}
