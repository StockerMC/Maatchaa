import { queryByText } from '@/lib/vectordb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query;
    const topK = body.top_k || 10;
    const companyId = body.company_id;

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // Build filter for company if provided
    const filter = companyId ? { company_id: companyId } : undefined;

    // Perform vector search using Cohere embeddings + Pinecone
    const results = await queryByText(query, topK, filter);

    return NextResponse.json({
      query,
      results: results.matches,
      count: results.matches.length,
    });
  } catch (error) {
    console.error('Error in text search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
