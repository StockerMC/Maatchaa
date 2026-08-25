/**
 * Vector Database Utilities
 * Using Pinecone for vector storage and Cohere for embeddings
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { CohereClient } from 'cohere-ai';

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'products';

let pineconeClient: Pinecone | null = null;
let cohereClient: CohereClient | null = null;

// Lazy initialize Pinecone client
function getPinecone() {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY not configured');
    }
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

// Lazy initialize Cohere client
export function getCohere() {
  if (!cohereClient) {
    if (!process.env.COHERE_API_KEY) {
      throw new Error('COHERE_API_KEY not configured');
    }
    cohereClient = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
  }
  return cohereClient;
}

// Get Pinecone index
export function getIndex() {
  return getPinecone().index(INDEX_NAME);
}

// embed-english-v3.0 is asymmetric: corpus content belongs in 'search_document'
// and live queries in 'search_query'. The index was built with 'search_query',
// so corpus writers (the Python indexer) only switch once it is re-embedded.
export type EmbedInputType = 'search_query' | 'search_document';

// Text to embedding using Cohere
export async function textToEmbedding(
  text: string,
  inputType: EmbedInputType = 'search_query'
): Promise<number[]> {
  const cohere = getCohere();
  const response = await cohere.embed({
    texts: [text],
    model: 'embed-english-v3.0',
    inputType,
  });

  const embeddings = response.embeddings;
  if (Array.isArray(embeddings) && embeddings.length > 0) {
    return embeddings[0] as number[];
  }
  throw new Error('Failed to generate embedding');
}

// Image URL to embedding using Cohere
export async function imageUrlToEmbedding(imageUrl: string): Promise<number[]> {
  const cohere = getCohere();
  // Cohere's multimodal model
  const response = await cohere.embed({
    texts: [imageUrl],
    model: 'embed-english-v3.0',
    inputType: 'image',
  });

  const embeddings = response.embeddings;
  if (Array.isArray(embeddings) && embeddings.length > 0) {
    return embeddings[0] as number[];
  }
  throw new Error('Failed to generate embedding');
}

// Identify creator video vectors in an index shared with products.
// Vectors indexed before the type key existed are identified by video_id.
export function isCreatorVideoMatch(metadata: Record<string, unknown>): boolean {
  if (!metadata) return false;
  const vectorType = metadata.type;
  if (vectorType) return vectorType === 'creator_video';
  return Boolean(metadata.video_id);
}

// Query products by text
export async function queryByText(
  query: string,
  topK: number = 10,
  filter?: Record<string, unknown>
): Promise<{
  matches: Array<{
    id: string;
    score: number;
    metadata: Record<string, unknown>;
  }>;
}> {
  const index = getIndex();
  const embedding = await textToEmbedding(query);

  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return {
    matches:
      queryResponse.matches?.map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: (match.metadata as Record<string, unknown>) || {},
      })) || [],
  };
}

// Query products by image URL
export async function queryByImage(
  imageUrl: string,
  topK: number = 5,
  filter?: Record<string, unknown>
): Promise<{
  matches: Array<{
    id: string;
    score: number;
    metadata: Record<string, unknown>;
  }>;
}> {
  const index = getIndex();
  const embedding = await imageUrlToEmbedding(imageUrl);

  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return {
    matches:
      queryResponse.matches?.map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: (match.metadata as Record<string, unknown>) || {},
      })) || [],
  };
}

// Fetch product by ID from Pinecone
export async function fetchProduct(productId: string): Promise<{
  id: string;
  metadata: Record<string, unknown>;
  values?: number[];
} | null> {
  const index = getIndex();
  const fetchResponse = await index.fetch([productId]);

  const record = fetchResponse.records?.[productId];
  if (!record) return null;

  return {
    id: productId,
    metadata: (record.metadata as Record<string, unknown>) || {},
    values: record.values,
  };
}

// Delete product from Pinecone
export async function deleteProduct(productId: string): Promise<void> {
  const index = getIndex();
  await index.deleteOne(productId);
}

// Get index stats
export async function getIndexStats(): Promise<{
  totalVectorCount: number;
  dimension: number;
  indexFullness: number;
  namespaces: Record<string, unknown>;
}> {
  const index = getIndex();
  const stats = await index.describeIndexStats();

  return {
    totalVectorCount: stats.totalRecordCount || 0,
    dimension: stats.dimension || 0,
    indexFullness: (stats.totalRecordCount || 0) / (stats.dimension || 1),
    namespaces: (stats.namespaces as Record<string, unknown>) || {},
  };
}

// Upsert products to Pinecone
export async function upsertProducts(
  products: Array<{
    id: string;
    values: number[];
    metadata: Record<string, unknown>;
  }>
): Promise<void> {
  const index = getIndex();
  // Type assertion to satisfy Pinecone's strict types
  await index.upsert(products as never);
}
