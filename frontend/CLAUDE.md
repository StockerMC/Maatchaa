# Claude Context: Frontend Codebase

**Purpose**: Quick reference for implementation patterns and critical design decisions. For comprehensive file descriptions, see AGENTS.md.

## Tech Stack Summary

- **Next.js 15.5.3** - App Router, React Server Components, Turbopack
- **React 19.1.0**
- **Radix UI Themes 3.2.1** - PRIMARY UI library (always use first)
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Utility-first styling (secondary to Radix)
- **Supabase** - PostgreSQL database and auth
- **@dnd-kit** - Drag and drop (Kanban boards)

## Quick File Reference

See AGENTS.md for complete file index. Key files for common tasks:

**Styling & Theme:**
- `src/app/globals.css` - Radix theme config, CSS variables, font faces
- `src/app/layout.tsx` - Theme provider, font loading

**Dashboard Core:**
- `src/app/dashboard/partnerships/page.tsx` - Kanban with drag-drop validation (1678 lines)
- `src/app/dashboard/communications/page.tsx` - Gmail-style email threads (673 lines)
- `src/app/dashboard/agents/page.tsx` - AI agent chat interface (656 lines)

**Components:**
- `src/components/dashboard/DashboardLayout.tsx` - Two-column layout wrapper
- `src/components/dashboard/DashboardSidebar.tsx` - Navigation with active route highlighting

**Utilities:**
- `src/lib/utils.ts` - Helper functions (cn, formatters)
- `src/lib/supabase.ts` / `supabaseAdmin.ts` - Database clients

## Design System (Critical Rules)

### Radix UI First
**Always use Radix components before creating custom ones:**
- Docs: https://www.radix-ui.com/themes/docs/components
- Colors: https://www.radix-ui.com/colors

### Button Variants (ZERO EXCEPTIONS)
```tsx
// ✅ PRIMARY - solid lime
<Button variant="solid" color="lime">Submit</Button>

// ✅ SECONDARY - soft gray
<Button variant="soft" color="gray">Cancel</Button>

// ✅ EXTERNAL LINKS - soft cyan (differentiates from blue badges)
<Button variant="soft" color="cyan" asChild>
  <a href="..." target="_blank">
    <ExternalLink size={16} />Watch Video
  </a>
</Button>

// ❌ NEVER: outline, surface, 100% width in modals
```

### Cards - NO DOUBLE BORDERS
```tsx
// ✅ Radix Card has built-in borders
<Card style={{ padding: "1rem" }}>...</Card>

// ❌ NEVER add custom borders
<Card style={{ border: "1px solid ..." }}>...</Card>
```

### Colors
```tsx
import { sage, sand, lime } from "@radix-ui/colors";

// Backgrounds
sand.sand1  // Base
sand.sand2  // Selected/highlighted (NOT sand.sand3)
sand.sand3  // Slightly darker

// Text
sage.sage11 // Muted
sage.sage12 // Primary

// Borders
sand.sand4  // Subtle
sand.sand6  // Stronger

// Brand
lime.lime9  // Primary (#DDEBB2 approx)
```

### Typography
- `size="8" weight="bold"` - H1 page titles
- `size="6" weight="bold"` - H2 section headers
- `size="3" weight="medium"` - Card titles
- `size="2"` - Body text
- `size="1" style={{ color: sage.sage11 }}` - Captions

### Status Badges (Partnerships)
- To Contact: `blue`
- Contacted: `amber`
- In Discussion: `orange`
- Active: `purple`
- Product tags: `blue` variant="soft"

## Implementation Patterns

### Kanban Board (partnerships/page.tsx)
**Equal-height columns - CRITICAL:**
```tsx
<Flex gap="4" style={{ alignItems: "stretch" }}>  {/* Must have alignItems */}
  <Box style={{ width: "320px", display: "flex", flexDirection: "column" }}>
    <Flex direction="column" gap="3" style={{ height: "100%" }}>
      <Box style={{ flex: 1, minHeight: "400px" }}>  {/* flex: 1 for equal heights */}
        {/* Cards */}
      </Box>
    </Flex>
  </Box>
</Flex>
```

**Drag & Drop:**
```tsx
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },  // Prevents accidental drags
  })
);

// Validation before status change
const validateMove = (partnership: Partnership, newStatus: string): boolean => {
  if (newStatus === "active") {
    if (!partnership.contractSigned || !partnership.affiliateLinkGenerated) {
      setShowValidationAlert(true);
      return false;
    }
  }
  return true;
};
```

### Modal Dialogs with Fixed Button Widths
```tsx
<Dialog.Content style={{ maxWidth: "700px" }}>  {/* Wider for YouTube embeds */}
  <Dialog.Title>Title</Dialog.Title>
  <Flex direction="column" gap="2" align="start">  {/* align="start" for left alignment */}
    <Button variant="solid" color="lime" style={{ width: "220px" }}>
      Primary Action
    </Button>
    <Button variant="soft" color="cyan" style={{ width: "220px" }}>
      Watch Video  {/* Always cyan for external links */}
    </Button>
  </Flex>
</Dialog.Content>
```

### Selected/Highlighted State
```tsx
// Use sand.sand2 for subtle highlighting (NOT sand.sand3)
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
  {/* Content */}
</Box>
```

### Gmail-Style Email Threads (communications/page.tsx)
```tsx
// NO message bubbles - email-style layout
<Box style={{
  background: "#FFFEFB",
  borderBottom: `1px solid ${sand.sand4}`,
  padding: "1.5rem"
}}>
  {/* Email header with From/To */}
  <Flex align="center" gap="2">
    <Avatar size="2" />
    <Box>
      <Text size="2" weight="medium">{message.from}</Text>
      <Text size="1" style={{ color: sage.sage11 }}>to {message.to}</Text>
    </Box>
  </Flex>

  {/* Body - plain text with left padding */}
  <Box style={{ paddingLeft: "3rem", whiteSpace: "pre-wrap" }}>
    <Text size="2">{message.body}</Text>
  </Box>
</Box>
```

## Critical Implementation Details

### Partnerships Kanban Validation Logic
**Business rules enforced via drag validation:**
```tsx
// Can't skip "Contacted" - must go To Contact → Contacted → In Discussion
if (newStatus === "in_discussion" && partnership.status === "to_contact") {
  showAlert("Please contact the creator first");
  return false;
}

// Can't activate without contract signed AND affiliate link generated
if (newStatus === "active") {
  if (!partnership.contractSigned || !partnership.affiliateLinkGenerated) {
    showAlert("Contract must be signed and affiliate link generated");
    return false;
  }
}
```

### LaTeX Contract Generation
Partnerships page generates contracts using LaTeX templates:
```tsx
const latex = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
...
This Partnership Agreement is entered into as of ${new Date().toLocaleDateString()}
...`;
```

### Agent Action Types
Five distinct action types displayed in agent chat:
- `email` - Email sent/drafted
- `contract` - Contract generated/sent
- `research` - Creator research completed
- `schedule` - Calendar event created
- `analysis` - Performance analysis run

Each action shows as a beige card with icon and details.

## Anti-Patterns to Avoid

1. ❌ **Double Borders** - Radix Card has borders built-in
2. ❌ **Icon Overuse** - Show "1.2M views" not Eye icon + number
3. ❌ **Wrong Button Variants** - Never `outline` or `surface`
4. ❌ **100% Width Modal Buttons** - Always 220px fixed
5. ❌ **Wrong Highlight Color** - `sand.sand2` not `sand.sand3`
6. ❌ **Blue Watch Buttons** - Must be cyan to differentiate from product badges
7. ❌ **Unequal Kanban Columns** - Must use `flex: 1` + `alignItems: "stretch"`
8. ❌ **Message Bubbles in Communications** - Gmail-style threading only

## State Management
- **Client Components**: `"use client"` + `useState` for UI state
- **Server Components**: Default for data fetching
- **Auth**: NextAuth `useSession()` hook
- **No Global State** - Keep state local or in URL params

## When Making Changes

**Before coding:**
1. Check if Radix component exists for the UI element
2. Verify button variant and color match design system
3. Ensure colors are from Radix palette (no random hex codes)
4. Confirm spacing uses Radix gap/padding scale

**After coding:**
5. Test drag-drop validation rules still work
6. Verify modal buttons are 220px wide
7. Check selected states use `sand.sand2`
8. Ensure no double borders on cards

## Common Gotchas

- **Font Loading**: Satoshi font in `/public/fonts/satoshi/` - loaded via `@font-face` in `globals.css`
- **Agent Colors**: All agent purpose badges use `lime` (not differentiated by type)
- **Modal Button Order**: Primary first, secondary below/right
- **Email Threading**: No chat bubbles - email-style with 3rem left padding
- **Partnership Card Metrics**: Max 2 products shown, then "+X more" badge

