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
function getCohere() {
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

// Text to embedding using Cohere
export async function textToEmbedding(text: string): Promise<number[]> {
  const cohere = getCohere();
  const response = await cohere.embed({
    texts: [text],
    model: 'embed-english-v3.0',
    inputType: 'search_query',
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
