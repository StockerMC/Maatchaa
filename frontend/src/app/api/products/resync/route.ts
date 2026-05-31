import { NextRequest, NextResponse } from 'next/server';

/**
 * Products resync endpoint.
 *
 * A full re-sync from Shopify (re-fetching the catalog + regenerating embeddings)
 * is performed by the Python backend worker. When that backend is configured,
 * `fetchWithFallback` calls it first and only falls back to this route when it is
 * unavailable. This fallback acknowledges the request gracefully so the UI can
 * simply refresh the already-synced catalog from Supabase instead of erroring
 * with a 404 (the previous behavior, since no such route existed).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (!body.company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    const backendConfigured = Boolean(process.env.NEXT_PUBLIC_API_URL);

    return NextResponse.json({
      success: true,
      synced: false,
      message: backendConfigured
        ? 'Resync requested. Showing the latest synced catalog.'
        : 'Live Shopify resync is handled by the sync service (currently offline). Showing the latest synced catalog.',
    });
  } catch (error) {
    console.error('Error in products resync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
