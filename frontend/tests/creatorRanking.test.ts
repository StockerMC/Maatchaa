import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import type { CreatorEntry } from '../src/lib/creatorRanking.ts';
import {
  PRE_COMPUTED,
  entryScore,
  rankCreators,
  toMatchRows,
} from '../src/lib/creatorRanking.ts';

function preComputed(videoId: string, fields: Partial<CreatorEntry> = {}): CreatorEntry {
  return {
    id: videoId,
    video_id: videoId,
    product_id: 'p1',
    video: { video_id: videoId, title: `${videoId} review` },
    source: PRE_COMPUTED,
    ...fields,
  };
}

function vectorEntry(videoId: string, score: number): CreatorEntry {
  return {
    id: `vector_${videoId}`,
    video_id: videoId,
    product_id: 'p1',
    match_score: score,
    video: { video_id: videoId, title: `${videoId} short` },
    source: 'real_time_vector_search',
  };
}

const unavailable = async () => null;
const neverCalled = async () => {
  throw new Error('rerank should not have been called');
};

describe('entryScore', () => {
  test('pre-computed rows score on relevance_score', () => {
    assert.equal(entryScore(preComputed('a', { relevance_score: 8.5 })), 8.5);
  });

  test('pre-computed rows fall back to similarity_score', () => {
    assert.equal(entryScore(preComputed('a', { similarity_score: 0.4 })), 0.4);
  });

  // match_score belongs to the legacy product_matches table and is never
  // present on product_creator_matches rows.
  test('the legacy match_score column is ignored on pre-computed rows', () => {
    assert.equal(entryScore(preComputed('a', { match_score: 99 })), 0);
  });

  test('vector rows score on their Pinecone score', () => {
    assert.equal(entryScore(vectorEntry('v', 0.72)), 0.72);
  });
});

describe('rankCreators fallback', () => {
  test('keeps every candidate when rerank is unavailable', async () => {
    const creators = [
      ...Array.from({ length: 12 }, (_, i) => preComputed(`m${i}`, { relevance_score: i })),
      ...Array.from({ length: 6 }, (_, i) => vectorEntry(`v${i}`, 0.5)),
    ];

    const result = await rankCreators('query', creators, 50, 10, unavailable);

    assert.equal(result.ranking, 'similarity');
    assert.equal(result.creators.length, 18);
  });

  test("respects the caller's limit rather than top_n", async () => {
    const creators = Array.from({ length: 12 }, (_, i) =>
      preComputed(`m${i}`, { relevance_score: i })
    );

    const result = await rankCreators('query', creators, 50, 10, unavailable);
    assert.equal(result.creators.length, 12);

    const limited = await rankCreators('query', creators, 5, 10, unavailable);
    assert.equal(limited.creators.length, 5);
  });

  test('orders pre-computed rows by relevance_score', async () => {
    const creators = [
      preComputed('low', { relevance_score: 2 }),
      preComputed('high', { relevance_score: 9 }),
      preComputed('mid', { relevance_score: 5 }),
    ];

    const result = await rankCreators('query', creators, 50, 10, unavailable);
    assert.deepEqual(
      result.creators.map((c) => c.video_id),
      ['high', 'mid', 'low']
    );
  });

  test('equal scores keep insertion order', async () => {
    const creators = [preComputed('a'), preComputed('b'), preComputed('c')];
    const result = await rankCreators('query', creators, 50, 10, unavailable);
    assert.deepEqual(
      result.creators.map((c) => c.video_id),
      ['a', 'b', 'c']
    );
  });

  test('the vector candidates are not dropped', async () => {
    const creators = [preComputed('m1', { relevance_score: 1 }), vectorEntry('v1', 0.9)];
    const result = await rankCreators('query', creators, 50, 10, unavailable);
    assert.ok(result.creators.some((c) => c.video_id === 'v1'));
  });

  test('an empty query never calls rerank', async () => {
    const creators = [preComputed('a'), preComputed('b')];
    const result = await rankCreators('', creators, 50, 10, neverCalled);
    assert.equal(result.ranking, 'similarity');
    assert.equal(result.creators.length, 2);
  });

  test('no rerank_score is added on the fallback path', async () => {
    const result = await rankCreators('query', [preComputed('a')], 50, 10, unavailable);
    assert.equal('rerank_score' in result.creators[0], false);
  });
});

describe('rankCreators rerank path', () => {
  test('relevance_score survives untouched and rerank_score is added', async () => {
    const creators = [preComputed('a', { relevance_score: 8.5 })];

    const result = await rankCreators('query', creators, 50, 10, async () => [
      { index: 0, relevanceScore: 0.31 },
    ]);

    assert.equal(result.ranking, 'rerank');
    assert.equal(result.creators[0].relevance_score, 8.5);
    assert.equal(result.creators[0].rerank_score, 0.31);
  });

  test('asks cohere for min(limit, top_n) and reranks the video text', async () => {
    const captured: { documents?: string[]; limit?: number } = {};
    const creators = [preComputed('a'), vectorEntry('v', 0.5)];

    await rankCreators('query', creators, 50, 3, async (_query, documents, limit) => {
      captured.documents = documents;
      captured.limit = limit;
      return [{ index: 0, relevanceScore: 0.9 }];
    });

    assert.equal(captured.limit, 3);
    assert.deepEqual(captured.documents, ['a review', 'v short']);
  });

  test('orders by the returned ranking across both sources', async () => {
    const creators = [preComputed('m1'), preComputed('m2'), vectorEntry('v1', 0.9)];

    const result = await rankCreators('query', creators, 50, 10, async () => [
      { index: 2, relevanceScore: 0.9 },
      { index: 1, relevanceScore: 0.5 },
      { index: 0, relevanceScore: 0.1 },
    ]);

    assert.deepEqual(
      result.creators.map((c) => c.video_id),
      ['v1', 'm2', 'm1']
    );
  });
});

describe('toMatchRows', () => {
  test('nests the video under creator_videos, the shape the reels view reads', () => {
    const rows = toMatchRows([preComputed('a')]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].creator_videos.video_id, 'a');
  });

  // reels/page.tsx dereferences match.creator_videos.video_id, so a row whose
  // FK embed missed must never reach it.
  test('drops rows whose creator_videos embed missed', () => {
    const rows = toMatchRows([preComputed('a'), preComputed('b', { video: null })]);
    assert.deepEqual(
      rows.map((r) => r.video_id),
      ['a']
    );
  });
});
