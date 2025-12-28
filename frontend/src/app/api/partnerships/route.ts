import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

function decodeHtmlEntities(text: string | null): string {
  if (!text) return '';
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

interface SocialLinks {
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  other_links: string[];
}

function extractSocialLinks(text: string | null): SocialLinks {
  const socialLinks: SocialLinks = {
    instagram: null,
    tiktok: null,
    twitter: null,
    other_links: [],
  };

  if (!text) return socialLinks;

  // Instagram patterns
  const igPatterns = [
    /instagram\.com\/([a-zA-Z0-9._]+)/i,
    /@([a-zA-Z0-9._]+).*instagram/i,
    /ig[:\s]+@?([a-zA-Z0-9._]+)/i,
  ];
  for (const pattern of igPatterns) {
    const match = text.match(pattern);
    if (match) {
      const username = match[1].replace('@', '');
      socialLinks.instagram = `https://instagram.com/${username}`;
      break;
    }
  }

  // TikTok patterns
  const tiktokPatterns = [
    /tiktok\.com\/@([a-zA-Z0-9._]+)/i,
    /@([a-zA-Z0-9._]+).*tiktok/i,
    /tt[:\s]+@?([a-zA-Z0-9._]+)/i,
  ];
  for (const pattern of tiktokPatterns) {
    const match = text.match(pattern);
    if (match) {
      const username = match[1].replace('@', '');
      socialLinks.tiktok = `https://tiktok.com/@${username}`;
      break;
    }
  }

  // Twitter/X patterns
  const twitterPatterns = [
    /twitter\.com\/([a-zA-Z0-9._]+)/i,
    /x\.com\/([a-zA-Z0-9._]+)/i,
    /@([a-zA-Z0-9._]+).*(?:twitter|x\.com)/i,
  ];
  for (const pattern of twitterPatterns) {
    const match = text.match(pattern);
    if (match) {
      const username = match[1].replace('@', '');
      socialLinks.twitter = `https://twitter.com/${username}`;
      break;
    }
  }

  // Extract other URLs
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const urls = text.match(urlPattern) || [];
  socialLinks.other_links = urls
    .filter(
      (url) =>
        !url.includes('instagram.com') &&
        !url.includes('tiktok.com') &&
        !url.includes('twitter.com') &&
        !url.includes('x.com') &&
        !url.includes('youtube.com')
    )
    .slice(0, 3);

  return socialLinks;
}

function extractEmailFromText(text: string | null): string | null {
  if (!text) return null;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailPattern);
  return match ? match[0] : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const statusFilter = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id parameter' }, { status: 400 });
    }

    // Build query
    let query = supabaseAdmin
      .from('partnerships')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Optional status filter
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching partnerships:', error);
      return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
    }

    // Decode HTML entities in partnership data
    const partnerships = (data || []).map((p) => ({
      ...p,
      creator_name: decodeHtmlEntities(p.creator_name),
      creator_handle: decodeHtmlEntities(p.creator_handle),
      video_title: decodeHtmlEntities(p.video_title),
    }));

    return NextResponse.json({
      partnerships,
      count: partnerships.length,
    });
  } catch (error) {
    console.error('Error in partnerships list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }
    if (!body.video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }
    if (!body.creator_name) {
      return NextResponse.json({ error: 'creator_name is required' }, { status: 400 });
    }
    if (!body.video_title) {
      return NextResponse.json({ error: 'video_title is required' }, { status: 400 });
    }
    if (!body.video_url) {
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 });
    }

    // Check for duplicate (same company + video)
    const { data: existing } = await supabaseAdmin
      .from('partnerships')
      .select('id')
      .eq('company_id', body.company_id)
      .eq('video_url', body.video_url);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: 'Partnership already exists for this video',
          partnership_id: existing[0].id,
        },
        { status: 409 }
      );
    }

    // Extract contact info from video description
    const videoDescription = body.video_description || '';
    const extractedEmail = extractEmailFromText(videoDescription);
    const socialLinks = extractSocialLinks(videoDescription);

    // Build partnership data
    const partnershipData = {
      company_id: body.company_id,
      video_id: body.video_id,
      creator_name: decodeHtmlEntities(body.creator_name),
      creator_handle: body.creator_handle || null,
      creator_email: body.creator_email || extractedEmail || null,
      creator_avatar: body.creator_avatar || null,
      creator_channel_url: body.creator_channel_url || (body.creator_channel_id ? `https://youtube.com/channel/${body.creator_channel_id}` : null),
      video_title: decodeHtmlEntities(body.video_title),
      video_url: body.video_url,
      video_thumbnail: body.video_thumbnail || null,
      matched_products: body.matched_products || [],
      views: body.views || 0,
      likes: body.likes || 0,
      comments: body.comments || 0,
      status: 'to_contact',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('partnerships')
      .insert(partnershipData)
      .select()
      .single();

    if (error) {
      console.error('Error creating partnership:', error);
      return NextResponse.json({ error: 'Failed to create partnership' }, { status: 500 });
    }

    // Add contact info to response
    const partnership = {
      ...data,
      _contact_info: socialLinks,
    };

    return NextResponse.json(
      {
        message: 'Partnership created successfully',
        partnership,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in partnership creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
