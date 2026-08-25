/**
 * Cohere Rerank stage for retrieval.
 *
 * Pinecone similarity is a first-pass filter; rerank scores each candidate
 * against the query text directly. Callers ask for a wide candidate pool and
 * keep the top N. Mirrors backend/utils/rerank.py.
 *
 * Every failure mode returns null so callers can fall back to similarity order
 * instead of failing the request.
 */

import { getCohere } from '@/lib/vectordb';

export const DEFAULT_RERANK_MODEL = 'rerank-v3.5';
const DEFAULT_CANDIDATE_POOL = 30;
const DEFAULT_TOP_N = 10;

function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function rerankModel(): string {
  return process.env.COHERE_RERANK_MODEL || DEFAULT_RERANK_MODEL;
}

export function candidatePool(): number {
  return intFromEnv(process.env.RETRIEVAL_CANDIDATE_POOL, DEFAULT_CANDIDATE_POOL);
}

export function rerankTopN(): number {
  return intFromEnv(process.env.RETRIEVAL_TOP_N, DEFAULT_TOP_N);
}

export async function rerankDocuments(
  query: string,
  documents: string[],
  limit?: number
): Promise<Array<{ index: number; relevanceScore: number }> | null> {
  if (!query || documents.length === 0) return null;

  const requested = limit ?? rerankTopN();

  try {
    const cohere = getCohere();
    const response = await cohere.rerank({
      model: rerankModel(),
      query,
      documents,
      topN: Math.min(requested, documents.length),
    });

    const results = (response.results || []).filter(
      (result) => result.index >= 0 && result.index < documents.length
    );
    if (results.length === 0) return null;

    return results.map((result) => ({
      index: result.index,
      relevanceScore: result.relevanceScore ?? 0,
    }));
  } catch (error) {
    console.error('Rerank failed, keeping similarity order:', error);
    return null;
  }
}
