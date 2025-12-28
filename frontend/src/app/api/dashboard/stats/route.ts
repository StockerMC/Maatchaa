import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return "Recently";

  try {
    const dt = new Date(timestamp);
    const now = new Date();
    const seconds = (now.getTime() - dt.getTime()) / 1000;

    if (seconds < 60) {
      return "Just now";
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      const weeks = Math.floor(seconds / 604800);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
  } catch {
    return "Recently";
  }
}

function getPartnershipAction(partnership: Record<string, unknown>): string {
  const status = partnership.status as string || "pending";

  if (status === "active") {
    return "Partnership confirmed";
  } else if (status === "in_discussion") {
    return "In active discussion";
  } else if (status === "contacted") {
    return "Creator contacted";
  } else {
    return "New creator match found";
  }
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#47;': '/',
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&#x2F;|&#47;/g, (match) => entities[match] || match);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id parameter' }, { status: 400 });
    }

    // Get all partnerships for this company
    const { data: partnerships, error: partnershipsError } = await supabaseAdmin
      .from('partnerships')
      .select('*')
      .eq('company_id', companyId);

    if (partnershipsError) {
      console.error('Error fetching partnerships:', partnershipsError);
      return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
    }

    const partnershipsList = partnerships || [];

    // Calculate stats
    const pendingMatches = partnershipsList.filter(
      (p) => p.status === 'to_contact' || p.status === 'contacted'
    ).length;
    const activePartnerships = partnershipsList.filter(
      (p) => p.status === 'active'
    ).length;
    const totalReach = partnershipsList.reduce(
      (sum, p) => sum + (p.views || 0),
      0
    );

    // Get products count
    const { count: productsCount } = await supabaseAdmin
      .from('company_products')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Get recent matches (last 3 partnerships)
    const recentPartnerships = [...partnershipsList]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 3);

    const recentMatches = recentPartnerships.map((p) => ({
      id: p.id,
      creator: decodeHtmlEntities(p.creator_handle || p.creator_name || 'Unknown Creator'),
      action: getPartnershipAction(p),
      time: formatTimeAgo(p.created_at),
      status: p.status || 'pending',
    }));

    // Get recent activity
    const recentActivity: Array<{
      id: string;
      action: string;
      detail: string;
      time: string;
    }> = [];

    // Add product sync activity if available
    const { data: shopData } = await supabaseAdmin
      .from('shopify_shops')
      .select('last_synced_at')
      .eq('company_id', companyId)
      .single();

    if (shopData?.last_synced_at) {
      recentActivity.push({
        id: 'sync-1',
        action: 'Product sync completed',
        detail: `${productsCount || 0} products updated`,
        time: formatTimeAgo(shopData.last_synced_at),
      });
    }

    // Add recent partnership actions
    for (const p of recentPartnerships.slice(0, 2)) {
      if (p.status === 'active') {
        recentActivity.push({
          id: `partnership-${p.id}`,
          action: 'Partnership activated',
          detail: `With ${decodeHtmlEntities(p.creator_handle || p.creator_name || 'creator')}`,
          time: formatTimeAgo(p.activated_at || p.updated_at),
        });
      } else if (p.email_sent) {
        recentActivity.push({
          id: `email-${p.id}`,
          action: 'Partnership request sent',
          detail: `To ${decodeHtmlEntities(p.creator_handle || p.creator_name || 'creator')}`,
          time: formatTimeAgo(p.contacted_at || p.created_at),
        });
      }
    }

    return NextResponse.json({
      stats: {
        pending_matches: pendingMatches,
        active_partnerships: activePartnerships,
        total_reach: totalReach,
        products_count: productsCount || 0,
      },
      recent_matches: recentMatches,
      recent_activity: recentActivity.slice(0, 3),
    });
  } catch (error) {
    console.error('Error in dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
