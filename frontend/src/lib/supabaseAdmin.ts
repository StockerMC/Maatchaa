import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper function to upsert (insert or update) creator tokens
export async function upsertCreatorTokens({
  channelId,
  email,
  accessToken,
  refreshToken,
  expiresAt,
}: {
  channelId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}) {
  const { error } = await supabaseAdmin
    .from('creator_tokens')
    .upsert(
      {
        channel_id: channelId,
        email: email,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'channel_id',
    });

  if (error) {
    console.error('Error upserting creator tokens:', error);
    throw error;
  }
}