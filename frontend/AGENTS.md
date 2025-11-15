# Frontend Architecture & Context

## Tech Stack

- **Framework**: Next.js 15.5.3 (App Router, React Server Components, Turbopack)
- **React**: 19.1.0
- **UI Library**: Radix UI Themes 3.2.1 + Radix Primitives
- **Styling**: Tailwind CSS 4 + Radix Colors
- **Icons**: Lucide React
- **Animations**: GSAP, Framer Motion concepts
- **Drag & Drop**: @dnd-kit
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

## File Structure

### `/src/app` - Next.js App Router
- **`page.tsx`**: Homepage with hero, features, waitlist
- **`layout.tsx`**: Root layout with providers, fonts, metadata
- **`globals.css`**: Global styles, Radix theme config
- **`dashboard/`**: Protected dashboard routes
  - `partnerships/page.tsx`: Kanban board for creator partnerships
  - `communications/page.tsx`: Email thread management
  - `agents/page.tsx`: AI agent chat interface
  - `analytics/page.tsx`: Performance metrics
  - `creators/page.tsx`: Creator discovery
- **`api/`**: API routes (auth, data fetching)

### `/src/components`
- **Landing Page**: `Header.tsx`, `Footer.tsx`, `VideoStepSync.tsx`, `PhoneImageScroller.tsx`
- **Dashboard**: `dashboard/DashboardLayout.tsx`, `dashboard/Sidebar.tsx`
- **Utilities**: `Providers.tsx` (NextAuth, React context), `ConditionalHeader.tsx`
- **UI Primitives**: `ui/` (shared components)

### `/src/lib`
- **`supabase.ts`**: Supabase client (browser)
- **`supabaseAdmin.ts`**: Supabase admin client (server)
- **`utils.ts`**: Helper functions (cn, formatters)
- **`cookies.ts`**: Cookie utilities for auth

### `/src/types`
- **`next-auth.d.ts`**: NextAuth type extensions

## Design System Rules

### Buttons
```tsx
// Primary action
<Button variant="solid" color="lime">Submit</Button>

// Secondary action  
<Button variant="soft" color="gray">Cancel</Button>

// External link
<Button variant="soft" color="cyan" asChild>
  <a href="..." target="_blank">
    <ExternalLink size={16} />
    Watch Video
  </a>
</Button>
```

### Badges
```tsx
// Status indicators
<Badge color="blue">To Contact</Badge>
<Badge color="amber">Contacted</Badge>
<Badge color="orange">In Discussion</Badge>
<Badge color="purple">Active</Badge>

// Product tags
<Badge variant="soft" size="1" color="blue">Product Name</Badge>
```

### Cards
```tsx
// Use Radix Card - no custom borders
<Card style={{ padding: "1rem" }}>
  <Flex direction="column" gap="2">
    {/* Content */}
  </Flex>
</Card>
```

### Typography Hierarchy
```tsx
<Text size="8" weight="bold">H1 - Page Title</Text>
<Text size="6" weight="bold">H2 - Section Header</Text>
<Text size="3" weight="medium">Body - Card Titles</Text>
<Text size="2">Body - Regular Text</Text>
<Text size="1" style={{ color: "var(--sage-11)" }}>Caption/Meta</Text>
```

### Color Variables
```tsx
// Prefer Radix color tokens
style={{ color: "var(--sage-11)", background: "var(--sage-2)" }}

// Or import directly
import { sage } from "@radix-ui/colors";
style={{ color: sage.sage11, background: sage.sand2 }}
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

## Key Features

### Partnerships Kanban Board
- 4 columns: To Contact → Contacted → In Discussion → Active
- Drag-and-drop with validation rules
- Equal-height columns using flexbox (`flex: 1`, `alignItems: "stretch"`)
- Minimum height: 400px (approximately 2 cards tall)
- Fixed-width buttons (220px) in action modals
- Embedded YouTube videos in partnership modals

### Communications Hub
- Two-pane layout (conversation list + message thread)
- Selected conversation highlighted with `sand.sand2` background
- Real-time message threading
- Email draft generation with AI

### Agents Dashboard
- AI agent chat interface
- Agent cards with status badges
- Selected agent highlighted with `sand.sand2` background
- Task tracking and performance metrics

## Development Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Important Notes

- **No Double Borders**: Radix Card already has borders - don't add custom borders
- **Icon Usage**: Minimal - only ExternalLink, MoreVertical, status icons
- **Metrics Display**: Show as text "X views" not with icons
- **Column Heights**: Always equal in Kanban - use `flex: 1` and `alignItems: "stretch"`
- **Button Widths**: Fixed width (220px) for consistency in modals
- **Highlighted States**: Use `sand.sand2` not `sand.sand3` for subtle highlights
- **Watch Video Buttons**: Always `soft` `cyan` to differentiate from blue product badges

## Supabase Integration

- **Client**: Browser-side queries via `@supabase/ssr`
- **Admin**: Server-side operations with service role
- **Auth**: Row-level security policies
- **Tables**: partnerships, conversations, agents, products, users

## Testing Checklist

- [ ] All buttons have consistent styling (solid lime or soft gray/cyan)
- [ ] Cards don't have double borders
- [ ] Kanban columns are equal height
- [ ] Icons are minimal and purposeful
- [ ] Typography follows hierarchy
- [ ] Colors use Radix palette
- [ ] Responsive layout works on mobile
- [ ] Drag & drop works smoothly
- [ ] Modals have proper close handlers

