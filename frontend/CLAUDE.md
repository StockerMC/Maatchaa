# Claude Context: Frontend Codebase

## Quick Reference Files

I have provided you with a general index of the frontend codebase structure below. This index may or may not be up to date, so please verify file locations and implementations as needed.

## Tech Stack Summary

- **Next.js 15.5.3** with App Router, React Server Components, Turbopack
- **React 19.1.0** 
- **Radix UI Themes 3.2.1** - Primary UI component library
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Utility-first styling
- **Supabase** - PostgreSQL database and auth
- **@dnd-kit** - Drag and drop functionality

## File Index

### Core App Structure (`/src/app`)

- **`page.tsx`** - Homepage with hero section, features, and waitlist signup
- **`layout.tsx`** - Root layout with providers, global fonts, metadata, and theme config
- **`globals.css`** - Global styles, Radix UI theme configuration, CSS variables

### Dashboard Routes (`/src/app/dashboard`)

- **`partnerships/page.tsx`** - Kanban board for managing creator partnerships (4 columns: To Contact, Contacted, In Discussion, Active). Includes drag-and-drop, modal dialogs, validation rules.
- **`communications/page.tsx`** - Email thread management UI with two-pane layout (conversation list + message thread). Handles creator communications.
- **`agents/page.tsx`** - AI agent chat interface with agent selection sidebar and conversation view
- **`analytics/page.tsx`** - Performance metrics dashboard with charts and KPIs
- **`creators/page.tsx`** - Creator discovery and search interface

### API Routes (`/src/app/api`)

- **`auth/[...nextauth]/route.ts`** - NextAuth.js configuration and handlers
- **`partnerships/route.ts`** - Partnership CRUD operations
- **`products/route.ts`** - Product data endpoints
- **`store/route.ts`** - Store information endpoints

### Components (`/src/components`)

**Landing Page Components:**
- **`Header.tsx`** - Main navigation header with logo and menu
- **`Footer.tsx`** - Site footer with links and branding
- **`VideoStepSync.tsx`** - Video synchronized with scrolling steps
- **`PhoneImageScroller.tsx`** - Phone mockup with scrolling images
- **`YoutubeReels.tsx`** - YouTube shorts/reels display component

**Dashboard Components (`/src/components/dashboard`):**
- **`DashboardLayout.tsx`** - Main dashboard layout wrapper
- **`Sidebar.tsx`** - Dashboard navigation sidebar

**Utility Components:**
- **`Providers.tsx`** - Context providers wrapper (NextAuth, theme, etc.)
- **`ConditionalHeader.tsx`** - Header that shows/hides based on route
- **`CardSwap.tsx`** - Animated card swapping component
- **`Iridescence.tsx`** - Iridescent gradient background effect

### Library Files (`/src/lib`)

- **`supabase.ts`** - Supabase client for browser-side queries
- **`supabaseAdmin.ts`** - Supabase admin client for server-side operations
- **`utils.ts`** - Utility functions (cn helper, formatters, etc.)
- **`cookies.ts`** - Cookie management utilities for auth
- **`channelStorage.ts`** - YouTube channel data storage utilities

### Types (`/src/types`)

- **`next-auth.d.ts`** - NextAuth TypeScript type extensions for custom session/user properties

## Design System Rules (Critical)

### Radix UI Documentation
- **Official Docs**: https://www.radix-ui.com/themes/docs
- **Components**: https://www.radix-ui.com/themes/docs/components
- **Colors**: https://www.radix-ui.com/colors

### Component Guidelines

**DO:**
- Use Radix Themes components (`Card`, `Flex`, `Box`, `Text`, `Button`, etc.)
- Use `solid` `lime` for primary CTAs
- Use `soft` `gray` for secondary actions
- Use `soft` `cyan` for external links/watch actions
- Use Radix color tokens: `var(--sage-11)`, `sand.sand2`, etc.
- Keep icons minimal (ExternalLink, MoreVertical only when needed)
- Use fixed button widths (220px) in modals for consistency

**DON'T:**
- Don't use `outline` or `surface` button variants
- Don't add custom borders to Radix `Card` (already has borders)
- Don't use icons for metrics (show "1.2M views" not Eye icon + number)
- Don't make buttons 100% width (use 220px fixed width)
- Don't use `sand.sand3` for highlights (use `sand.sand2` for subtle)

### Typography Scale
```
size="8" weight="bold" - H1 Page titles
size="6" weight="bold" - H2 Section headers  
size="3" weight="medium" - Card titles
size="2" - Body text
size="1" color="sage.sage11" - Captions/meta
```

### Color Usage
- **Primary Brand**: Lime (`lime.lime9`, `#DDEBB2`)
- **Backgrounds**: Sand/Sage scales (1-3)
- **Text**: Sage (11-12)
- **Borders**: Sand/Sage (4-6)
- **Status Badges**: Blue (To Contact), Amber (Contacted), Orange (In Discussion), Purple (Active)

## Common Patterns

### Kanban Board Pattern
```tsx
// Equal height columns with flex
<Flex gap="4" style={{ alignItems: "stretch" }}>
  <Box style={{ width: "320px", display: "flex", flexDirection: "column" }}>
    <Flex direction="column" gap="3" style={{ height: "100%" }}>
      {/* Column content */}
      <Box style={{ flex: 1, minHeight: "400px" }}>
        {/* Cards */}
      </Box>
    </Flex>
  </Box>
</Flex>
```

### Modal Dialog Pattern
```tsx
<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Content style={{ maxWidth: "500px" }}>
    <Dialog.Title>Title</Dialog.Title>
    <Flex direction="column" gap="4">
      {/* Content */}
      <Button variant="solid" color="lime" style={{ width: "220px" }}>
        Primary Action
      </Button>
      <Button variant="soft" color="cyan" style={{ width: "220px" }}>
        Secondary Action
      </Button>
    </Flex>
  </Dialog.Content>
</Dialog.Root>
```

### Highlighted Card Pattern
```tsx
// For selected conversations/agents
<Box
  onClick={() => setSelected(item)}
  style={{
    padding: "0.75rem",
    borderRadius: "10px",
    background: selected?.id === item.id ? sand.sand2 : "transparent",
    cursor: "pointer",
    transition: "background 0.2s",
  }}
>
  {/* Card content */}
</Box>
```

## Key Implementation Details

### Partnerships Kanban (`partnerships/page.tsx`)
- Uses `@dnd-kit/core` for drag-and-drop
- 4 status columns with validation on status changes
- Cards show: creator avatar, name, handle, video title, matched products (max 2 + count), metrics
- Actions modal with embedded YouTube video (700px width)
- Button widths: 220px fixed
- "Watch Video" buttons: `soft` `cyan`

### Communications (`communications/page.tsx`)
- Two-pane layout: conversation list (left) + message thread (right)
- Selected conversation: `sand.sand2` background
- Displays creator info, email thread, related products
- Draft email functionality with AI generation

### Agents (`agents/page.tsx`)
- Agent selection sidebar with status badges
- Selected agent: `sand.sand2` background
- Chat interface with message history
- Agent purposes: Campaign Management, Content Analysis, Partnership Outreach

## State Management
- **Local State**: React `useState` for UI state
- **Auth**: NextAuth `useSession()` hook
- **Server Data**: React Server Components for data fetching
- **Client Interactivity**: `"use client"` directive when needed

## Supabase Schema (Key Tables)
- **partnerships**: Creator partnership records with status tracking
- **conversations**: Email thread data
- **agents**: AI agent configurations
- **products**: Product catalog
- **users**: User accounts with auth

## Development Workflow
```bash
npm run dev    # Turbopack dev server (fast)
npm run build  # Production build
npm run lint   # ESLint check
```

## Critical Rules for AI Assistance

1. **Always use Radix UI Themes components** - Don't create custom UI primitives
2. **Follow the button styling rules exactly** - Solid lime, soft gray/cyan only
3. **No double borders on cards** - Radix Card has built-in borders
4. **Kanban columns must be equal height** - Use `flex: 1` and `alignItems: "stretch"`
5. **Fixed button widths in modals** - 220px for consistency
6. **Minimal icons** - Only use when truly necessary
7. **Subtle highlights** - Use `sand.sand2` not darker shades
8. **Check Radix docs** - When unsure about component API, refer to radix-ui.com/themes/docs

## When Making Changes

1. Check if a Radix component exists for the UI element
2. Follow the established color palette (no random hex codes)
3. Maintain consistent spacing using Radix gap/padding scale
4. Ensure responsive behavior with Radix responsive props
5. Test drag-and-drop functionality doesn't break
6. Verify modal dialogs have proper close handlers
7. Check button widths are consistent (220px in modals)

## File Location Quick Reference

- Pages: `/src/app/[route]/page.tsx`
- Components: `/src/components/[component].tsx`
- Dashboard: `/src/components/dashboard/[component].tsx`
- API: `/src/app/api/[route]/route.ts`
- Utils: `/src/lib/[util].ts`
- Styles: `/src/app/globals.css`
- Types: `/src/types/[type].d.ts`

