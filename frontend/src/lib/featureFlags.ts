/**
 * Retrieval feature flags.
 *
 * Defaults off. With the flag unset, serving behaves exactly as it did before
 * the flag existed. Mirrors backend/utils/feature_flags.py.
 */

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

function enabled(value: string | undefined): boolean {
  return TRUTHY.has((value || 'false').trim().toLowerCase());
}

// Serving path: merge vector matches, rerank them, order by relevance score.
export function rerankServingEnabled(): boolean {
  return enabled(process.env.RETRIEVAL_RERANK_ENABLED);
}
