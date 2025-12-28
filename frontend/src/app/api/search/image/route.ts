import { queryByImage } from '@/lib/vectordb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = body.image_url;
    const topK = body.top_k || 5;
    const companyId = body.company_id;

    if (!imageUrl) {
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
    }

    // Build filter for company if provided
    const filter = companyId ? { company_id: companyId } : undefined;

    // Perform vector search using Cohere multimodal embeddings + Pinecone
    const results = await queryByImage(imageUrl, topK, filter);

    return NextResponse.json({
      query_image: imageUrl,
      results: results.matches,
      count: results.matches.length,
    });
  } catch (error) {
    console.error('Error in image search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
