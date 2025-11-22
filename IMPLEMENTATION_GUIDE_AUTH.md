# Company Account Separation - Implementation Guide
## Step-by-Step: Multi-Tenancy & Authentication

**Goal:** Each company gets their own isolated dashboard with secure data separation.

**Time Estimate:** 6-8 hours

**Current Problem:** All companies see the same data - major security flaw!

---

## 🚀 STEP 1: Database Setup (1 hour)

### 1.1: Create Brand Users Table

Open your Supabase SQL Editor and run:

```sql
-- Create brand_users table for company login
CREATE TABLE brand_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company_id UUID REFERENCES companies(id) NOT NULL,
  role TEXT DEFAULT 'owner',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brand_users_email ON brand_users(email);
CREATE INDEX idx_brand_users_company ON brand_users(company_id);

-- Trigger to update updated_at
CREATE TRIGGER update_brand_users_updated_at
  BEFORE UPDATE ON brand_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Verify it worked:**
```sql
SELECT * FROM brand_users LIMIT 1;
-- Should return empty table (no error)
```

---

### 1.2: Add company_id to All Tables

Some tables already have `company_id`, but we need to ensure ALL tables have it:

```sql
-- Check which tables need company_id added
-- Run these one by one:

-- Partnerships (already has company_id from dev plan)
-- Already created in Priority 1

-- Shopify products
ALTER TABLE shopify_products
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- YouTube shorts
ALTER TABLE youtube_shorts
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Pending shorts
ALTER TABLE yt_shorts_pending
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Matches
ALTER TABLE product_matches
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shopify_products_company ON shopify_products(company_id);
CREATE INDEX IF NOT EXISTS idx_youtube_shorts_company ON youtube_shorts(company_id);
CREATE INDEX IF NOT EXISTS idx_yt_shorts_pending_company ON yt_shorts_pending(company_id);
CREATE INDEX IF NOT EXISTS idx_product_matches_company ON product_matches(company_id);
```

---

### 1.3: Enable Row Level Security (RLS)

This is the CRITICAL security step - prevents companies from seeing each other's data:

```sql
-- Enable RLS on all tables
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_shorts_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_matches ENABLE ROW LEVEL SECURITY;
```

---

### 1.4: Create RLS Policies

These policies enforce data isolation:

```sql
-- Policy: Users can only see their company's partnerships
CREATE POLICY partnerships_company_isolation ON partnerships
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only see their company's products
CREATE POLICY products_company_isolation ON shopify_products
  FOR ALL
  USING (
    company_id IN (
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
      WHERE company_id IN (
        SELECT company_id FROM brand_users
        WHERE id = auth.uid()
      )
    )
  );

-- Policy: Users can only see their company's agent conversations
CREATE POLICY agents_company_isolation ON agent_conversations
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only see their company's youtube shorts
CREATE POLICY youtube_shorts_company_isolation ON youtube_shorts
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only see their company's pending shorts
CREATE POLICY yt_shorts_pending_company_isolation ON yt_shorts_pending
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only see their company's product matches
CREATE POLICY product_matches_company_isolation ON product_matches
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM brand_users
      WHERE id = auth.uid()
    )
  );
```

**⚠️ IMPORTANT:** If you get errors about `auth.uid()` not existing, you may need to use a different approach. For now, we'll handle auth in the frontend.

---

### 1.5: Create Demo Accounts

Create 2 test companies and users for the demo:

```sql
-- First, check if companies exist
SELECT * FROM companies WHERE shop_name = 'matchamatcha.ca';

-- If matchamatcha.ca doesn't exist, create it:
INSERT INTO companies (id, shop_name, access_token, ingested)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'matchamatcha.ca', 'demo-token', true)
ON CONFLICT (shop_name) DO NOTHING;

-- Create second demo company
INSERT INTO companies (id, shop_name, access_token, ingested)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'teahouse.myshopify.com', 'demo-token-2', false)
ON CONFLICT (shop_name) DO NOTHING;

-- Create brand users (password is 'password123' hashed with bcrypt)
-- You'll need to generate real bcrypt hashes - for now we'll use plaintext and hash in code
INSERT INTO brand_users (email, full_name, company_id, password_hash)
VALUES
  (
    'demo@matchamatcha.ca',
    'Matcha Demo User',
    '00000000-0000-0000-0000-000000000001',
    '$2b$10$rKJqGvXJnLzYbYvWfGKZWOxB5KZWqvXQwFKLZJqGvXJnLzYbYvWfG' -- placeholder
  ),
  (
    'demo@teahouse.com',
    'Tea House Owner',
    '00000000-0000-0000-0000-000000000002',
    '$2b$10$rKJqGvXJnLzYbYvWfGKZWOxB5KZWqvXQwFKLZJqGvXJnLzYbYvWfG' -- placeholder
  )
ON CONFLICT (email) DO NOTHING;

-- Verify accounts created
SELECT
  bu.email,
  bu.full_name,
  c.shop_name
FROM brand_users bu
JOIN companies c ON bu.company_id = c.id;
```

**Output should show:**
```
demo@matchamatcha.ca | Matcha Demo User | matchamatcha.ca
demo@teahouse.com    | Tea House Owner  | teahouse.myshopify.com
```

---

## 🔐 STEP 2: Install Auth Dependencies (15 minutes)

### 2.1: Install NextAuth and bcrypt

```bash
cd frontend

# Install authentication packages
npm install next-auth@4.24.11
npm install bcryptjs
npm install @types/bcryptjs --save-dev

# Install Supabase adapter for NextAuth
npm install @next-auth/supabase-adapter
```

---

## 💻 STEP 3: Configure NextAuth (1 hour)

### 3.1: Create Auth Configuration

Create file: `frontend/src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const supabase = createClient();

        // Get user from database
        const { data: user, error } = await supabase
          .from('brand_users')
          .select(`
            id,
            email,
            password_hash,
            full_name,
            company_id,
            companies (
              id,
              shop_name
            )
          `)
          .eq('email', credentials.email)
          .eq('is_active', true)
          .single();

        if (error || !user) {
          console.error('User not found:', error);
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          console.error('Invalid password');
          return null;
        }

        // Update last login
        await supabase
          .from('brand_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          companyId: user.company_id,
          companyName: user.companies.shop_name,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

---

### 3.2: Create NextAuth Types

Create file: `frontend/src/types/next-auth.d.ts`

```typescript
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    companyId: string;
    companyName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      companyId: string;
      companyName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companyId: string;
    companyName: string;
  }
}
```

---

### 3.3: Create NextAuth API Route

Create file: `frontend/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

## 🎨 STEP 4: Create Login Page (1 hour)

### 4.1: Create Login Page

Create file: `frontend/src/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Card, Flex, Text, TextField, Button, Heading } from '@radix-ui/themes';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard/overview');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--sand-2)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Heading size="6" align="center">
              Maatchaa
            </Heading>
            <Text size="2" align="center" color="gray">
              Sign in to your account
            </Text>

            {error && (
              <Box
                p="3"
                style={{
                  background: 'var(--red-3)',
                  border: '1px solid var(--red-6)',
                  borderRadius: '6px',
                }}
              >
                <Text size="2" color="red">
                  {error}
                </Text>
              </Box>
            )}

            <Box>
              <Text size="2" weight="medium" mb="1">
                Email
              </Text>
              <TextField.Root
                type="email"
                placeholder="demo@matchamatcha.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Box>

            <Box>
              <Text size="2" weight="medium" mb="1">
                Password
              </Text>
              <TextField.Root
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Box>

            <Button
              type="submit"
              size="3"
              variant="solid"
              color="lime"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box mt="2" p="3" style={{ background: 'var(--sand-3)', borderRadius: '6px' }}>
              <Text size="1" color="gray">
                <strong>Demo Accounts:</strong><br />
                demo@matchamatcha.ca<br />
                demo@teahouse.com<br />
                Password: password123
              </Text>
            </Box>
          </Flex>
        </form>
      </Card>
    </Box>
  );
}
```

---

## 🛡️ STEP 5: Protect Routes with Middleware (30 minutes)

### 5.1: Create Middleware

Create file: `frontend/src/middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/partnerships/:path*',
  ],
};
```

---

## 🔗 STEP 6: Create Company Context (1 hour)

### 6.1: Create Company Hook

Create file: `frontend/src/hooks/useCompany.ts`

```typescript
import { useSession } from 'next-auth/react';

export function useCompany() {
  const { data: session, status } = useSession();

  return {
    companyId: session?.user?.companyId || null,
    companyName: session?.user?.companyName || null,
    userId: session?.user?.id || null,
    userEmail: session?.user?.email || null,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  };
}
```

---

### 6.2: Create Company Provider

Create file: `frontend/src/providers/CompanyProvider.tsx`

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

### 6.3: Wrap Dashboard Layout

Update file: `frontend/src/app/dashboard/layout.tsx`

```typescript
import { CompanyProvider } from '@/providers/CompanyProvider';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <CompanyProvider>
      <div className="dashboard-layout">
        {/* Your existing dashboard layout */}
        {children}
      </div>
    </CompanyProvider>
  );
}
```

---

## 🔄 STEP 7: Update All Database Queries (2-3 hours)

This is the most tedious but CRITICAL step. You need to update EVERY Supabase query to filter by company_id.

### 7.1: Update Partnerships Page

File: `frontend/src/app/dashboard/partnerships/page.tsx`

**Find and replace:**

```typescript
// ❌ BEFORE (line ~680):
const { data, error } = await supabase
  .from('partnerships')
  .select('*')
  .order('created_at', { ascending: false });

// ✅ AFTER:
const { companyId } = useCompany();

const { data, error } = await supabase
  .from('partnerships')
  .select('*')
  .eq('company_id', companyId)  // ← ADD THIS
  .order('created_at', { ascending: false });
```

**For inserts, add company_id:**

```typescript
// ❌ BEFORE:
await supabase
  .from('partnerships')
  .insert({
    creator_name: 'Sarah Chen',
    // ...
  });

// ✅ AFTER:
const { companyId } = useCompany();

await supabase
  .from('partnerships')
  .insert({
    company_id: companyId,  // ← ADD THIS
    creator_name: 'Sarah Chen',
    // ...
  });
```

---

### 7.2: Update Products Page

File: `frontend/src/app/dashboard/products/page.tsx`

The products page currently fetches from Shopify directly. We need to:

1. Fetch company's shop URL from context
2. Use that to fetch products

```typescript
// Add to top of component:
const { companyName } = useCompany();

// Then in the fetch:
const shopifyStoreUrl = `https://${companyName}`;
const response = await fetch(`${shopifyStoreUrl}/products.json`);
```

---

### 7.3: Update Reels Page

File: `frontend/src/app/dashboard/reels/page.tsx`

```typescript
// Add to component:
const { companyId } = useCompany();

// Update queries:
const { data: shorts } = await supabase
  .from('youtube_shorts')
  .select('*')
  .eq('company_id', companyId)  // ← ADD
  .order('created_at', { ascending: false });

const { data: pending } = await supabase
  .from('yt_shorts_pending')
  .select('*')
  .eq('company_id', companyId)  // ← ADD
  .order('created_at', { ascending: false });
```

---

### 7.4: Update Communications Page

File: `frontend/src/app/dashboard/communications/page.tsx`

```typescript
const { companyId } = useCompany();

const { data: partnerships } = await supabase
  .from('partnerships')
  .select(`
    *,
    messages (*)
  `)
  .eq('company_id', companyId)  // ← ADD
  .order('last_contact_at', { ascending: false });
```

---

### 7.5: Update Agents Page

File: `frontend/src/app/dashboard/agents/page.tsx`

```typescript
const { companyId } = useCompany();

const { data: agents } = await supabase
  .from('agent_conversations')
  .select('*')
  .eq('company_id', companyId)  // ← ADD
  .order('created_at', { ascending: false });
```

---

## 🧪 STEP 8: Update Environment Variables (15 minutes)

### 8.1: Add to frontend/.env.local

```env
# NextAuth
NEXTAUTH_SECRET=your-random-secret-here-generate-with-openssl
NEXTAUTH_URL=http://localhost:3000

# Supabase (should already have these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🧪 STEP 9: Generate Real Password Hashes (30 minutes)

The passwords in the database are placeholder hashes. Let's generate real ones.

### 9.1: Create Password Hasher Script

Create file: `frontend/scripts/hash-password.js`

```javascript
const bcrypt = require('bcryptjs');

const password = 'password123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password:', password);
    console.log('Hash:', hash);
  }
});
```

**Run it:**
```bash
cd frontend
node scripts/hash-password.js
```

**Copy the hash and update database:**

```sql
UPDATE brand_users
SET password_hash = '$2b$10$YOUR_GENERATED_HASH_HERE'
WHERE email = 'demo@matchamatcha.ca';

UPDATE brand_users
SET password_hash = '$2b$10$YOUR_GENERATED_HASH_HERE'
WHERE email = 'demo@teahouse.com';
```

---

## ✅ STEP 10: Test Everything (1 hour)

### 10.1: Start the App

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn API:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 10.2: Test Login

1. Go to `http://localhost:3000/login`
2. Enter: `demo@matchamatcha.ca` / `password123`
3. Should redirect to `/dashboard/overview`
4. Check browser console - should see session with companyId

### 10.3: Test Data Isolation

**Test A: Login as Company 1**
```
1. Login: demo@matchamatcha.ca
2. Go to /dashboard/partnerships
3. Create a test partnership
4. Note the partnership details
5. Logout
```

**Test B: Login as Company 2**
```
1. Login: demo@teahouse.com
2. Go to /dashboard/partnerships
3. Should NOT see Company 1's partnership
4. Create a different partnership
5. Verify only this company's data visible
```

**Test C: Verify in Database**
```sql
-- Check partnerships by company
SELECT
  p.id,
  p.creator_name,
  c.shop_name as company
FROM partnerships p
JOIN companies c ON p.company_id = c.id
ORDER BY c.shop_name;
```

### 10.4: Test Protected Routes

1. Logout (should have logout button in dashboard)
2. Try to visit `/dashboard/partnerships` directly
3. Should redirect to `/login`

### 10.5: Test Session Persistence

1. Login
2. Refresh page
3. Should stay logged in
4. Close browser and reopen
5. Should still be logged in (for 30 days)

---

## 🐛 Common Issues & Fixes

### Issue: "auth is not defined" in RLS policies

**Solution:** RLS policies with `auth.uid()` require Supabase Auth. Since we're using NextAuth, we need a different approach.

**Fix:** Remove RLS policies for now, rely on application-level filtering:

```sql
-- Disable RLS temporarily (we'll enforce in code)
ALTER TABLE partnerships DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- etc...
```

Make SURE every query has `.eq('company_id', companyId)`.

---

### Issue: "Cannot read property 'companyId' of undefined"

**Solution:** `useCompany()` hook returns null before session loads.

**Fix:** Add loading check:

```typescript
const { companyId, isLoading } = useCompany();

if (isLoading) {
  return <div>Loading...</div>;
}

if (!companyId) {
  redirect('/login');
}
```

---

### Issue: Login works but dashboard shows no data

**Solution:** Queries might not be using `companyId` filter.

**Fix:** Check browser console for errors. Verify queries:

```typescript
console.log('Company ID:', companyId);

const { data, error } = await supabase
  .from('partnerships')
  .select('*')
  .eq('company_id', companyId);

console.log('Partnerships:', data, error);
```

---

### Issue: NextAuth session not persisting

**Solution:** Check NEXTAUTH_SECRET is set.

**Fix:**

```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET=your-generated-secret
```

Restart dev server.

---

## 📋 Final Checklist

Before moving to the next priority, verify:

- [ ] Database tables created (brand_users, company_id columns)
- [ ] RLS enabled and policies created (or disabled and using app-level)
- [ ] Demo accounts created and passwords hashed
- [ ] NextAuth installed and configured
- [ ] Login page works
- [ ] Middleware protects dashboard routes
- [ ] useCompany() hook returns correct data
- [ ] All Supabase queries filter by company_id
- [ ] Login as Company A → See only Company A data
- [ ] Login as Company B → See only Company B data
- [ ] Logout works
- [ ] Session persists on refresh
- [ ] Protected routes redirect to login when not authenticated

---

## 🎯 What's Next?

Once company separation is working, you can move to:

1. **Priority 1:** Database foundation (partnerships, messages tables)
2. **Priority 2.5:** Real reel fetching
3. **Priority 2:** Connect frontend to real data

---

## 💡 Tips for Success

1. **Test after each step** - Don't write all the code before testing
2. **Use console.log liberally** - Especially for companyId values
3. **Check Supabase logs** - Database errors show up there
4. **One page at a time** - Start with partnerships, then move to others
5. **Commit after each working step** - Easy to roll back if needed

---

**Estimated Time:**
- Database setup: 1 hour
- Auth configuration: 1.5 hours
- Login page: 1 hour
- Update queries: 2-3 hours
- Testing: 1 hour
- Debugging: 1 hour

**Total: 6-8 hours**

Good luck! This is the foundation that makes everything else work. 🚀
