# MAATCHAA DEVELOPMENT PLAN
## From Prototype to Production-Ready Platform

**Current State:** 80% of dashboard is cosmetic only
**Goal:** Make it work as intended for Shopify pitch + beyond
**Timeline:** Immediate (this weekend) → Short-term (1-2 weeks) → Long-term (1 month+)

---

## 🚨 CRITICAL PATH: BEFORE THE PITCH (24-48 Hours)

These are the **highest-impact, lowest-effort** tasks that will make your demo credible. Focus ONLY on these before the weekend.

### Priority 0: Authentication & Multi-Tenancy (6-8 hours)

⚠️ **CRITICAL SECURITY ISSUE:** Currently, there's no company separation - all dashboards show the same data regardless of who logs in. This MUST be fixed before any demo.

#### Task 0.1: Implement Company-Based Authentication
**Time:** 3-4 hours
**Difficulty:** Medium
**Impact:** 🔥🔥🔥 CRITICAL - Without this, all companies see each other's data

**Current Problem:**
- No login system for brands/companies
- Dashboard doesn't know which company is logged in
- All data queries are global (no company_id filtering)
- Security vulnerability: Company A can see Company B's partnerships

**What to Build:**

1. **Authentication Strategy:**
   - Option A: Email/Password for brand owners (simpler for demo)
   - Option B: Shopify OAuth (more authentic but complex)
   - **Recommendation for pitch:** Option A, add Shopify OAuth post-pitch

2. **Database Changes:**
```sql
-- Add users table for brand owners
CREATE TABLE brand_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- hashed with bcrypt
  full_name TEXT,
  company_id UUID REFERENCES companies(id) NOT NULL,
  role TEXT DEFAULT 'owner', -- 'owner', 'admin', 'viewer'
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brand_users_email ON brand_users(email);
CREATE INDEX idx_brand_users_company ON brand_users(company_id);

-- Add RLS (Row Level Security) policies for multi-tenancy
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their company's partnerships
CREATE POLICY partnerships_company_isolation ON partnerships
  FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only see their company's products
CREATE POLICY products_company_isolation ON shopify_products
  FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only see messages for their partnerships
CREATE POLICY messages_company_isolation ON messages
  FOR ALL
  USING (
    partnership_id IN (
      SELECT id FROM partnerships
      WHERE company_id = (
        SELECT company_id FROM brand_users
        WHERE id = auth.uid()
      )
    )
  );

-- Policy: Users can only see their company's agent conversations
CREATE POLICY agents_company_isolation ON agent_conversations
  FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );
```

3. **Frontend Authentication Setup:**
   - Update NextAuth configuration to support brand user login
   - Add login page at `/login`
   - Add signup page at `/signup` (for demo, pre-create accounts)
   - Protect all `/dashboard/*` routes with authentication middleware
   - Store company_id in session

4. **Session Management:**
   - Use NextAuth with Supabase adapter
   - Store current company_id in JWT token
   - Pass company_id to all API calls
   - Add `useCompany()` hook to get current company context

5. **Files to Create/Modify:**
   - `frontend/src/app/login/page.tsx` - Login form
   - `frontend/src/app/signup/page.tsx` - Signup form (optional for demo)
   - `frontend/src/middleware.ts` - Protect dashboard routes
   - `frontend/src/lib/auth.ts` - NextAuth configuration
   - `frontend/src/hooks/useCompany.ts` - Get current company context
   - `frontend/src/app/api/auth/[...nextauth]/route.ts` - Auth endpoints

**Code Skeleton:**

```typescript
// frontend/src/hooks/useCompany.ts
import { useSession } from 'next-auth/react';

export function useCompany() {
  const { data: session } = useSession();

  return {
    companyId: session?.user?.companyId,
    companyName: session?.user?.companyName,
    isLoading: !session,
  };
}

// Usage in components:
const { companyId } = useCompany();

// All Supabase queries now filtered by company:
const { data } = await supabase
  .from('partnerships')
  .select('*')
  .eq('company_id', companyId);  // ← CRITICAL: Always filter by company
```

**Middleware to protect routes:**

```typescript
// frontend/src/middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/partnerships/:path*'],
};
```

**Pre-Demo Setup:**
```sql
-- Create demo accounts for pitch
INSERT INTO companies (id, shop_name, access_token, ingested)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'matchamatcha.ca', 'demo-token', true),
  ('00000000-0000-0000-0000-000000000002', 'teahouse.myshopify.com', 'demo-token-2', false);

INSERT INTO brand_users (email, password_hash, full_name, company_id)
VALUES
  ('demo@matchamatcha.ca', '$2b$10$...', 'Demo User', '00000000-0000-0000-0000-000000000001'),
  ('demo@teahouse.com', '$2b$10$...', 'Tea House Owner', '00000000-0000-0000-0000-000000000002');
```

**Testing Checklist:**
- [ ] Login with matchamatcha.ca account → See only matchamatcha partnerships
- [ ] Login with teahouse account → See different data
- [ ] Try to access another company's data via API → Blocked by RLS
- [ ] Logout → Redirected to login page
- [ ] Refresh page while logged in → Session persists

---

#### Task 0.2: Update All Database Queries with Company Filtering
**Time:** 2-3 hours
**Difficulty:** Medium
**Impact:** 🔥🔥 CRITICAL - Ensures data separation

**What to Do:**

1. **Audit every Supabase query** in the codebase
2. **Add `.eq('company_id', companyId)`** to ALL queries
3. **Update all INSERT statements** to include company_id

**Files to audit:**
- `frontend/src/app/dashboard/partnerships/page.tsx`
- `frontend/src/app/dashboard/communications/page.tsx`
- `frontend/src/app/dashboard/products/page.tsx`
- `frontend/src/app/dashboard/reels/page.tsx`
- `frontend/src/app/dashboard/agents/page.tsx`
- `frontend/src/app/dashboard/analytics/page.tsx`
- All `/api/*` routes

**Pattern to follow:**

```typescript
// ❌ WRONG - No company filtering
const { data } = await supabase
  .from('partnerships')
  .select('*');

// ✅ CORRECT - Always filter by company
const { companyId } = useCompany();
const { data } = await supabase
  .from('partnerships')
  .select('*')
  .eq('company_id', companyId);

// ✅ CORRECT - Insert with company_id
const { data } = await supabase
  .from('partnerships')
  .insert({
    company_id: companyId,  // ← Always include
    creator_name: 'Sarah Chen',
    // ... rest of data
  });
```

**Backend API Updates:**

All backend endpoints must accept and validate company_id:

```python
# backend/API.py

from functools import wraps
from blacksheep import Request, unauthorized

def require_company(handler):
    """Decorator to extract and validate company_id from request"""
    @wraps(handler)
    async def wrapper(request: Request, *args, **kwargs):
        # Get company_id from auth token or header
        company_id = request.headers.get(b"X-Company-ID")
        if not company_id:
            return unauthorized("Missing company_id")

        # Validate company exists
        company = supabase.table("companies") \
            .select("id") \
            .eq("id", company_id.decode()) \
            .execute()

        if not company.data:
            return unauthorized("Invalid company_id")

        # Pass company_id to handler
        return await handler(request, company_id.decode(), *args, **kwargs)

    return wrapper

# Use on all endpoints:
@app.route("/shopify/products")
@require_company
async def get_products(request: Request, company_id: str):
    products = supabase.table("shopify_products") \
        .select("*") \
        .eq("company_id", company_id) \
        .execute()

    return products.data
```

**Testing:**
- [ ] Log in as Company A → Create partnership → Log out
- [ ] Log in as Company B → Verify Company A's partnership is NOT visible
- [ ] Try API call with wrong company_id → Gets rejected
- [ ] All dashboard pages show only current company's data

---

#### Task 0.3: Add Company Context to All Pages
**Time:** 1 hour
**Difficulty:** Easy
**Impact:** 🔥 HIGH - Makes multi-tenancy work across UI

**What to Add:**

Create a Company Context Provider:

```typescript
// frontend/src/providers/CompanyProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface CompanyContextType {
  companyId: string | null;
  companyName: string | null;
  shopUrl: string | null;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companyId: null,
  companyName: null,
  shopUrl: null,
  isLoading: true,
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [company, setCompany] = useState<CompanyContextType>({
    companyId: null,
    companyName: null,
    shopUrl: null,
    isLoading: true,
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      setCompany({
        companyId: session.user.companyId,
        companyName: session.user.companyName,
        shopUrl: session.user.shopUrl,
        isLoading: false,
      });
    } else {
      setCompany({
        companyId: null,
        companyName: null,
        shopUrl: null,
        isLoading: false,
      });
    }
  }, [session, status]);

  return (
    <CompanyContext.Provider value={company}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
```

**Wrap dashboard layout:**

```typescript
// frontend/src/app/dashboard/layout.tsx
import { CompanyProvider } from '@/providers/CompanyProvider';

export default function DashboardLayout({ children }) {
  return (
    <CompanyProvider>
      <div className="dashboard-layout">
        {/* Show company name in header */}
        <DashboardHeader />
        {children}
      </div>
    </CompanyProvider>
  );
}
```

**Use in every page:**

```typescript
// Example: frontend/src/app/dashboard/partnerships/page.tsx
import { useCompany } from '@/providers/CompanyProvider';

export default function PartnershipsPage() {
  const { companyId, companyName, isLoading } = useCompany();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!companyId) {
    redirect('/login');
  }

  // Now all queries use companyId
  const { data: partnerships } = await supabase
    .from('partnerships')
    .select('*')
    .eq('company_id', companyId);

  // ...
}
```

---

### Priority 1: Database Foundation (4-6 hours)

#### Task 1.1: Create Missing Database Tables
**Time:** 2 hours
**Difficulty:** Easy
**Impact:** 🔥 CRITICAL - Prevents demo crashes

**Action:**
1. Create `partnerships` table in Supabase:
```sql
CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  creator_name TEXT NOT NULL,
  creator_email TEXT NOT NULL,
  creator_handle TEXT,
  creator_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'to_contact',
    -- 'to_contact', 'contacted', 'in_discussion', 'active'

  -- Partnership details
  video_url TEXT,
  video_title TEXT,
  video_thumbnail TEXT,
  video_views INTEGER DEFAULT 0,
  video_likes INTEGER DEFAULT 0,
  video_comments INTEGER DEFAULT 0,

  -- Matched products
  matched_products JSONB DEFAULT '[]'::jsonb,

  -- Contract & affiliate
  contract_signed BOOLEAN DEFAULT false,
  contract_url TEXT,
  contract_signed_at TIMESTAMP,
  affiliate_link TEXT,
  affiliate_link_generated BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,

  -- Communication
  last_contact_at TIMESTAMP,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for fast queries
CREATE INDEX idx_partnerships_status ON partnerships(status);
CREATE INDEX idx_partnerships_company ON partnerships(company_id);
CREATE INDEX idx_partnerships_email ON partnerships(creator_email);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partnerships_updated_at
  BEFORE UPDATE ON partnerships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

2. Create `messages` table for communications:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partnership_id UUID REFERENCES partnerships(id) ON DELETE CASCADE,

  -- Message details
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body TEXT NOT NULL,

  -- Thread management
  thread_id UUID, -- Groups related messages
  in_reply_to UUID REFERENCES messages(id),

  -- Status
  status TEXT DEFAULT 'sent', -- 'draft', 'sent', 'delivered', 'read', 'failed'
  is_read BOOLEAN DEFAULT false,

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  email_provider TEXT, -- 'resend', 'manual', 'gmail'
  provider_message_id TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_partnership ON messages(partnership_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_status ON messages(status);
```

3. Create `agent_conversations` table:
```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),

  -- Agent details
  agent_name TEXT NOT NULL,
  agent_purpose TEXT NOT NULL, -- 'outreach', 'contract', 'research', 'schedule', 'analytics'

  -- Conversation state
  messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  actions JSONB DEFAULT '[]'::jsonb, -- Array of agent actions taken

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_conversations_company ON agent_conversations(company_id);
CREATE INDEX idx_agent_conversations_active ON agent_conversations(is_active);
```

**Files to modify:** None yet - just database setup

---

#### Task 1.2: Seed Initial Partnership Data
**Time:** 30 minutes
**Difficulty:** Easy
**Impact:** Makes demo look real

**Action:**
Create a SQL script to populate the database with realistic demo data:

```sql
-- Insert 3-5 realistic partnerships based on your mockups
INSERT INTO partnerships (
  company_id,
  creator_name,
  creator_email,
  creator_handle,
  creator_avatar,
  status,
  video_url,
  video_title,
  video_thumbnail,
  video_views,
  video_likes,
  video_comments,
  matched_products,
  contract_signed,
  affiliate_link_generated,
  clicks,
  conversions,
  revenue,
  last_contact_at
) VALUES
  (
    (SELECT id FROM companies WHERE shop_name = 'matchamatcha.ca' LIMIT 1),
    'Sarah Chen',
    'sarah@teawithsarah.com',
    '@teawithsarah',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    'active',
    'https://youtube.com/shorts/abc123',
    'My Morning Matcha Routine',
    'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
    1200000,
    45000,
    1200,
    '[{"id": "1", "title": "MATCHA MATCHA Can", "image": "https://matchamatcha.ca/products/can.jpg"}]'::jsonb,
    true,
    true,
    2400,
    48,
    1920.00,
    NOW() - INTERVAL '2 days'
  ),
  -- Add 2-3 more...
  (
    (SELECT id FROM companies WHERE shop_name = 'matchamatcha.ca' LIMIT 1),
    'Alex Rivera',
    'alex@healthyhabits.com',
    '@healthyhabits',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'in_discussion',
    'https://youtube.com/shorts/def456',
    'Ceremonial Grade Matcha Review',
    'https://i.ytimg.com/vi/def456/hqdefault.jpg',
    856000,
    32000,
    890,
    '[{"id": "2", "title": "Ceremonial Matcha Powder"}]'::jsonb,
    false,
    false,
    0,
    0,
    0.00,
    NOW() - INTERVAL '5 hours'
  );

-- Seed messages for Sarah's partnership
INSERT INTO messages (
  partnership_id,
  from_email,
  to_email,
  from_name,
  subject,
  body,
  thread_id,
  status,
  is_read
) VALUES
  (
    (SELECT id FROM partnerships WHERE creator_email = 'sarah@teawithsarah.com'),
    'partnerships@maatchaa.com',
    'sarah@teawithsarah.com',
    'Maatchaa',
    'Partnership Opportunity with MATCHA MATCHA',
    'Hi Sarah,\n\nWe came across your video "My Morning Matcha Routine" and were impressed by your authentic approach to wellness content...',
    gen_random_uuid(),
    'sent',
    true
  );
```

Save this as: `backend/seed_demo_data.sql`

**Run before demo:**
```bash
psql $SUPABASE_URL -f backend/seed_demo_data.sql
```

---

### Priority 2: Connect Frontend to Real Data (6-8 hours)

#### Task 2.1: Partnerships Page - Database Integration
**Time:** 3-4 hours
**Difficulty:** Medium
**Impact:** 🔥 HIGH - Core feature becomes real

**Files to modify:**
- `frontend/src/app/dashboard/partnerships/page.tsx`

**Changes:**

1. **Replace mock data with Supabase query (Lines 61-283):**

```typescript
// REMOVE this:
const mockPartnerships: Partnership[] = [ ... ];
const [partnerships, setPartnerships] = useState(mockPartnerships);

// ADD this:
const [partnerships, setPartnerships] = useState<Partnership[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchPartnerships() {
    setLoading(true);
    const { data, error } = await supabase
      .from('partnerships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching partnerships:', error);
    } else {
      // Transform data to match Partnership interface
      const transformedData = data.map(p => ({
        id: p.id,
        creatorName: p.creator_name,
        creatorHandle: p.creator_handle,
        creatorEmail: p.creator_email,
        creatorAvatar: p.creator_avatar,
        creatorFollowers: 0, // TODO: fetch from YouTube API
        videoUrl: p.video_url,
        videoTitle: p.video_title,
        videoThumbnail: p.video_thumbnail,
        views: p.video_views,
        likes: p.video_likes,
        comments: p.video_comments,
        status: p.status as Partnership['status'],
        matchedProducts: p.matched_products || [],
        contractSigned: p.contract_signed,
        contractUrl: p.contract_url,
        affiliateLinkGenerated: p.affiliate_link_generated,
        affiliateLink: p.affiliate_link,
        commissionRate: parseFloat(p.commission_rate) || 10,
        clicks: p.clicks || 0,
        conversions: p.conversions || 0,
        revenue: parseFloat(p.revenue) || 0,
        lastContact: p.last_contact_at,
        notes: p.notes || '',
      }));
      setPartnerships(transformedData);
    }
    setLoading(false);
  }

  fetchPartnerships();
}, []);

// Show loading state
if (loading) {
  return <div>Loading partnerships...</div>;
}
```

2. **Update status change handler to persist to DB:**

Find the `handleDragEnd` function (around line 300) and update it:

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  // Find the partnership and new status
  const partnership = partnerships.find((p) => p.id === activeId);
  const newStatus = overId as Partnership["status"];

  if (!partnership || partnership.status === newStatus) return;

  // Validation logic (keep existing)
  if (newStatus === "contacted" && partnership.status !== "to_contact") {
    // ... existing validation
  }

  // UPDATE: Save to database
  const { error } = await supabase
    .from('partnerships')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', activeId);

  if (error) {
    console.error('Error updating partnership:', error);
    alert('Failed to update partnership status');
    return;
  }

  // Update local state
  setPartnerships((prev) =>
    prev.map((p) => (p.id === activeId ? { ...p, status: newStatus } : p))
  );
};
```

3. **Update contract confirmation to save:**

Find the contract confirmation handler and add DB update:

```typescript
const handleContractConfirmation = async (partnershipId: string) => {
  const { error } = await supabase
    .from('partnerships')
    .update({
      contract_signed: true,
      contract_signed_at: new Date().toISOString()
    })
    .eq('id', partnershipId);

  if (error) {
    console.error('Error confirming contract:', error);
    return;
  }

  // Update local state
  setPartnerships(prev =>
    prev.map(p =>
      p.id === partnershipId
        ? { ...p, contractSigned: true }
        : p
    )
  );

  setShowContractDialog(null);
};
```

4. **Update affiliate link generation:**

```typescript
const handleGenerateAffiliateLink = async (partnershipId: string) => {
  const partnership = partnerships.find(p => p.id === partnershipId);
  if (!partnership) return;

  const affiliateLink = `https://matchamatcha.ca?ref=${partnership.creatorHandle.replace('@', '')}`;

  const { error } = await supabase
    .from('partnerships')
    .update({
      affiliate_link: affiliateLink,
      affiliate_link_generated: true
    })
    .eq('id', partnershipId);

  if (error) {
    console.error('Error generating affiliate link:', error);
    return;
  }

  // Update local state
  setPartnerships(prev =>
    prev.map(p =>
      p.id === partnershipId
        ? { ...p, affiliateLink, affiliateLinkGenerated: true }
        : p
    )
  );
};
```

**Test before demo:**
- Drag partnership between columns
- Verify status changes persist on page reload
- Confirm contract confirmation saves
- Generate affiliate link and verify it saves

---

#### Task 2.2: Products Page - Real Match Counts
**Time:** 1 hour
**Difficulty:** Easy
**Impact:** 🔥 MEDIUM - Makes metrics credible

**Files to modify:**
- `frontend/src/app/dashboard/products/page.tsx`

**Changes:**

Replace lines 141-142:

```typescript
// REMOVE:
matchCount: Math.floor(Math.random() * 20),
lastMatched: `${Math.floor(Math.random() * 24)} hours ago`,

// ADD:
// Fetch match counts from backend
const matchCountsResponse = await fetch(
  `${process.env.NEXT_PUBLIC_BACKEND_URL}/shopify/products/${shopifyProduct.id}/matches`
);
const matchData = await matchCountsResponse.json();

matchCount: matchData.total_matches || 0,
lastMatched: matchData.last_matched_at
  ? formatDistanceToNow(new Date(matchData.last_matched_at), { addSuffix: true })
  : 'Never',
```

**Note:** This requires the backend endpoint to work. If it doesn't return data, it will gracefully show 0.

---

#### Task 2.3: Communications Page - Real Email Threads
**Time:** 2-3 hours
**Difficulty:** Medium
**Impact:** 🔥 MEDIUM - Makes communication real

**Files to modify:**
- `frontend/src/app/dashboard/communications/page.tsx`

**Changes:**

1. **Fetch conversations from database:**

```typescript
// REMOVE mockConversations
// ADD real data fetch:

const [conversations, setConversations] = useState<Conversation[]>([]);

useEffect(() => {
  async function fetchConversations() {
    // Join partnerships with messages
    const { data: partnerships, error } = await supabase
      .from('partnerships')
      .select(`
        *,
        messages (*)
      `)
      .order('last_contact_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    // Transform to Conversation format
    const conversations = partnerships.map(p => ({
      id: p.id,
      creatorName: p.creator_name,
      creatorEmail: p.creator_email,
      creatorHandle: p.creator_handle,
      creatorAvatar: p.creator_avatar,
      creatorFollowers: 0, // TODO: from YouTube
      status: p.status,
      lastMessage: p.messages?.[p.messages.length - 1]?.body?.substring(0, 100) || '',
      lastMessageTime: p.last_contact_at,
      unreadCount: p.messages?.filter(m => !m.is_read).length || 0,
      isStarred: false, // TODO: add to DB
      messages: p.messages?.map(m => ({
        id: m.id,
        from: m.from_name || m.from_email,
        fromEmail: m.from_email,
        to: m.to_email,
        subject: m.subject,
        body: m.body,
        timestamp: m.created_at,
        attachments: m.attachments || [],
      })) || [],
    }));

    setConversations(conversations);
  }

  fetchConversations();
}, []);
```

2. **Make "Send Message" actually work:**

```typescript
const handleSendMessage = async () => {
  if (!messageContent.trim() || !selectedConversation) return;

  // 1. Save to database
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      partnership_id: selectedConversation.id,
      from_email: 'partnerships@maatchaa.com',
      to_email: selectedConversation.creatorEmail,
      from_name: 'Maatchaa',
      subject: `Re: ${selectedConversation.messages[0]?.subject}`,
      body: messageContent,
      thread_id: selectedConversation.messages[0]?.thread_id,
      status: 'sent',
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message');
    return;
  }

  // 2. Update partnership last_contact_at
  await supabase
    .from('partnerships')
    .update({ last_contact_at: new Date().toISOString() })
    .eq('id', selectedConversation.id);

  // 3. Optional: Actually send email via Resend
  if (process.env.NEXT_PUBLIC_SEND_REAL_EMAILS === 'true') {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: selectedConversation.creatorEmail,
        subject: `Re: ${selectedConversation.messages[0]?.subject}`,
        body: messageContent,
      }),
    });
  }

  // 4. Update UI
  setConversations(prev =>
    prev.map(conv =>
      conv.id === selectedConversation.id
        ? {
            ...conv,
            messages: [...conv.messages, {
              id: message.id,
              from: 'Maatchaa',
              fromEmail: 'partnerships@maatchaa.com',
              to: selectedConversation.creatorEmail,
              subject: `Re: ${selectedConversation.messages[0]?.subject}`,
              body: messageContent,
              timestamp: new Date().toISOString(),
              attachments: [],
            }],
            lastMessage: messageContent.substring(0, 100),
            lastMessageTime: new Date().toISOString(),
          }
        : conv
    )
  );

  setMessageContent('');
};
```

---

### Priority 2.5: Real Reel Fetching & Display (4-5 hours)

⚠️ **CURRENT ISSUE:** The reels page shows 5 hardcoded rickroll videos. Need to display actual YouTube shorts from database that have been matched to products via the backend.

#### Task 2.5.1: Connect Reels Page to Database
**Time:** 2-3 hours
**Difficulty:** Medium
**Impact:** 🔥 HIGH - Core feature showing AI video matching

**Current State:**
- `frontend/src/app/dashboard/reels/page.tsx` has hardcoded mock data (lines 26-86)
- Mock reels include rickroll URLs and placeholder images
- Only one real function exists: `checkAndTriggerIngestion()` (works but incomplete)

**What to Build:**

1. **Fetch Real Reels from Database:**

Replace mock data with actual database queries:

```typescript
// frontend/src/app/dashboard/reels/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/providers/CompanyProvider';
import { createClient } from '@/lib/supabase/client';

interface Reel {
  id: string;
  company: string;
  yt_short_url: string;
  video_title: string;
  video_thumbnail: string;
  product_imgs: string[];
  product_text: string;
  matched_products: Array<{
    id: string;
    title: string;
    image: string;
    match_score: number;
  }>;
  channel_id: string;
  channel_name: string;
  creator_email: string;
  views: number;
  created_at: string;
  status: 'pending' | 'analyzed' | 'partnered';
}

export default function ReelsPage() {
  const { companyId, shopUrl } = useCompany();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!companyId) return;

    async function fetchReels() {
      try {
        setLoading(true);
        setError(null);

        // Fetch youtube_shorts that have been matched to this company's products
        const { data: shorts, error: shortsError } = await supabase
          .from('youtube_shorts')
          .select(`
            id,
            youtube_id,
            title,
            showcase_images,
            products,
            main_image_url,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (shortsError) throw shortsError;

        // Also fetch pending shorts for this company
        const { data: pending, error: pendingError } = await supabase
          .from('yt_shorts_pending')
          .select('*')
          .eq('company', shopUrl)
          .order('created_at', { ascending: false });

        if (pendingError) throw pendingError;

        // Combine and transform data
        const allReels: Reel[] = [
          // Pending shorts
          ...(pending || []).map(p => ({
            id: p.id,
            company: p.company,
            yt_short_url: p.yt_short_url,
            video_title: 'Pending Analysis',
            video_thumbnail: p.product_imgs?.[0] || '',
            product_imgs: p.product_imgs || [],
            product_text: p.product_text || '',
            matched_products: [],
            channel_id: p.channel_id || '',
            channel_name: '',
            creator_email: p.email || '',
            views: 0,
            created_at: p.created_at,
            status: 'pending' as const,
          })),
          // Analyzed shorts
          ...(shorts || []).map(s => ({
            id: s.id,
            company: shopUrl || '',
            yt_short_url: `https://youtube.com/shorts/${s.youtube_id}`,
            video_title: s.title || 'Untitled',
            video_thumbnail: s.main_image_url || s.showcase_images?.[0] || '',
            product_imgs: s.showcase_images || [],
            product_text: s.products?.map((p: any) => p.title).join(', ') || '',
            matched_products: s.products || [],
            channel_id: '',
            channel_name: '',
            creator_email: '',
            views: 0,
            created_at: s.created_at,
            status: 'analyzed' as const,
          })),
        ];

        setReels(allReels);
      } catch (err) {
        console.error('Error fetching reels:', err);
        setError('Failed to load reels');
      } finally {
        setLoading(false);
      }
    }

    fetchReels();
  }, [companyId, shopUrl]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (reels.length === 0) {
    return (
      <EmptyState
        title="No reels found"
        description="YouTube shorts that match your products will appear here"
        action={
          <Button onClick={() => triggerVideoDiscovery()}>
            Discover Videos
          </Button>
        }
      />
    );
  }

  return (
    <div className="reels-grid">
      {reels.map(reel => (
        <ReelCard key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
```

---

2. **Backend Integration for Video Discovery:**

The backend already has video discovery logic in `service_worker.py` but it's not integrated. Need to:

**Create API endpoint to trigger video discovery:**

```python
# backend/API.py

@app.route("/discover-videos")
@require_company
async def discover_videos(request: Request, company_id: str):
    """
    Trigger YouTube video discovery for a company
    """
    # Get company info
    company = supabase.table("companies") \
        .select("shop_name") \
        .eq("id", company_id) \
        .single() \
        .execute()

    if not company.data:
        return {"error": "Company not found"}, 404

    shop_name = company.data["shop_name"]

    # Get product keywords from company's Shopify products
    products = supabase.table("shopify_products") \
        .select("title, product_type, tags") \
        .eq("company_id", company_id) \
        .limit(10) \
        .execute()

    # Extract keywords
    keywords = set()
    for product in products.data:
        keywords.add(product.get("product_type", ""))
        if product.get("tags"):
            keywords.update(product["tags"].split(","))

    # Remove empty keywords
    keywords = [k.strip() for k in keywords if k.strip()]

    if not keywords:
        keywords = ["product review"]  # Fallback

    # Search YouTube for each keyword
    from utils.yt_search import fetch_top_shorts
    discovered_videos = []

    for keyword in keywords[:3]:  # Limit to top 3 keywords
        videos = await fetch_top_shorts(
            keyword=keyword,
            max_results=5
        )
        discovered_videos.extend(videos)

    # Save to yt_shorts_pending
    for video in discovered_videos:
        # Check if already exists
        exists = supabase.table("yt_shorts_all") \
            .select("id") \
            .eq("url", video["url"]) \
            .execute()

        if exists.data:
            continue  # Skip duplicates

        # Add to yt_shorts_all
        supabase.table("yt_shorts_all").insert({
            "url": video["url"]
        }).execute()

        # Add to yt_shorts_pending for analysis
        supabase.table("yt_shorts_pending").insert({
            "company": shop_name,
            "yt_short_url": video["url"],
            "short_id": video["video_id"],
            "channel_id": video["channel_id"],
            "email": video.get("email"),
            "product_imgs": [],
            "product_text": "",
        }).execute()

    return {
        "success": True,
        "discovered_count": len(discovered_videos),
        "keywords_used": keywords[:3],
    }
```

**Create endpoint to analyze pending videos:**

```python
# backend/API.py

@app.route("/analyze-pending-videos")
@require_company
async def analyze_pending_videos(request: Request, company_id: str):
    """
    Analyze pending videos and match to products
    """
    from product_showcase import create_showcase
    from utils.shopify import get_shopify_products

    # Get company shop name
    company = supabase.table("companies") \
        .select("shop_name") \
        .eq("id", company_id) \
        .single() \
        .execute()

    shop_name = company.data["shop_name"]

    # Get pending videos for this company
    pending = supabase.table("yt_shorts_pending") \
        .select("*") \
        .eq("company", shop_name) \
        .limit(5) \
        .execute()

    results = []

    for video in pending.data:
        try:
            # Call create_showcase to analyze video
            showcase_data = await create_showcase(
                yt_short_url=video["yt_short_url"],
                company=shop_name
            )

            # Move from pending to youtube_shorts
            supabase.table("youtube_shorts").insert({
                "youtube_id": video["short_id"],
                "title": showcase_data.get("title", ""),
                "showcase_images": showcase_data.get("images", []),
                "products": showcase_data.get("products", []),
                "main_image_url": showcase_data.get("main_image", ""),
            }).execute()

            # Delete from pending
            supabase.table("yt_shorts_pending") \
                .delete() \
                .eq("id", video["id"]) \
                .execute()

            results.append({
                "video_id": video["short_id"],
                "status": "analyzed",
                "products_found": len(showcase_data.get("products", [])),
            })

        except Exception as e:
            results.append({
                "video_id": video["short_id"],
                "status": "failed",
                "error": str(e),
            })

    return {
        "analyzed": len([r for r in results if r["status"] == "analyzed"]),
        "failed": len([r for r in results if r["status"] == "failed"]),
        "results": results,
    }
```

---

3. **Frontend Actions for Video Discovery:**

Add buttons to trigger backend video discovery:

```typescript
// frontend/src/app/dashboard/reels/page.tsx

const [isDiscovering, setIsDiscovering] = useState(false);
const [isAnalyzing, setIsAnalyzing] = useState(false);

async function handleDiscoverVideos() {
  setIsDiscovering(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/discover-videos`,
      {
        method: 'POST',
        headers: {
          'X-Company-ID': companyId,
        },
      }
    );
    const data = await response.json();

    if (data.success) {
      toast.success(`Discovered ${data.discovered_count} new videos`);
      // Refresh reels list
      fetchReels();
    }
  } catch (error) {
    toast.error('Failed to discover videos');
  } finally {
    setIsDiscovering(false);
  }
}

async function handleAnalyzePending() {
  setIsAnalyzing(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/analyze-pending-videos`,
      {
        method: 'POST',
        headers: {
          'X-Company-ID': companyId,
        },
      }
    );
    const data = await response.json();

    if (data.analyzed > 0) {
      toast.success(`Analyzed ${data.analyzed} videos`);
      fetchReels();
    }
  } catch (error) {
    toast.error('Failed to analyze videos');
  } finally {
    setIsAnalyzing(false);
  }
}

// Add to UI:
<div className="actions">
  <Button
    onClick={handleDiscoverVideos}
    disabled={isDiscovering}
  >
    {isDiscovering ? 'Discovering...' : 'Discover New Videos'}
  </Button>

  <Button
    onClick={handleAnalyzePending}
    disabled={isAnalyzing}
  >
    {isAnalyzing ? 'Analyzing...' : 'Analyze Pending Videos'}
  </Button>
</div>
```

---

4. **Display Reel Cards with Product Matches:**

Create a proper ReelCard component:

```typescript
// frontend/src/components/ReelCard.tsx

interface ReelCardProps {
  reel: Reel;
}

export function ReelCard({ reel }: ReelCardProps) {
  return (
    <Card>
      {/* Video thumbnail */}
      <Box position="relative">
        <img
          src={reel.video_thumbnail || '/placeholder-video.jpg'}
          alt={reel.video_title}
          className="reel-thumbnail"
        />
        <Badge
          className="status-badge"
          color={
            reel.status === 'analyzed' ? 'green' :
            reel.status === 'pending' ? 'yellow' :
            'blue'
          }
        >
          {reel.status}
        </Badge>
      </Box>

      {/* Video info */}
      <Box p="3">
        <Text size="2" weight="medium">
          {reel.video_title}
        </Text>

        {/* Matched products */}
        {reel.matched_products.length > 0 && (
          <Box mt="2">
            <Text size="1" color="gray">
              Matched Products ({reel.matched_products.length})
            </Text>
            <Flex gap="2" mt="1">
              {reel.matched_products.slice(0, 3).map(product => (
                <Badge key={product.id} size="1">
                  {product.title}
                </Badge>
              ))}
            </Flex>
          </Box>
        )}

        {/* Creator info */}
        {reel.creator_email && (
          <Text size="1" color="gray" mt="2">
            {reel.creator_email}
          </Text>
        )}

        {/* Actions */}
        <Flex gap="2" mt="3">
          <Button
            size="1"
            variant="soft"
            onClick={() => window.open(reel.yt_short_url, '_blank')}
          >
            Watch Video
          </Button>
          {reel.status === 'analyzed' && (
            <Button
              size="1"
              variant="solid"
              color="lime"
              onClick={() => createPartnership(reel)}
            >
              Create Partnership
            </Button>
          )}
        </Flex>
      </Box>
    </Card>
  );
}
```

---

5. **Create Partnership from Reel:**

Add function to create partnership directly from a reel:

```typescript
async function createPartnership(reel: Reel) {
  const { companyId } = useCompany();

  const { data, error } = await supabase
    .from('partnerships')
    .insert({
      company_id: companyId,
      creator_name: reel.channel_name || 'Unknown',
      creator_email: reel.creator_email,
      creator_handle: `@${reel.channel_id}`,
      status: 'to_contact',
      video_url: reel.yt_short_url,
      video_title: reel.video_title,
      video_thumbnail: reel.video_thumbnail,
      video_views: reel.views,
      matched_products: reel.matched_products,
    })
    .select()
    .single();

  if (error) {
    toast.error('Failed to create partnership');
    return;
  }

  toast.success('Partnership created! Check the Partnerships tab.');
  router.push('/dashboard/partnerships');
}
```

---

#### Task 2.5.2: Update Backend Video Search
**Time:** 1-2 hours
**Difficulty:** Easy
**Impact:** 🔥 MEDIUM - Makes video discovery work better

**Fix YouTube Search Location Hardcoding:**

Currently `backend/utils/yt_search.py` has Toronto hardcoded. Make it configurable:

```python
# backend/utils/yt_search.py

async def fetch_top_shorts(
    keyword: str,
    max_results: int = 10,
    location: str = None,  # ← Make optional
    location_radius: str = "100km"
):
    """Search YouTube for shorts matching keyword"""

    search_params = {
        "part": "snippet",
        "q": keyword,
        "type": "video",
        "videoDuration": "short",
        "maxResults": max_results,
        "order": "relevance",
        "key": YOUTUBE_API_KEY,
    }

    # Only add location if provided
    if location:
        search_params["location"] = location
        search_params["locationRadius"] = location_radius

    # Rest of implementation...
```

**Allow company-specific search preferences:**

```sql
-- Add to companies table
ALTER TABLE companies ADD COLUMN search_location TEXT;
ALTER TABLE companies ADD COLUMN search_keywords JSONB DEFAULT '[]'::jsonb;

-- Example:
UPDATE companies
SET
  search_location = '43.6532,-79.3832',  -- Toronto lat/long
  search_keywords = '["matcha", "tea ceremony", "wellness"]'::jsonb
WHERE shop_name = 'matchamatcha.ca';
```

Then use in discovery:

```python
company = supabase.table("companies") \
    .select("search_location, search_keywords") \
    .eq("id", company_id) \
    .single() \
    .execute()

videos = await fetch_top_shorts(
    keyword=keyword,
    location=company.data.get("search_location"),
    max_results=5
)
```

---

**Testing Checklist:**
- [ ] Reels page loads videos from database (no more rickrolls!)
- [ ] "Discover Videos" button fetches new YouTube shorts
- [ ] "Analyze Pending" button processes videos with AI
- [ ] Product matches display correctly on reel cards
- [ ] "Create Partnership" button adds to partnerships table
- [ ] Filter reels by status (pending, analyzed, partnered)
- [ ] Pagination works for large numbers of reels

---

### Priority 3: Environment Variables Check (30 minutes)

#### Task 3.1: Verify All API Keys Are Set
**Time:** 30 minutes
**Difficulty:** Easy
**Impact:** 🔥 CRITICAL - Nothing works without these

**Action:**

1. Create `.env.example` files in both frontend and backend:

**Backend `.env.example`:**
```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI/ML Services
GEMINI_KEY=your-gemini-api-key
COHERE_KEY=your-cohere-api-key
PINECONE_KEY=your-pinecone-api-key
INDEX_NAME=maatchaa-products

# YouTube
YOUTUBE_API_KEY=your-youtube-api-key

# OAuth (optional for demo)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Email fallback
DEFAULT_EMAIL=demo@maatchaa.com
```

**Frontend `.env.local.example`:**
```env
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth
NEXTAUTH_SECRET=generate-a-random-string
NEXTAUTH_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=same-as-backend
GOOGLE_CLIENT_SECRET=same-as-backend

# Email service
RESEND_API_KEY=your-resend-api-key

# Feature flags
NEXT_PUBLIC_SEND_REAL_EMAILS=false
```

2. **Verify you have all keys:**

```bash
# Backend
cd backend
cp .env.example .env
# Fill in all values

# Frontend
cd frontend
cp .env.local.example .env.local
# Fill in all values
```

3. **Test API connections:**

Create `backend/test_connections.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

def test_env_vars():
    required = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'GEMINI_KEY',
        'COHERE_KEY',
        'PINECONE_KEY',
        'INDEX_NAME',
    ]

    missing = []
    for var in required:
        if not os.getenv(var):
            missing.append(var)

    if missing:
        print("❌ Missing environment variables:")
        for var in missing:
            print(f"  - {var}")
        return False

    print("✅ All required environment variables are set")
    return True

if __name__ == "__main__":
    test_env_vars()
```

Run before demo:
```bash
python backend/test_connections.py
```

---

### Priority 4: Quick Wins (2-3 hours total)

#### Task 4.1: Fix YouTube Email Extraction
**Time:** 15 minutes
**Difficulty:** Easy
**Impact:** LOW (but easy fix)

**File:** `backend/utils/yt_search.py`

**Change lines 84-89:**

```python
# REMOVE:
return os.getenv("DEFAULT_EMAIL")

# ADD:
# Try to extract email from description
match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", description)
if match:
    return match.group(0)

# Fallback to default email if not found
return os.getenv("DEFAULT_EMAIL", "noreply@maatchaa.com")
```

---

#### Task 4.2: Add Loading States
**Time:** 1 hour
**Difficulty:** Easy
**Impact:** MEDIUM - Better UX

**Files to modify:**
- `frontend/src/app/dashboard/partnerships/page.tsx`
- `frontend/src/app/dashboard/communications/page.tsx`
- `frontend/src/app/dashboard/products/page.tsx`

**Add loading spinners while fetching data:**

```typescript
if (loading) {
  return (
    <Box p="6">
      <Flex justify="center" align="center" minHeight="400px">
        <Spinner size="3" />
        <Text ml="3" size="3" color="gray">Loading...</Text>
      </Flex>
    </Box>
  );
}
```

---

#### Task 4.3: Add Error Handling
**Time:** 1 hour
**Difficulty:** Easy
**Impact:** MEDIUM - Prevents crashes during demo

**Add error boundaries and try-catch blocks:**

```typescript
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // ... fetch logic

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, []);

// Show error state
if (error) {
  return (
    <Box p="6">
      <Callout.Root color="red">
        <Callout.Icon>⚠️</Callout.Icon>
        <Callout.Text>{error}</Callout.Text>
      </Callout.Root>
    </Box>
  );
}
```

---

### Priority 5: Pre-Demo Testing (2 hours)

#### Task 5.1: End-to-End Demo Run
**Time:** 1 hour
**Difficulty:** Easy
**Impact:** 🔥 CRITICAL

**Action:**

1. **Start both services:**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn API:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

2. **Run through demo script:**
   - [ ] Navigate to /stores
   - [ ] Connect matchamatcha.ca
   - [ ] Verify products load
   - [ ] Go to /dashboard/products
   - [ ] Check match counts (should be real or 0, not random)
   - [ ] Go to /dashboard/partnerships
   - [ ] Verify partnerships load from database
   - [ ] Drag a partnership to different column
   - [ ] Refresh page - verify status persisted
   - [ ] Go to /dashboard/communications
   - [ ] Verify messages load
   - [ ] Try sending a message (check DB)
   - [ ] Test showcase generation with real YouTube link

3. **Record issues:**
   - Create `DEMO_ISSUES.md` to track any bugs found
   - Fix critical issues before demo

---

#### Task 5.2: Backup Plan Preparation
**Time:** 1 hour
**Difficulty:** Easy
**Impact:** HIGH - Safety net

**Action:**

1. **Record demo video (if APIs fail):**
   - Use OBS or QuickTime to record screen
   - Run through entire workflow with working APIs
   - Save as `demo-backup.mp4`

2. **Take screenshots:**
   - Product sync working
   - Partnerships kanban with real data
   - AI showcase generation result
   - Save in `demo-assets/` folder

3. **Prepare slides for broken features:**
   - "Analytics Dashboard - Coming Next Week"
   - "AI Agents - Research View"
   - Show mockups, acknowledge in-progress

---

## 📅 SHORT-TERM: WEEK 1-2 POST-PITCH

Once the pitch is done, focus on making the remaining features functional.

### Week 1: Core Workflow Completion

#### Task: Email Automation
**Time:** 6-8 hours
**Difficulty:** Medium

**What to build:**
1. Email service integration (Resend or SendGrid)
2. Email templates for outreach
3. Automated email sending from partnerships page
4. Email tracking (opens, clicks)
5. Reply detection and parsing

**Files to create:**
- `frontend/src/app/api/send-email/route.ts`
- `frontend/src/lib/email-templates.ts`
- `backend/utils/email_service.py`

**Implementation:**

```typescript
// frontend/src/app/api/send-email/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { to, subject, body, partnershipId } = await request.json();

  try {
    const { data, error } = await resend.emails.send({
      from: 'Maatchaa <partnerships@maatchaa.com>',
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Save to messages table
    await supabase.from('messages').insert({
      partnership_id: partnershipId,
      from_email: 'partnerships@maatchaa.com',
      to_email: to,
      subject: subject,
      body: body,
      status: 'sent',
      provider_message_id: data.id,
      email_provider: 'resend',
    });

    return NextResponse.json({ success: true, messageId: data.id });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
```

---

#### Task: Analytics Dashboard - Real Data
**Time:** 8-10 hours
**Difficulty:** Medium

**What to build:**
1. Database queries to aggregate partnership metrics
2. Product performance calculations
3. Creator engagement tracking
4. Revenue attribution logic
5. Connect charts to real data

**Files to modify:**
- `frontend/src/app/dashboard/analytics/page.tsx`

**Create backend aggregation endpoint:**

```python
# backend/API.py

@app.route("/analytics/overview")
async def get_analytics_overview():
    """Get high-level analytics metrics"""

    # Total partnerships by status
    partnerships_stats = supabase.table("partnerships") \
        .select("status", count="exact") \
        .execute()

    # Revenue metrics
    revenue_stats = supabase.rpc("calculate_total_revenue").execute()

    # Top performing products
    top_products = supabase.rpc("get_top_products", {
        "limit": 10
    }).execute()

    # Engagement trends (last 6 months)
    engagement_trends = supabase.rpc("get_engagement_trends", {
        "months": 6
    }).execute()

    return {
        "partnerships": partnerships_stats.data,
        "revenue": revenue_stats.data,
        "top_products": top_products.data,
        "trends": engagement_trends.data,
    }
```

**Create PostgreSQL functions in Supabase:**

```sql
-- Function: Calculate total revenue
CREATE OR REPLACE FUNCTION calculate_total_revenue()
RETURNS TABLE (
  total_revenue DECIMAL,
  total_conversions INTEGER,
  avg_order_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(revenue) as total_revenue,
    SUM(conversions) as total_conversions,
    AVG(CASE WHEN conversions > 0 THEN revenue / conversions ELSE 0 END) as avg_order_value
  FROM partnerships
  WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function: Get top performing products
CREATE OR REPLACE FUNCTION get_top_products(limit_count INT)
RETURNS TABLE (
  product_id UUID,
  product_title TEXT,
  match_count INTEGER,
  conversions INTEGER,
  revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.title,
    sp.match_count,
    COUNT(pm.id)::INTEGER as conversions,
    SUM(p.revenue) as revenue
  FROM shopify_products sp
  LEFT JOIN product_matches pm ON sp.id = pm.product_id
  LEFT JOIN partnerships p ON pm.short_id = p.video_url
  GROUP BY sp.id, sp.title, sp.match_count
  ORDER BY revenue DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get engagement trends
CREATE OR REPLACE FUNCTION get_engagement_trends(months INT)
RETURNS TABLE (
  month TEXT,
  partnerships_created INTEGER,
  emails_sent INTEGER,
  responses_received INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(date_trunc('month', created_at), 'Mon') as month,
    COUNT(*)::INTEGER as partnerships_created,
    0 as emails_sent, -- TODO: count from messages table
    0 as responses_received -- TODO: count replies
  FROM partnerships
  WHERE created_at >= NOW() - INTERVAL '1 month' * months
  GROUP BY date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at);
END;
$$ LANGUAGE plpgsql;
```

---

### Week 2: AI Agent Integration

#### Task: Implement Real AI Agents
**Time:** 12-16 hours
**Difficulty:** Hard

**What to build:**
1. Backend AI agent service (using Claude API or OpenAI)
2. Agent action execution logic
3. Frontend chat integration
4. Action result display
5. Agent memory/context management

**Architecture:**

```
User message → Frontend → Backend AI Agent Service → Claude/GPT
                                  ↓
                          Action execution (search creators, draft email, etc.)
                                  ↓
                          Save to agent_conversations table
                                  ↓
                          Return response + actions to frontend
```

**Create backend AI agent:**

```python
# backend/agents/outreach_agent.py

import anthropic
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class OutreachAgent:
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.conversation_id = None

    async def chat(self, user_message: str):
        """Process user message and execute actions"""

        # Get conversation history
        conversation = await self.get_conversation_history()

        # Build context with available tools
        tools = [
            {
                "name": "search_creators",
                "description": "Search YouTube for creators matching specific criteria",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "keyword": {"type": "string"},
                        "min_subscribers": {"type": "integer"},
                    }
                }
            },
            {
                "name": "draft_email",
                "description": "Draft a personalized outreach email",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "creator_name": {"type": "string"},
                        "video_title": {"type": "string"},
                        "products": {"type": "array"},
                    }
                }
            }
        ]

        # Call Claude with tools
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            tools=tools,
            messages=[
                *conversation,
                {"role": "user", "content": user_message}
            ]
        )

        # Execute tool calls
        actions = []
        for content_block in response.content:
            if content_block.type == "tool_use":
                result = await self.execute_tool(
                    content_block.name,
                    content_block.input
                )
                actions.append({
                    "type": content_block.name,
                    "input": content_block.input,
                    "result": result,
                    "status": "completed",
                })

        # Save conversation
        await self.save_message(user_message, response.content, actions)

        return {
            "message": response.content,
            "actions": actions,
        }

    async def execute_tool(self, tool_name: str, tool_input: dict):
        """Execute agent actions"""
        if tool_name == "search_creators":
            from utils.yt_search import fetch_top_shorts
            results = await fetch_top_shorts(
                keyword=tool_input["keyword"],
                max_results=5
            )
            return results

        elif tool_name == "draft_email":
            # Generate email using template
            email = f"""
            Hi {tool_input['creator_name']},

            We loved your video "{tool_input['video_title']}"!

            We think our products would be perfect for your audience:
            {', '.join(tool_input['products'])}

            Interested in partnering?

            Best,
            Maatchaa Team
            """
            return {"email": email}

        return None
```

**Frontend integration:**

```typescript
// frontend/src/app/dashboard/agents/page.tsx

const handleSendMessage = async () => {
  if (!messageInput.trim() || !selectedAgent) return;

  const userMessage = {
    id: generateId(),
    role: 'user' as const,
    content: messageInput,
    timestamp: new Date().toISOString(),
  };

  // Update UI optimistically
  setAgents(prev =>
    prev.map(agent =>
      agent.id === selectedAgent.id
        ? { ...agent, messages: [...agent.messages, userMessage] }
        : agent
    )
  );
  setMessageInput('');
  setIsAgentThinking(true);

  try {
    // Call backend agent
    const response = await fetch('/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: selectedAgent.id,
        message: messageInput,
      }),
    });

    const data = await response.json();

    // Add agent response with actions
    const agentMessage = {
      id: generateId(),
      role: 'agent' as const,
      content: data.message,
      timestamp: new Date().toISOString(),
      action: data.actions?.[0] || null, // Show first action
    };

    setAgents(prev =>
      prev.map(agent =>
        agent.id === selectedAgent.id
          ? { ...agent, messages: [...agent.messages, agentMessage] }
          : agent
      )
    );
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    setIsAgentThinking(false);
  }
};
```

**Create API route:**

```typescript
// frontend/src/app/api/agents/chat/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { agentId, message } = await request.json();

  try {
    // Call backend agent service
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/agents/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          message: message,
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get agent response' },
      { status: 500 }
    );
  }
}
```

---

## 🚀 LONG-TERM: MONTH 1+

### Advanced Features

#### 1. Multi-Store Support (Week 3)
**Time:** 8 hours

- Remove hardcoded `matchamatcha.ca`
- Add company/store management page
- Support multiple Shopify stores per account
- Per-store product catalogs and partnerships

**Database changes:**
```sql
ALTER TABLE partnerships ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE shopify_products ADD COLUMN company_id UUID REFERENCES companies(id);
CREATE INDEX idx_partnerships_company ON partnerships(company_id);
```

---

#### 2. Automated Creator Discovery (Week 3-4)
**Time:** 12 hours

- Scheduled service worker (cron job)
- Automatic YouTube shorts monitoring
- AI-powered creator scoring
- Auto-populate "To Contact" partnerships

**Implementation:**
- Deploy `service_worker.py` to Cloud Run with Cloud Scheduler
- Run every 6 hours
- Fetch new shorts → Match products → Create partnership records
- Email notification to account owner

---

#### 3. Contract Management (Week 4)
**Time:** 10 hours

- LaTeX to PDF generation (keep existing template)
- DocuSign or HelloSign integration for e-signatures
- Contract versioning
- Automated reminders for unsigned contracts

---

#### 4. Advanced Analytics (Week 5-6)
**Time:** 16 hours

- Conversion funnel tracking
- A/B testing for email templates
- Creator performance predictions
- ROI calculator per partnership
- Export reports (PDF, CSV)

---

#### 5. Creator Portal (Week 6-8)
**Time:** 20 hours

**Separate interface for creators:**
- Login with YouTube OAuth
- View partnership offers
- Accept/decline partnerships
- Upload content
- Track commissions
- Payment dashboard

**New pages:**
- `/creator/dashboard`
- `/creator/partnerships`
- `/creator/analytics`
- `/creator/payouts`

---

## 📊 PROGRESS TRACKING

### Pre-Pitch Checklist (48 hours)

**🔒 Priority 0: Authentication & Multi-Tenancy (6-8 hours)**
- [ ] Create `brand_users` table
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Create RLS policies for company isolation
- [ ] Build login/signup pages
- [ ] Configure NextAuth with Supabase
- [ ] Create `useCompany()` hook
- [ ] Add CompanyProvider to dashboard layout
- [ ] Update all Supabase queries to filter by company_id
- [ ] Add company_id validation to backend endpoints
- [ ] Create demo accounts for pitch
- [ ] Test login as Company A → See only Company A data
- [ ] Test login as Company B → See only Company B data

**📊 Priority 1: Database Foundation (4-6 hours)**
- [ ] Create `partnerships` table
- [ ] Create `messages` table
- [ ] Create `agent_conversations` table
- [ ] Seed demo data for partnerships
- [ ] Seed demo data for messages
- [ ] Test database connections

**🔗 Priority 2: Frontend Integration (6-8 hours)**
- [ ] Connect partnerships page to DB
- [ ] Make drag-drop persist to database
- [ ] Connect communications page to DB
- [ ] Make send message actually work
- [ ] Fix product match counts (real data, not random)
- [ ] Add loading states
- [ ] Add error handling

**🎬 Priority 2.5: Real Reel Fetching & Display (4-5 hours)**
- [ ] Replace mock reels data with database queries
- [ ] Fetch from `youtube_shorts` table
- [ ] Fetch from `yt_shorts_pending` table
- [ ] Create `/discover-videos` backend endpoint
- [ ] Create `/analyze-pending-videos` backend endpoint
- [ ] Add "Discover Videos" button to frontend
- [ ] Add "Analyze Pending" button to frontend
- [ ] Create ReelCard component with product matches
- [ ] Add "Create Partnership" from reel functionality
- [ ] Fix YouTube search location hardcoding
- [ ] Test video discovery workflow end-to-end

**🔑 Priority 3: Environment & Testing (3 hours)**
- [ ] Verify all API keys (Gemini, Cohere, Pinecone, YouTube)
- [ ] Create .env.example files
- [ ] Run end-to-end demo
- [ ] Record backup demo video
- [ ] Prepare slides for incomplete features
- [ ] Test with multiple company accounts

**⚡ Priority 4: Quick Fixes (2 hours)**
- [ ] Fix YouTube email extraction
- [ ] Test email sending
- [ ] Test showcase generation

**Total: ~25-32 hours of focused work**

**💡 Recommended Focus Order:**
1. **Start with Priority 0** - Without multi-tenancy, demo will fail hard
2. **Then Priority 1** - Database tables are foundation
3. **Then Priority 2.5** - Reels are core value prop
4. **Then Priority 2** - Polish partnerships/communications
5. **Finally Priority 3 & 4** - Testing and quick wins

---

### Week 1-2 Checklist

- [ ] Email automation (Resend integration)
- [ ] Analytics with real data
- [ ] AI agent backend (Claude/GPT)
- [ ] Agent action execution
- [ ] Contract PDF generation

---

### Month 1+ Checklist

- [ ] Multi-store support
- [ ] Automated creator discovery
- [ ] Advanced analytics
- [ ] Creator portal
- [ ] Payment processing

---

## 🎯 SUCCESS METRICS

### For the Pitch:
- ✅ **Authentication works** - Can login as different companies
- ✅ **Multi-tenancy works** - Each company sees only their data
- ✅ **Product sync works live** (real Shopify data)
- ✅ **AI showcase generation works** (real Gemini API)
- ✅ **Partnerships persist to database** (drag-drop saves)
- ✅ **Reels show real videos from database** (no more rickrolls!)
- ✅ **Video discovery works** - Can trigger YouTube search
- ✅ **No crashes during 15-minute demo**
- ✅ **All pages load without errors**
- ✅ **Data separation is secure** - Company A can't see Company B

### Week 2:
- ✅ Can send real emails to creators
- ✅ Analytics show real partnership data
- ✅ At least one AI agent is functional

### Month 1:
- ✅ Full partnership workflow (discovery → contract → payment)
- ✅ 5+ real creators in pipeline
- ✅ 1+ signed partnership
- ✅ Revenue attribution working

### Month 3:
- ✅ 50+ creators in database
- ✅ 10+ active partnerships
- ✅ Creator portal launched
- ✅ Multi-store support
- ✅ $1K+ in tracked revenue

---

## 💡 TIPS FOR EXECUTION

### Time Management
- **Focus on Priority 1-3 ONLY before pitch** (don't get distracted)
- Use Pomodoro technique (25 min work, 5 min break)
- If stuck on one task >1 hour, move to next and ask for help

### Development Workflow
1. **Start with database** - Without tables, nothing works
2. **Test incrementally** - Don't write 100 lines without testing
3. **Git commit frequently** - Commit after each working feature
4. **Keep backups** - Don't delete mock data until real data works

### Demo Preparation
- **Practice the demo 3+ times** before the pitch
- **Have fallbacks** for every live demo element
- **Know what NOT to click** during demo
- **Prepare answers** for "does this actually work?" questions

### If You Get Stuck
1. Check IMPLEMENTATION_STATUS.md for file/line references
2. Test API endpoints individually (Postman/curl)
3. Check Supabase logs for database errors
4. Console.log everything during debugging
5. Ask for help in Discord/Slack after 30 min stuck

---

## 📝 FINAL NOTES

**Reality Check:**
- The 48-hour pre-pitch plan is aggressive but doable
- You might not finish everything - **prioritize database + partnerships page**
- A working partnerships page alone is a huge win
- Don't sacrifice sleep - demo well-rested is better than demo with buggy code

**What Makes a Good Pitch:**
- 2-3 working features >> 10 broken features
- Be honest about what's in progress
- Show the vision with mockups for incomplete features
- Focus on the AI technology (it's genuinely impressive)

**Remember:**
- Mock data isn't a failure if you acknowledge it
- "We built the UI first to validate UX" is a valid strategy
- Investors care more about problem-solution fit than perfect code
- Your AI video matching is the real differentiator

**You got this! 🚀**
