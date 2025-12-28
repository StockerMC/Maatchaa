import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('yt_shorts_pending')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pending short:', error);
      return NextResponse.json({ error: 'Failed to delete pending short' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Short deleted successfully' });
  } catch (error) {
    console.error('Error in pending short delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
