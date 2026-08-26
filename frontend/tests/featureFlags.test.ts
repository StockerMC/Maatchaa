import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { emitCreatorMatchesEnabled, rerankServingEnabled } from '../src/lib/featureFlags.ts';

const FLAGS = ['RETRIEVAL_RERANK_ENABLED', 'CREATORS_API_EMIT_MATCHES'];

describe('retrieval feature flags', () => {
  beforeEach(() => {
    for (const flag of FLAGS) delete process.env[flag];
  });

  test('both default off', () => {
    assert.equal(rerankServingEnabled(), false);
    assert.equal(emitCreatorMatchesEnabled(), false);
  });

  test('truthy values enable', () => {
    for (const value of ['true', 'TRUE', '1', 'yes', 'on', ' on ']) {
      process.env.RETRIEVAL_RERANK_ENABLED = value;
      assert.equal(rerankServingEnabled(), true, value);
    }
  });

  test('anything else stays off', () => {
    for (const value of ['false', '0', '', 'off', 'maybe']) {
      process.env.RETRIEVAL_RERANK_ENABLED = value;
      assert.equal(rerankServingEnabled(), false, value);
    }
  });

  // The ordering flag and the response-shape flag are separate on purpose:
  // turning on rerank must not start emitting `matches`, and vice versa.
  test('the two flags are independent', () => {
    process.env.RETRIEVAL_RERANK_ENABLED = 'true';
    assert.equal(rerankServingEnabled(), true);
    assert.equal(emitCreatorMatchesEnabled(), false);

    delete process.env.RETRIEVAL_RERANK_ENABLED;
    process.env.CREATORS_API_EMIT_MATCHES = 'true';
    assert.equal(rerankServingEnabled(), false);
    assert.equal(emitCreatorMatchesEnabled(), true);
  });
});
