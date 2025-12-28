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

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id parameter' }, { status: 400 });
    }

    const notifications: Notification[] = [];

    // Get recent partnerships (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: partnerships, error: partnershipsError } = await supabaseAdmin
      .from('partnerships')
      .select('*')
      .eq('company_id', companyId)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (partnershipsError) {
      console.error('Error fetching partnerships:', partnershipsError);
    }

    // Create notifications for partnerships
    for (const partnership of partnerships || []) {
      if (partnership.created_at) {
        const creator = decodeHtmlEntities(
          partnership.creator_handle || partnership.creator_name || 'Unknown'
        );

        let productText = 'your products';
        if (partnership.matched_products) {
          const products = partnership.matched_products;
          if (Array.isArray(products) && products.length > 0) {
            const firstProduct = products[0];
            if (typeof firstProduct === 'object' && firstProduct !== null) {
              productText = (firstProduct as Record<string, string>).title || (firstProduct as Record<string, string>).name || productText;
            } else if (typeof firstProduct === 'string') {
              productText = firstProduct;
            }
          }
        }

        const status = partnership.status || 'to_contact';

        if (status === 'active') {
          notifications.push({
            id: `partnership-active-${partnership.id}`,
            title: 'Partnership Activated',
            message: `${creator} partnership is now active`,
            time: formatTimeAgo(partnership.activated_at || partnership.updated_at),
            unread: true,
            type: 'partnership_active',
          });
        } else if (status === 'in_discussion') {
          notifications.push({
            id: `partnership-discussion-${partnership.id}`,
            title: 'Partnership In Discussion',
            message: `${creator} is discussing partnership for ${productText}`,
            time: formatTimeAgo(partnership.discussion_started_at || partnership.updated_at),
            unread: true,
            type: 'partnership_discussion',
          });
        } else {
          notifications.push({
            id: `partnership-new-${partnership.id}`,
            title: 'New Creator Match',
            message: `${creator} matched with ${productText}`,
            time: formatTimeAgo(partnership.created_at),
            unread: true,
            type: 'partnership_new',
          });
        }
      }
    }

    // Get product sync notifications
    const { data: shopData } = await supabaseAdmin
      .from('shopify_shops')
      .select('last_synced_at')
      .eq('company_id', companyId)
      .single();

    if (shopData?.last_synced_at) {
      // Get product count
      const { count: productCount } = await supabaseAdmin
        .from('company_products')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);

      notifications.push({
        id: `sync-${companyId}`,
        title: 'Product Sync Complete',
        message: `${productCount || 0} products successfully synced from Shopify`,
        time: formatTimeAgo(shopData.last_synced_at),
        unread: false,
        type: 'product_sync',
      });
    }

    // Sort and limit
    const sortedNotifications = notifications
      .sort((a, b) => {
        // "Just now" comes first
        if (a.time === 'Just now') return -1;
        if (b.time === 'Just now') return 1;
        return 0;
      })
      .slice(0, limit);

    return NextResponse.json({
      notifications: sortedNotifications,
      unread_count: sortedNotifications.filter((n) => n.unread).length,
    });
  } catch (error) {
    console.error('Error in notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
