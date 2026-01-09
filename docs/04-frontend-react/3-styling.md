# 🎨 Styling Guide - Vaultrs

> **Mục tiêu:** Hướng dẫn về styling system sử dụng Tailwind CSS và design tokens.

---

## 📋 TL;DR

| Aspect         | Approach                | Tools                  |
| -------------- | ----------------------- | ---------------------- |
| **Colors**     | CSS Variables + OKLCH   | Tailwind + CSS vars    |
| **Typography** | Inter + JetBrains Mono  | Google Fonts           |
| **Spacing**    | 4px base unit           | Tailwind utilities     |
| **Dark Mode**  | Class-based switching   | ThemeProvider          |

---

## 1. 🎨 Color System

### OKLCH Color Space

Vaultrs sử dụng **OKLCH** cho:
- ✅ Perceptual uniformity
- ✅ Predictable lightness
- ✅ Consistent contrast

### Light Theme

```css
:root {
  /* Background */
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.2 0.013 250);
  
  /* Cards & Surfaces */
  --card: oklch(1 0 0);
  --popover: oklch(1 0 0);
  
  /* Brand Colors */
  --primary: oklch(0.55 0.22 260);
  --primary-foreground: oklch(0.98 0 0);
  
  /* UI Colors */
  --secondary: oklch(0.96 0.006 250);
  --muted: oklch(0.96 0.006 250);
  --accent: oklch(0.94 0.017 250);
  
  /* Status Colors */
  --destructive: oklch(0.55 0.22 25);
  --success: oklch(0.55 0.16 145);
  --warning: oklch(0.65 0.2 65);
  
  /* Border & Ring */
  --border: oklch(0.9 0.005 250);
  --ring: oklch(0.55 0.22 260);
  
  /* Radius */
  --radius: 0.5rem;
}
```

### Dark Theme

```css
.dark {
  --background: oklch(0.15 0.005 250);
  --foreground: oklch(0.95 0.005 250);
  
  --card: oklch(0.18 0.008 250);
  --popover: oklch(0.16 0.006 250);
  
  --primary: oklch(0.6 0.24 260);
  --secondary: oklch(0.25 0.01 250);
  --muted: oklch(0.25 0.01 250);
  
  --border: oklch(0.25 0.008 250);
}
```

---

## 2. ✍️ Typography

### Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Type Scale

| Class       | Size      | Usage                   |
| ----------- | --------- | ----------------------- |
| `text-xs`   | 12px      | Metadata, timestamps    |
| `text-sm`   | 14px      | Secondary text          |
| `text-base` | 16px      | Body text (default)     |
| `text-lg`   | 18px      | Emphasis                |
| `text-xl`   | 20px      | Small headers (h4)      |
| `text-2xl`  | 24px      | Section headers (h3)    |
| `text-3xl`  | 30px      | Page titles (h2)        |
| `text-4xl`  | 36px      | Hero text (h1)          |

### Usage Examples

```tsx
// Page title
<h1 className="text-3xl font-bold tracking-tight">
  My Collections
</h1>

// Section header
<h2 className="text-xl font-semibold mb-4">
  Recent Items
</h2>

// Body text
<p className="text-muted-foreground">
  Description text goes here.
</p>

// Monospace for data
<span className="font-mono text-sm tabular-nums">
  1,234,567
</span>

// Uppercase label
<span className="text-xs uppercase tracking-wide text-muted-foreground">
  Status
</span>
```

---

## 3. 📏 Spacing & Layout

### Spacing Scale (4px base)

| Class | Size    | Pixels |
| ----- | ------- | ------ |
| `p-1` | 0.25rem | 4px    |
| `p-2` | 0.5rem  | 8px    |
| `p-3` | 0.75rem | 12px   |
| `p-4` | 1rem    | 16px   |
| `p-6` | 1.5rem  | 24px   |
| `p-8` | 2rem    | 32px   |

### Common Patterns

```tsx
// Card padding
<Card className="p-6">...</Card>

// Section spacing
<section className="space-y-6">
  <div>Section 1</div>
  <div>Section 2</div>
</section>

// Grid layout
<div className="grid grid-cols-3 gap-4">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</div>

// Flex with gap
<div className="flex items-center gap-2">
  <Icon />
  <span>Label</span>
</div>
```

### Border Radius

| Class        | Size   | Usage          |
| ------------ | ------ | -------------- |
| `rounded-sm` | 4px    | Badges, tags   |
| `rounded`    | 6px    | Buttons, inputs|
| `rounded-lg` | 8px    | Cards          |
| `rounded-xl` | 12px   | Modals         |

---

## 4. 🌓 Theme Switching

### ThemeProvider

```tsx
// components/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be within ThemeProvider');
  return context;
};
```

### ThemeToggle Component

```tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

---

## 5. 🧩 Component Styling Patterns

### Button States

```css
/* Base button */
.btn {
  @apply px-4 py-2 rounded-md font-medium;
  @apply transition-colors duration-200;
}

/* Hover */
.btn:hover {
  @apply bg-primary/90;
}

/* Active */
.btn:active {
  @apply bg-primary/80;
}

/* Disabled */
.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Focus */
.btn:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2;
}
```

### Interactive Cards

```tsx
<Card 
  className={cn(
    "cursor-pointer transition-all duration-200",
    "hover:bg-accent/50 hover:shadow-md",
    "active:scale-[0.98]",
    isSelected && "ring-2 ring-primary"
  )}
>
  ...
</Card>
```

### Status Badges

```css
.status-success {
  @apply bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400;
}

.status-warning {
  @apply bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400;
}

.status-error {
  @apply bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400;
}

.status-info {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400;
}
```

---

## 6. ⚡ Performance Tips

### Hardware Acceleration

```css
/* Use transform for animations */
.animate-slide-in {
  transform: translateX(0);
  transition: transform 200ms ease-out;
}

/* Enable GPU acceleration */
.gpu-accelerated {
  will-change: transform;
  transform: translateZ(0);
}
```

### Avoid Layout Thrashing

```tsx
// ❌ Bad - triggers layout
<div style={{ width: someWidth, height: someHeight }}>

// ✅ Good - uses transform
<div style={{ transform: `scale(${scale})` }}>
```

### Reduce Repaints

```tsx
// Use CSS classes instead of inline styles
const className = isActive ? 'bg-primary' : 'bg-secondary';
<div className={className}>

// Avoid animating box-shadow, border, width, height
```

---

## 7. 📱 Responsive Design

### Breakpoints

| Prefix | Width   | Usage            |
| ------ | ------- | ---------------- |
| `sm:`  | 640px   | Small tablets    |
| `md:`  | 768px   | Tablets          |
| `lg:`  | 1024px  | Laptops          |
| `xl:`  | 1280px  | Desktops         |
| `2xl:` | 1536px  | Large screens    |

### Desktop-First (Vaultrs is desktop app)

```tsx
// Since Vaultrs is a desktop app, design for large screens first
<div className="grid grid-cols-4 gap-6">
  {collections.map(c => <CollectionCard key={c.id} {...c} />)}
</div>
```

---

## 🔗 Tài liệu Liên quan

- [Frontend Overview](./1-overview.md)
- [Components](./2-components.md)
- [Virtual Scrolling](./4-virtual-scrolling.md)
- [STYLING.md (Full Guide)](../../.docs/STYLING.md)

---

_Cập nhật: 2026-01-08_
