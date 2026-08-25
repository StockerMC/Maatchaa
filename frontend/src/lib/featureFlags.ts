/**
 * Retrieval feature flags.
 *
 * All default off. With none set, this route behaves exactly as it did before
 * the flags existed. Mirrors backend/utils/feature_flags.py.
 */

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

function enabled(value: string | undefined): boolean {
  return TRUTHY.has((value || 'false').trim().toLowerCase());
}

// Ordering only: rerank the merged candidates and order the served list by the
// Cohere score instead of by relevance/similarity score. Does not change which
// keys the response carries.
export function rerankServingEnabled(): boolean {
  return enabled(process.env.RETRIEVAL_RERANK_ENABLED);
}

// Response shape, not ordering: add the `matches` array (each entry carrying a
// nested `creator_videos`) that the reels view reads. This route has only ever
// returned `creators`, so /dashboard/reels?product_id=... renders nothing
// without it. Flagged rather than unconditional so turning it on is a
// deliberate, revertible change to a live response.
export function emitCreatorMatchesEnabled(): boolean {
  return enabled(process.env.CREATORS_API_EMIT_MATCHES);
}
