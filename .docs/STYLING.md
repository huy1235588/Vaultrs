# 🎨 Vaultrs Styling Guide

> **Comprehensive styling documentation for the Vaultrs desktop application**  
> Version: 1.0.0 | Last Updated: 2024

---

## 📑 Table of Contents

1. [Design Philosophy](#-design-philosophy)
2. [Color System](#-color-system)
3. [Typography](#-typography)
4. [Spacing & Layout](#-spacing--layout)
5. [Component Styling](#-component-styling)
6. [Theme Customization](#-theme-customization)
7. [Performance Considerations](#-performance-considerations)
8. [Best Practices](#-best-practices)
9. [Accessibility](#-accessibility)

---

## 🎯 Design Philosophy

### Core Principles

**1. Performance First**

-   Optimized for rendering 10M+ records
-   Minimal reflows and repaints
-   Hardware-accelerated animations only

**2. Data Density**

-   Maximize information display
-   Compact spacing for desktop use
-   Scannable layouts for large datasets

**3. Professional Aesthetics**

-   Clean, modern interface
-   Tech-focused color palette
-   Consistent design language

**4. Native Feel**

-   Desktop-optimized interactions
-   OS-appropriate behaviors
-   Fast, responsive UI

### Design Language: "Vault Titanium"

**Concept**: Military-grade data vault with high-tech aesthetics

-   **Primary**: Tech Blue - Professional, trustworthy
-   **Accent**: Cyan - High-performance, energetic
-   **Neutral**: Slate - Clean, data-focused
-   **Feel**: Secure, powerful, efficient

---

## 🎨 Color System

### Color Philosophy

Vaultrs uses **OKLCH color space** for:

-   ✅ Perceptual uniformity (better than HSL)
-   ✅ Predictable lightness
-   ✅ Wider color gamut
-   ✅ Consistent contrast ratios

### Base Palette

#### Light Mode

```css
/* Background Colors */
--background: oklch(0.99 0 0); /* Soft white, eye-friendly */
--foreground: oklch(0.2 0.013 250); /* Slate 900, sharp text */

/* Surface Colors */
--card: oklch(1 0 0); /* Pure white for separation */
--popover: oklch(1 0 0); /* Elevated surfaces */

/* Brand Colors */
--primary: oklch(0.55 0.22 260); /* Blue 600 - CTA buttons */
--secondary: oklch(0.96 0.006 250); /* Slate 100 - Secondary actions */
--accent: oklch(0.94 0.017 250); /* Subtle highlights */

/* Utility Colors */
--muted: oklch(0.96 0.006 250); /* Disabled states */
--destructive: oklch(0.55 0.22 25); /* Red 600 - Danger */
```

#### Dark Mode

```css
/* Background Colors */
--background: oklch(0.15 0.005 250); /* Deep slate, OLED-friendly */
--foreground: oklch(0.95 0.005 250); /* Warm white text */

/* Surface Colors */
--card: oklch(0.18 0.008 250); /* Elevated +3% lightness */
--popover: oklch(0.16 0.006 250); /* Floating elements */

/* Brand Colors */
--primary: oklch(0.6 0.24 260); /* Blue 500 - Brighter */
--secondary: oklch(0.25 0.01 250); /* Slate 800 */
--accent: oklch(0.25 0.015 250); /* Blue-tinted slate */
```

### Semantic Colors

#### Status Indicators

```css
/* Success (Green) */
--success: oklch(0.55 0.16 145); /* Light mode */
--success: oklch(0.58 0.18 145); /* Dark mode */
--success-foreground: oklch(1 0 0);

/* Warning (Amber) */
--warning: oklch(0.65 0.2 65); /* Light mode */
--warning: oklch(0.68 0.22 65); /* Dark mode */
--warning-foreground: oklch(0.15 0 0);

/* Error/Destructive (Red) */
--destructive: oklch(0.55 0.22 25); /* Light mode */
--destructive: oklch(0.58 0.24 25); /* Dark mode */
--destructive-foreground: oklch(0.98 0 0);

/* Info (Sky Blue) */
--info: oklch(0.6 0.18 230); /* Light mode */
--info: oklch(0.65 0.2 230); /* Dark mode */
--info-foreground: oklch(1 0 0);
```

#### Usage Examples

```tsx
// Status badge
<Badge className="status-success">Completed</Badge>
<Badge className="status-warning">Pending</Badge>
<Badge className="status-error">Failed</Badge>
<Badge className="status-info">Processing</Badge>

// Alert components
<Alert variant="success">Operation successful!</Alert>
<Alert variant="destructive">Error occurred</Alert>
```

### Data Visualization Colors

Optimized 6-color palette for charts and graphs:

```css
--chart-1: oklch(0.55 0.22 260); /* Blue - Primary data */
--chart-2: oklch(0.6 0.18 195); /* Cyan - Secondary */
--chart-3: oklch(0.55 0.16 145); /* Green - Positive metrics */
--chart-4: oklch(0.65 0.2 65); /* Amber - Warning metrics */
--chart-5: oklch(0.55 0.22 25); /* Red - Negative metrics */
--chart-6: oklch(0.5 0.18 290); /* Purple - Additional data */
```

**Usage Guidelines:**

-   Use chart-1 (blue) for primary data series
-   Use chart-3 (green) for positive trends
-   Use chart-5 (red) for negative trends
-   Ensure sufficient contrast (min 4.5:1 ratio)

---

## ✍️ Typography

### Font Stack

```css
/* Sans-serif - UI Text */
--font-sans: "Inter", "Open Sans", -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace - Code & Data */
--font-mono: "JetBrains Mono", "Fira Code", "Menlo", monospace;

/* Serif - Emphasis (rarely used) */
--font-serif: Georgia, serif;
```

### Type Scale

Based on modular scale (1.25 ratio):

```css
/* Headings */
h1: 2.5rem (40px)   - Page titles
h2: 2rem (32px)     - Section headers
h3: 1.5rem (24px)   - Subsection headers
h4: 1.25rem (20px)  - Component titles
h5: 1rem (16px)     - Small headers
h6: 0.875rem (14px) - Labels

/* Body Text */
Base: 1rem (16px)       - Default body text
Small: 0.875rem (14px)  - Secondary text, captions
Tiny: 0.75rem (12px)    - Metadata, timestamps
```

### Font Weights

```css
font-weight: 400  /* Regular - Body text */
font-weight: 500  /* Medium - Emphasized text */
font-weight: 600  /* Semibold - Headings, buttons */
font-weight: 700  /* Bold - Strong emphasis (rare) */
```

### Letter Spacing

```css
--tracking-tighter: -0.05em   /* Large headings (h1, h2) */
--tracking-tight: -0.025em    /* Regular headings (h3-h6) */
--tracking-normal: 0em        /* Body text, default */
--tracking-wide: 0.025em      /* Uppercase labels */
--tracking-wider: 0.05em      /* Buttons */
--tracking-widest: 0.1em      /* All-caps headings */
```

### Line Height

```css
Leading tight: 1.25    /* Headings */
Leading normal: 1.5    /* Body text */
Leading relaxed: 1.75  /* Long-form content */
```

### Typography Utilities

```css
/* Headings automatically apply tight tracking */
h1,
h2,
h3,
h4,
h5,
h6 {
    letter-spacing: var(--tracking-tight);
    font-weight: 600;
}

/* Tabular numbers for data tables */
table {
    font-feature-settings: "tnum" 1;
}

/* Code & Monospace */
code,
pre {
    font-family: var(--font-mono);
    font-feature-settings: "liga" 0, "calt" 0;
}
```

### Usage Examples

```tsx
// Page title
<h1 className="text-4xl font-semibold tracking-tight">Media Library</h1>

// Section header
<h2 className="text-2xl font-semibold mb-4">Recent Additions</h2>

// Data table (tabular numbers)
<table className="font-mono text-sm">
  <td className="tabular-nums">1,234,567</td>
</table>

// Uppercase label
<span className="text-xs uppercase tracking-wide text-muted-foreground">
  Status
</span>
```

---

## 📏 Spacing & Layout

### Spacing Scale

Based on 4px base unit:

```css
--spacing: 0.25rem (4px) /* Tailwind classes */ 0 - 0px 0.5 - 2px (0.125rem) 1 -
    4px (0.25rem) 1.5 - 6px (0.375rem) 2 - 8px (0.5rem) 3 - 12px (0.75rem) 4 -
    16px (1rem) 5 - 20px (1.25rem) 6 - 24px (1.5rem) 8 - 32px (2rem) 10 - 40px
    (2.5rem) 12 - 48px (3rem) 16 - 64px (4rem) 20 - 80px (5rem);
```

### Spacing Guidelines

**Component Spacing:**

```tsx
// Button padding
<Button className="px-4 py-2">Action</Button>

// Card padding
<Card className="p-6">Content</Card>

// Table cell padding (compact)
<td className="px-2 py-1.5">Data</td>

// Section spacing
<section className="space-y-6">
  <div>...</div>
  <div>...</div>
</section>
```

**Layout Gaps:**

```tsx
// Grid gap (data cards)
<div className="grid grid-cols-3 gap-4">

// Flex gap (toolbar)
<div className="flex gap-2">

// Stack gap (form fields)
<div className="space-y-4">
```

### Border Radius

Optimized for data-dense desktop UI:

```css
--radius-sm: 0.25rem   /* 4px - Badges, tags */
--radius-md: 0.375rem  /* 6px - Buttons, inputs */
--radius-lg: 0.5rem    /* 8px - Cards (default) */
--radius-xl: 0.75rem   /* 12px - Modals, popovers */

/* Tailwind classes */
rounded-sm   - 4px
rounded      - 6px (default)
rounded-md   - 6px
rounded-lg   - 8px
rounded-xl   - 12px
```

### Shadows

6-level shadow system:

```css
/* Tailwind classes with usage */
shadow-2xs  - Subtle borders (1px elevation)
shadow-xs   - Input fields (2px elevation)
shadow-sm   - Buttons (4px elevation)
shadow      - Cards (6px elevation)
shadow-md   - Dropdowns (8px elevation)
shadow-lg   - Dialogs (12px elevation)
shadow-xl   - Modals (20px elevation)
shadow-2xl  - Overlays (30px elevation)
```

**Usage:**

```tsx
// Flat button
<Button variant="ghost">No shadow</Button>

// Raised button
<Button className="shadow-sm">Action</Button>

// Floating card
<Card className="shadow-md">Content</Card>

// Modal
<Dialog className="shadow-xl">
```

---

## 🧩 Component Styling

### Buttons

#### Variants

```tsx
// Primary - Main actions
<Button variant="default" className="bg-primary text-primary-foreground">
  Save Changes
</Button>

// Secondary - Supporting actions
<Button variant="secondary">
  Cancel
</Button>

// Destructive - Dangerous actions
<Button variant="destructive">
  Delete
</Button>

// Ghost - Minimal prominence
<Button variant="ghost">
  Learn More
</Button>

// Outline - Medium prominence
<Button variant="outline">
  Export
</Button>
```

#### Sizes

```tsx
<Button size="sm">Small</Button>      {/* px-3 py-1.5 text-sm */}
<Button size="default">Default</Button> {/* px-4 py-2 text-base */}
<Button size="lg">Large</Button>      {/* px-6 py-3 text-lg */}
<Button size="icon">🔍</Button>       {/* Square, icon only */}
```

#### States

```css
/* Default state */
.button {
    @apply bg-primary text-primary-foreground;
}

/* Hover state */
.button:hover {
    @apply bg-primary/90;
}

/* Active state */
.button:active {
    @apply bg-primary/80;
}

/* Disabled state */
.button:disabled {
    @apply opacity-50 cursor-not-allowed pointer-events-none;
}

/* Focus state */
.button:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2;
}
```

### Inputs & Forms

```tsx
// Text input
<Input
  type="text"
  placeholder="Search..."
  className="h-10 px-3 rounded-md border border-input"
/>

// Textarea
<Textarea
  placeholder="Description..."
  className="min-h-[80px] resize-none"
/>

// Select
<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>

// Checkbox
<Checkbox id="terms" />
<label htmlFor="terms" className="text-sm text-muted-foreground">
  Accept terms
</label>

// Switch
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

### Cards

```tsx
// Basic card
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Compact card (for grids)
<Card className="p-4 space-y-2">
  <h3 className="font-semibold">Item Name</h3>
  <p className="text-sm text-muted-foreground">Details</p>
</Card>

// Interactive card
<Card className="p-4 cursor-pointer hover:bg-accent transition-colors">
  <CardContent>Clickable content</CardContent>
</Card>
```

### Tables

Optimized for virtual scrolling with 10M+ records:

```tsx
// Dense table for data
<Table className="table-dense">
    <TableHeader>
        <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Size</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        <TableRow>
            <TableCell className="table-cell-compact font-mono">
                #12345
            </TableCell>
            <TableCell className="table-cell-compact">Item Title</TableCell>
            <TableCell className="table-cell-compact">
                <Badge className="status-success">Active</Badge>
            </TableCell>
            <TableCell className="table-cell-compact text-right tabular-nums">
                1.2 GB
            </TableCell>
        </TableRow>
    </TableBody>
</Table>
```

**Table Utilities:**

```css
/* Dense spacing for data */
.table-dense {
    @apply text-sm leading-tight;
}

/* Compact cell padding */
.table-cell-compact {
    @apply px-2 py-1.5;
}

/* Sticky header */
.table-header-sticky {
    @apply sticky top-0 bg-background z-10;
}

/* Hover row */
.table-row-hover:hover {
    @apply bg-muted/50;
}
```

### Badges

```tsx
// Status badges
<Badge className="status-success">Active</Badge>
<Badge className="status-warning">Pending</Badge>
<Badge className="status-error">Failed</Badge>
<Badge className="status-info">Processing</Badge>

// Variant badges
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>

// Size variants
<Badge className="text-xs px-2 py-0.5">Small</Badge>
<Badge>Default</Badge>
<Badge className="text-base px-3 py-1">Large</Badge>
```

### Dialogs & Modals

```tsx
<Dialog>
    <DialogTrigger asChild>
        <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Description text goes here</DialogDescription>
        </DialogHeader>
        <div className="py-4">{/* Dialog content */}</div>
        <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Confirm</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

### Tooltips

```tsx
<Tooltip>
    <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
            <InfoIcon className="h-4 w-4" />
        </Button>
    </TooltipTrigger>
    <TooltipContent>
        <p className="text-sm">Helpful tooltip text</p>
    </TooltipContent>
</Tooltip>
```

---

## 🎭 Theme Customization

### Switching Themes

```tsx
import { useTheme } from "next-themes";

function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Button>
    );
}
```

### Custom Theme Variables

Add to `globals.css`:

```css
:root {
    /* Custom brand color */
    --brand-primary: oklch(0.55 0.22 260);
    --brand-accent: oklch(0.6 0.18 195);

    /* Custom spacing */
    --sidebar-width: 280px;
    --header-height: 64px;
    --footer-height: 48px;
}

/* Usage in components */
.sidebar {
    width: var(--sidebar-width);
}
```

### Creating Color Variants

```css
/* Custom success variant */
:root {
    --success-50: oklch(0.95 0.04 145);
    --success-100: oklch(0.9 0.08 145);
    --success-500: oklch(0.55 0.16 145);
    --success-900: oklch(0.25 0.1 145);
}

/* Usage */
.bg-success-50 {
    background-color: var(--success-50);
}
.text-success-900 {
    color: var(--success-900);
}
```

### System Preference Detection

```tsx
"use client";

import { useEffect, useState } from "react";

export function useSystemTheme() {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setTheme(mediaQuery.matches ? "dark" : "light");

        const handler = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    return theme;
}
```

---

## ⚡ Performance Considerations

### Virtual Scrolling Styles

For 10M+ record tables:

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualTable({ data }: { data: any[] }) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35, // Row height in pixels
        overscan: 5, // Render extra rows for smooth scrolling
    });

    return (
        <div ref={parentRef} className="h-screen overflow-auto">
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    position: "relative",
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                        key={virtualRow.index}
                        className="absolute top-0 left-0 w-full table-row-hover"
                        style={{
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                        }}
                    >
                        {/* Row content */}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### CSS Optimization

```css
/* Use transform for animations (GPU accelerated) */
.animate-slide {
    transform: translateX(0);
    transition: transform 200ms ease-out;
}

/* Avoid animating these properties */
/* ❌ width, height, top, left (triggers layout) */
/* ❌ box-shadow, border (triggers paint) */
/* ✅ transform, opacity (triggers composite only) */

/* Enable hardware acceleration */
.hardware-accelerated {
    will-change: transform;
    transform: translateZ(0);
}

/* Contain layout thrashing */
.layout-contained {
    contain: layout;
}
```

### Reduce Repaints

```tsx
// Use CSS containment
<div className="contain-layout contain-paint">
  {/* Isolated layout */}
</div>

// Avoid inline styles when possible
// ❌ Bad
<div style={{ color: isActive ? 'blue' : 'gray' }}>

// ✅ Good
<div className={isActive ? 'text-primary' : 'text-muted-foreground'}>
```

### Lazy Loading Images

```tsx
import Image from "next/image";

<Image
    src="/media/thumbnail.jpg"
    alt="Media thumbnail"
    width={200}
    height={200}
    loading="lazy"
    className="rounded-lg object-cover"
/>;
```

---

## 📐 Best Practices

### Component Composition

```tsx
// ✅ Compose utilities for flexibility
<Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
    <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Title</CardTitle>
    </CardHeader>
    <CardContent className="text-muted-foreground">Content</CardContent>
</Card>

// ❌ Avoid creating too many custom components
// Let Tailwind utilities do the work
```

### Responsive Design

Desktop-first approach (since it's a desktop app):

```tsx
// Start with desktop styles, adjust for smaller windows
<div className="grid grid-cols-4 gap-4
                min-w-[1024px]:grid-cols-3
                min-w-[768px]:grid-cols-2">
  {/* Content */}
</div>

// Hide elements on smaller windows
<aside className="w-64 min-w-[1024px]:hidden">
  {/* Sidebar */}
</aside>
```

### Dark Mode Handling

```tsx
// Use dark: prefix for dark mode styles
<div className="bg-white dark:bg-slate-900
                text-slate-900 dark:text-slate-100">
  Content adapts to theme
</div>

// Image placeholders for dark mode
<div className="bg-slate-200 dark:bg-slate-800 rounded-lg">
  <Image src="..." alt="..." />
</div>
```

### Accessibility Classes

```tsx
// Focus indicators
<button className="focus-visible:outline-none
                   focus-visible:ring-2
                   focus-visible:ring-ring
                   focus-visible:ring-offset-2">
  Accessible Button
</button>

// Screen reader only
<span className="sr-only">Hidden from visual users</span>

// Skip to content
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Consistent Spacing

```tsx
// Use space-y for vertical stacks
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Use gap for flex/grid
<div className="flex gap-2">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

// Use padding for containers
<section className="p-6">
  <h2 className="mb-4">Section Title</h2>
  <div className="space-y-2">
    {/* Content */}
  </div>
</section>
```

---

## ♿ Accessibility

### Color Contrast

Ensure WCAG 2.1 AA compliance:

```css
/* Minimum contrast ratios */
Normal text: 4.5:1
Large text (18px+): 3:1
UI components: 3:1

/* Test with browser DevTools */
/* Chrome: Lighthouse audit */
/* Firefox: Accessibility inspector */
```

### Focus Indicators

```css
/* Always provide visible focus */
.focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2;
}

/* Custom focus for specific components */
.input:focus-visible {
    @apply border-primary ring-1 ring-primary;
}
```

### Keyboard Navigation

```tsx
// Ensure keyboard navigation works
<div role="navigation" aria-label="Main navigation">
  <Button tabIndex={0}>Item 1</Button>
  <Button tabIndex={0}>Item 2</Button>
</div>

// Skip links for screen readers
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
```

### ARIA Labels

```tsx
// Descriptive labels for icons
<Button aria-label="Search media library">
  <SearchIcon className="h-4 w-4" />
</Button>

// Status announcements
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>

// Loading states
<Button disabled aria-busy="true">
  <Spinner className="mr-2" />
  Loading...
</Button>
```

### Motion Preferences

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

```tsx
// Check in React
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

// Conditionally apply animations
<div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
```

---

## 📚 Quick Reference

### Common Patterns

```tsx
// Page layout
<div className="min-h-screen bg-background">
  <header className="border-b">
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-2xl font-semibold">Vaultrs</h1>
    </div>
  </header>
  <main className="container mx-auto px-4 py-6">
    {/* Content */}
  </main>
</div>

// Data grid
<div className="grid grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold mb-2">{item.title}</h3>
      <p className="text-sm text-muted-foreground">{item.description}</p>
    </Card>
  ))}
</div>

// Form layout
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" placeholder="Enter name" />
  </div>
  <div className="flex gap-2 justify-end">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>

// Sidebar layout
<div className="flex h-screen">
  <aside className="w-64 border-r bg-sidebar">
    {/* Sidebar content */}
  </aside>
  <main className="flex-1 overflow-auto">
    {/* Main content */}
  </main>
</div>
```

### Utility Combos

```tsx
// Centered content
<div className="flex items-center justify-center min-h-screen">

// Sticky header
<header className="sticky top-0 z-50 bg-background border-b">

// Truncate text
<p className="truncate max-w-xs">Long text that will be truncated</p>

// Card hover effect
<Card className="hover:shadow-lg hover:-translate-y-1 transition-all">

// Loading skeleton
<div className="animate-pulse bg-muted rounded h-20 w-full" />
```

---

## 🔗 Resources

### Tools

-   **OKLCH Color Picker**: https://oklch.com
-   **Contrast Checker**: https://webaim.org/resources/contrastchecker/
-   **Tailwind CSS Docs**: https://tailwindcss.com/docs
-   **Shadcn UI**: https://ui.shadcn.com
-   **React Icons**: https://react-icons.github.io/react-icons/

### Design References

-   **Apple Human Interface Guidelines**: For desktop app patterns
-   **Microsoft Fluent Design**: For data-dense interfaces
-   **Material Design 3**: For color system principles
-   **Tailwind UI**: For component examples

### Testing Tools

-   **Chrome DevTools**: Lighthouse, Accessibility Inspector
-   **axe DevTools**: Comprehensive accessibility testing
-   **WAVE**: Web accessibility evaluation tool
-   **Color Oracle**: Color blindness simulator

---

## 📝 Changelog

### Version 1.0.0 (Current)

-   Initial styling system
-   OKLCH color space implementation
-   Desktop-optimized spacing scale
-   Performance-focused utilities
-   Comprehensive accessibility guidelines

---

## 🤝 Contributing

When adding new styles:

1. **Follow existing patterns** - Use OKLCH for colors, maintain spacing scale
2. **Test in both themes** - Ensure light and dark mode compatibility
3. **Consider performance** - Use GPU-accelerated properties
4. **Document usage** - Add examples and use cases
5. **Test accessibility** - Check contrast ratios and keyboard navigation

### Style Addition Checklist

-   [ ] Uses OKLCH color space
-   [ ] Works in light and dark mode
-   [ ] Meets WCAG AA contrast standards
-   [ ] Includes usage examples
-   [ ] Performance optimized (transform/opacity only for animations)
-   [ ] Responsive (if applicable)
-   [ ] Documented in this guide

---

<div align="center">

**Vaultrs Styling Guide v1.0.0**

Built with ❤️ for high-performance desktop applications

</div>
