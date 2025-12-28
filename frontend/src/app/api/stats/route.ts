import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getIndexStats } from '@/lib/vectordb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get Supabase counts
    const { count: productCount } = await supabaseAdmin
      .from('company_products')
      .select('id', { count: 'exact', head: true });

    const { count: partnershipCount } = await supabaseAdmin
      .from('partnerships')
      .select('id', { count: 'exact', head: true });

    const { count: videoCount } = await supabaseAdmin
      .from('creator_videos')
      .select('id', { count: 'exact', head: true });

    // Get Pinecone vector DB stats
    let vectorStats;
    try {
      vectorStats = await getIndexStats();
    } catch (vectorError) {
      console.error('Failed to get vector stats:', vectorError);
      vectorStats = null;
    }

    return NextResponse.json({
      // Supabase stats
      total_products: productCount || 0,
      total_partnerships: partnershipCount || 0,
      total_creator_videos: videoCount || 0,

      // Pinecone stats
      total_vectors: vectorStats?.totalVectorCount || 0,
      dimension: vectorStats?.dimension || 0,
      index_fullness: vectorStats?.indexFullness || 0,
      namespaces: vectorStats?.namespaces || {},
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
