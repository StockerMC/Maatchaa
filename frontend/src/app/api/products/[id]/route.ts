import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchProduct, deleteProduct } from '@/lib/vectordb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Try to fetch from Supabase first
    const { data: supabaseProduct } = await supabaseAdmin
      .from('company_products')
      .select('*')
      .eq('id', productId)
      .single();

    // If product has pinecone_id, fetch from Pinecone for vector data
    let pineconeData = null;
    if (supabaseProduct?.pinecone_id) {
      pineconeData = await fetchProduct(supabaseProduct.pinecone_id);
    }

    if (!supabaseProduct && !pineconeData) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: productId,
      metadata: supabaseProduct || pineconeData?.metadata || {},
      values: pineconeData?.values,
      pinecone_id: supabaseProduct?.pinecone_id,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product to find pinecone_id
    const { data: product } = await supabaseAdmin
      .from('company_products')
      .select('pinecone_id')
      .eq('id', productId)
      .single();

    // Delete from Supabase
    const { error: supabaseError } = await supabaseAdmin
      .from('company_products')
      .delete()
      .eq('id', productId);

    if (supabaseError) {
      console.error('Error deleting from Supabase:', supabaseError);
    }

    // Delete from Pinecone if pinecone_id exists
    if (product?.pinecone_id) {
      await deleteProduct(product.pinecone_id);
    }

    return NextResponse.json({
      message: `Product ${productId} deleted successfully`,
      deleted_from_pinecone: !!product?.pinecone_id,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
