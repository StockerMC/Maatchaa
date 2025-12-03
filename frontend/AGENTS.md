# Frontend Architecture & Context

This document provides essential architectural context for AI agents working on this codebase. Redundant information that can be gathered from file reading is intentionally omitted.

## Tech Stack

- **Framework**: Next.js 15.5.3 (App Router, React Server Components, Turbopack)
- **React**: 19.1.0
- **UI Library**: Radix UI Themes 3.2.1 + Radix Primitives (PRIMARY - use first)
- **Styling**: Tailwind CSS 4 + Radix Colors
- **Icons**: Lucide React (minimal usage only)
- **Animations**: GSAP, Framer Motion
- **Drag & Drop**: @dnd-kit (used in Kanban boards)
- **Auth**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **Type Safety**: TypeScript

## Design Philosophy

### Visual Design
- **Color Palette**: Radix Colors (sage, lime, sand, gray, blue, cyan, amber, orange, purple)
- **Primary Brand**: Lime green (`lime.lime9` for solid buttons, `#DDEBB2` for accents)
- **Neutrals**: Sand/Sage palette for backgrounds and text
- **Typography**: 
  - Primary: Figtree (sans-serif)
  - Accent: Instrument Serif (for headlines)
  - Satoshi (custom font in `/public/fonts/satoshi/`)
- **Spacing**: Consistent Radix spacing scale (1-9)
- **Corners**: Soft rounded corners (8-12px typical)

### Component Strategy
- **Radix UI First**: Use Radix Themes components for consistency
- **No Custom Variants**: Avoid `outline` or `surface` variants - use `soft`, `solid` only
- **Color Usage**:
  - Primary CTAs: `solid` `lime` buttons
  - Secondary actions: `soft` `gray` buttons  
  - Links/Watch actions: `soft` `cyan` buttons
  - Status badges: Match status (blue, amber, orange, purple)
- **Icons**: Minimal - only use when necessary (ExternalLink for external links, MoreVertical for actions)

### Layout Patterns
- **Dashboard**: Two-column layout with sidebar navigation
- **Cards**: Use Radix `Card` (no custom borders - built-in styling)
- **Flex/Box**: Radix layout primitives for all layouts
- **Responsive**: Mobile-first, uses Radix responsive props

## Key Radix UI Documentation

**Official Docs**: https://www.radix-ui.com/themes/docs

### Core Components Used
- **Layout**: `Box`, `Flex`, `Container`, `Section`, `Grid`
- **Typography**: `Text`, `Heading`, `Code`
- **Forms**: `TextField`, `TextArea`, `Button`, `Checkbox`, `Select`
- **Data Display**: `Card`, `Badge`, `Avatar`, `Separator`, `Table`
- **Overlays**: `Dialog`, `AlertDialog`, `Tooltip`, `ContextMenu`
- **Navigation**: `Tabs`

### Radix Color System
```typescript
import { sage, lime, sand, gray, blue, cyan } from "@radix-ui/colors";

// Access colors: sage.sage1 through sage.sage12
// Usage: style={{ color: sage.sage11, background: sage.sage2 }}
```

**Color Scales**:
- 1-2: Backgrounds
- 3-5: Borders, subtle UI
- 6-8: Disabled states, placeholders
- 9-10: Solid colors (buttons, badges)
- 11-12: Text colors

## File Index

### Core Pages (`/src/app`)
- **`page.tsx`** - Landing page: hero, features, waitlist CTA, video demos
- **`layout.tsx`** - Root layout: Radix Theme provider, fonts (Figtree, Instrument Serif, Satoshi), metadata
- **`globals.css`** - Global styles, CSS variables, Radix theme configuration, custom font faces
- **`blog/page.tsx`** - MDX blog rendering
- **`onboarding/page.tsx`** - User onboarding flow

### Dashboard Pages (`/src/app/dashboard`)
- **`partnerships/page.tsx`** - Kanban board with drag-and-drop (4 columns: To Contact → Contacted → In Discussion → Active), validation rules, embedded YouTube modals, LaTeX contract generation
- **`communications/page.tsx`** - Gmail-style email thread UI, two-pane layout (conversation list + message thread), draft composer
- **`agents/page.tsx`** - AI agent chat interface, agent selection sidebar, action tracking (email, contract, research, analysis)
- **`analytics/page.tsx`** - Performance metrics dashboard
- **`products/page.tsx`** - Product management
- **`reels/page.tsx`** - YouTube Shorts discovery and matching
- **`overview/page.tsx`** - Dashboard home

### Components (`/src/components`)
- **`dashboard/DashboardLayout.tsx`** - Two-column layout wrapper for all dashboard pages
- **`dashboard/DashboardSidebar.tsx`** - Navigation sidebar with route highlighting
- **`dashboard/DashboardHeader.tsx`** - Top header for dashboard
- **`Header.tsx`** - Landing page navigation
- **`Footer.tsx`** - Site footer
- **`VideoStepSync.tsx`** - Scroll-synced video component
- **`PhoneImageScroller.tsx`** - Phone mockup with scrolling images
- **`YoutubeReels.tsx`** - YouTube Shorts grid display
- **`PartnershipPrompt.tsx`** - Partnership CTA component
- **`SquigglyUnderlineTextLogo.tsx`** - Animated logo component
- **`waitlist/waitlist-form.tsx`** - Email collection form

### Utilities (`/src/lib`)
- **`supabase.ts`** - Browser-side Supabase client
- **`supabaseAdmin.ts`** - Server-side Supabase client (service role)
- **`utils.ts`** - Helper functions (cn for className merging, formatters)
- **`cookies.ts`** - Cookie management for auth

### Types (`/src/types`)
- **`next-auth.d.ts`** - NextAuth session/user type extensions

## Critical Design System Rules

### Button Variants (STRICT)
```tsx
// ✅ PRIMARY ACTION - ALWAYS use solid lime
<Button variant="solid" color="lime">Submit</Button>

// ✅ SECONDARY ACTION - soft gray only
<Button variant="soft" color="gray">Cancel</Button>

// ✅ EXTERNAL LINKS / WATCH ACTIONS - soft cyan to differentiate from blue badges
<Button variant="soft" color="cyan" asChild>
  <a href="..." target="_blank">
    <ExternalLink size={16} />
    Watch Video
  </a>
</Button>

// ❌ NEVER use outline or surface variants
// ❌ NEVER use 100% width buttons - use 220px fixed width in modals
```

### Status Badge Colors (Partnerships)
- **To Contact**: `blue`
- **Contacted**: `amber` (NOT yellow)
- **In Discussion**: `orange`
- **Active**: `purple`
- **Product Tags**: `blue` variant="soft"

### Typography Scale
- **size="8"** weight="bold" - H1 page titles
- **size="6"** weight="bold" - H2 section headers
- **size="3"** weight="medium" - Card titles
- **size="2"** - Body text
- **size="1"** - Captions/meta (color: sage.sage11)

### Cards
```tsx
// ✅ Use Radix Card - it has built-in borders
<Card style={{ padding: "1rem" }}>
  <Flex direction="column" gap="2">{/* Content */}</Flex>
</Card>

// ❌ NEVER add custom borders to Card (double border anti-pattern)
```

### Color Usage
```tsx
// Import colors for consistency
import { sage, sand, lime } from "@radix-ui/colors";

// Backgrounds
sand.sand1  // Base background
sand.sand2  // Subtle highlight (selected items)
sand.sand3  // Slightly darker

// Text
sage.sage11 // Muted text
sage.sage12 // Primary text

// Borders
sand.sand4  // Subtle borders
sand.sand6  // Stronger borders

// Brand
lime.lime9  // Primary brand color (#DDEBB2 approximation)
```

## State Management

- **Server Components**: Default - fetch data server-side
- **Client Components**: Use `"use client"` directive
- **Local State**: React `useState` for UI state
- **Auth State**: NextAuth session via `useSession()`
- **No Global State**: Keep state local or in URL params

## Common Patterns

### Drag & Drop (dnd-kit)
```tsx
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";

// Used in Kanban boards for card sorting
```

### Modal Dialogs
```tsx
<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Content style={{ maxWidth: "500px" }}>
    <Dialog.Title>Title</Dialog.Title>
    <Dialog.Description>Description</Dialog.Description>
    {/* Content */}
    <Flex gap="2" mt="4" justify="end">
      <Dialog.Close>
        <Button variant="soft" color="gray">Close</Button>
      </Dialog.Close>
    </Flex>
  </Dialog.Content>
</Dialog.Root>
```

### Responsive Layouts
```tsx
<Flex 
  direction={{ initial: "column", md: "row" }}
  gap={{ initial: "3", md: "6" }}
>
  {/* Content adapts to screen size */}
</Flex>
```

## Key Implementation Patterns

### Partnerships Kanban (`partnerships/page.tsx`)
**Critical Details:**
- **Drag & Drop**: Uses `@dnd-kit/core` with `PointerSensor` (8px activation distance)
- **Validation Rules**:
  - Can't move to "In Discussion" from "To Contact" (must go through "Contacted")
  - Can't move to "Active" without `contractSigned` and `affiliateLinkGenerated`
  - Shows `AlertDialog` on validation failure
- **Column Layout**:
  - 320px fixed width per column
  - `flex: 1`, `minHeight: "400px"` for equal heights
  - `alignItems: "stretch"` on parent Flex
- **Actions Modal**:
  - 700px max width
  - Embedded YouTube iframe (16:9 aspect ratio)
  - Button width: 220px fixed
  - "Watch Video" button always `soft` `cyan`
- **LaTeX Contract Generation**: Generates partnership contracts with heredoc-style templates

### Communications (`communications/page.tsx`)
**Gmail-Style Implementation:**
- **Layout**: Two-pane (400px sidebar + flexible message area)
- **Selected State**: `sand.sand2` background (NOT sand.sand3)
- **Message Thread**:
  - Email-style headers (From/To/Subject)
  - No message bubbles - plain text with left padding (3rem from avatar)
  - Attachments shown as clickable cards
- **Reply Composer**: Bottom-anchored textarea with "Send Email" button (solid lime)
- **Status Tabs**: All/Pending/Replied/Active filters

### Agents (`agents/page.tsx`)
**Chat Interface:**
- **Agent Selection**: Sidebar with status badges (Working: blue, Active: purple, Idle: amber)
- **Message Types**:
  - Regular messages (user/agent roles)
  - Action cards (email, contract, research, schedule, analysis)
- **Action Display**: Beige cards with icon, description, timestamp
- **Input**: Bottom-anchored TextField with Send button

## Development Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Anti-Patterns (NEVER DO THIS)

1. **❌ Double Borders**: Radix Card has built-in borders - don't add `border: "1px solid ..."`
2. **❌ Icon Overuse**: Don't use icons for metrics (show "1.2M views" not Eye icon + number)
3. **❌ Wrong Button Variants**: Never use `outline` or `surface` - only `solid` lime or `soft` gray/cyan
4. **❌ 100% Width Buttons**: Use 220px fixed width in modals for consistency
5. **❌ Wrong Highlight Color**: Use `sand.sand2` for selected states, NOT `sand.sand3`
6. **❌ Watch Video Button Color**: Must be `soft` `cyan` (NOT blue) to differentiate from product badges
7. **❌ Unequal Kanban Columns**: Always use `flex: 1` + `alignItems: "stretch"` on parent
8. **❌ Custom UI Primitives**: Always use Radix components first before creating custom ones

## Common Gotchas

- **Drag & Drop Validation**: Partnership status changes have business logic constraints (see validation rules above)
- **Message Bubbles**: Communications page uses email-style threading, NOT chat bubbles
- **Agent Purpose Colors**: All agent purpose badges use `lime` color (not differentiated by purpose)
- **Font Loading**: Satoshi font files in `/public/fonts/satoshi/` - loaded via `@font-face` in globals.css
- **Color Imports**: Must import from `@radix-ui/colors` for consistency
- **Modal Button Order**: Primary action first (top/left), secondary actions below/right

## Radix UI Documentation Links

**Always reference these when implementing new features:**
- Components: https://www.radix-ui.com/themes/docs/components
- Colors: https://www.radix-ui.com/colors
- Typography: https://www.radix-ui.com/themes/docs/theme/typography
- Layout: https://www.radix-ui.com/themes/docs/components/flex

