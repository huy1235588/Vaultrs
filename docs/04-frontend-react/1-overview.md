# ⚛️ Frontend React Overview - Vaultrs

> **Mục tiêu:** Giới thiệu tổng quan về frontend React với TypeScript cho ứng dụng Vaultrs.

---

## 📋 TL;DR

| Component     | Technology       | Purpose               |
| ------------- | ---------------- | --------------------- |
| **Framework** | React 18         | UI library            |
| **Language**  | TypeScript       | Type-safe development |
| **Build**     | Vite             | Fast bundler          |
| **UI Kit**    | Shadcn UI        | Accessible components |
| **Styling**   | Tailwind CSS     | Utility-first CSS     |
| **Table**     | TanStack Table   | Data grid logic       |
| **Virtual**   | TanStack Virtual | 10M+ row rendering    |

---

## 1. 📁 Project Structure

### Current Structure

```
desktop/src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── App.css               # App styles
├── globals.css           # Global styles & design tokens
├── vite-env.d.ts         # Vite types
├── components/           # UI components
│   └── ui/               # Shadcn components
└── lib/                  # Utilities
```

### Planned Module-based Structure

```
desktop/src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root + routing
├── globals.css              # Design tokens
├── vite-env.d.ts
│
├── core/                    # 🔧 Shared utilities
│   ├── api/                 # Tauri invoke wrappers
│   ├── hooks/               # Shared hooks
│   ├── types/               # Global types
│   └── utils/               # Helper functions
│
├── components/              # 🧩 Shared UI components
│   ├── ui/                  # Shadcn base
│   ├── Layout/              # Layout components
│   └── common/              # App-wide components
│
├── modules/                 # 📦 Feature modules
│   ├── collection/          # Collection management
│   ├── item/                # Item CRUD
│   └── search/              # Search functionality
│
├── pages/                   # 📄 Route pages
│   ├── HomePage.tsx
│   ├── CollectionPage.tsx
│   └── SettingsPage.tsx
│
└── router/                  # 🔀 Routing
    └── index.tsx
```

---

## 2. ⚡ Entry Point

### main.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

### App.tsx

```tsx
import { ThemeProvider } from "./components/ThemeProvider";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { Toaster } from "./components/ui/sonner";

function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="vaultrs-theme">
            <RouterProvider router={router} />
            <Toaster position="bottom-right" />
        </ThemeProvider>
    );
}

export default App;
```

---

## 3. 📦 Feature Module Pattern

### Module Structure

```
modules/collection/
├── components/           # Module-specific components
│   ├── CollectionList.tsx
│   ├── CollectionCard.tsx
│   └── CreateCollectionDialog.tsx
├── hooks/                # Module-specific hooks
│   └── useCollections.ts
├── services/             # API calls
│   └── collectionService.ts
├── types/                # TypeScript types
│   └── collection.types.ts
└── index.ts              # Public API
```

### Module Index (Public API)

```typescript
// modules/collection/index.ts
export { CollectionList } from "./components/CollectionList";
export { CollectionCard } from "./components/CollectionCard";
export { useCollections } from "./hooks/useCollections";
export { collectionService } from "./services/collectionService";
export type { Collection, CreateCollectionDto } from "./types/collection.types";
```

### Usage in Pages

```tsx
// pages/HomePage.tsx
import { CollectionList, useCollections } from "@/modules/collection";

function HomePage() {
    const { collections, loading } = useCollections();

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8">My Collections</h1>
            <CollectionList collections={collections} loading={loading} />
        </div>
    );
}
```

---

## 4. 🎨 Styling System

### Design Philosophy

-   **OKLCH Color Space**: Better perceptual uniformity
-   **Light/Dark Themes**: System preference detection
-   **Dense UI**: Optimized for data-heavy desktop app
-   **Hardware Acceleration**: GPU-optimized animations

### CSS Variables (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
    :root {
        /* Light theme */
        --background: oklch(0.99 0 0);
        --foreground: oklch(0.2 0.013 250);
        --primary: oklch(0.55 0.22 260);
        --card: oklch(1 0 0);
        --muted: oklch(0.96 0.006 250);
        --radius: 0.5rem;
    }

    .dark {
        /* Dark theme */
        --background: oklch(0.15 0.005 250);
        --foreground: oklch(0.95 0.005 250);
        --primary: oklch(0.6 0.24 260);
        --card: oklch(0.18 0.008 250);
    }
}
```

### Tailwind Config Highlights

```typescript
// tailwind.config.ts
export default {
    darkMode: "class",
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: "hsl(var(--primary))",
                // ... more colors
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
        },
    },
};
```

---

## 5. 🌐 Tauri Integration

### API Service

```typescript
// core/api/tauri.ts
import { invoke } from "@tauri-apps/api/core";

export async function invokeCommand<T>(
    command: string,
    args?: Record<string, unknown>
): Promise<T> {
    try {
        return await invoke<T>(command, args);
    } catch (error) {
        console.error(`Command ${command} failed:`, error);
        throw error;
    }
}
```

### Service Example

```typescript
// modules/collection/services/collectionService.ts
import { invokeCommand } from "@/core/api/tauri";
import type {
    Collection,
    CreateCollectionDto,
} from "../types/collection.types";

export const collectionService = {
    getAll: () => invokeCommand<Collection[]>("get_collections"),

    getById: (id: number) =>
        invokeCommand<Collection | null>("get_collection", { id }),

    create: (data: CreateCollectionDto) =>
        invokeCommand<Collection>("create_collection", data),

    delete: (id: number) => invokeCommand<void>("delete_collection", { id }),
};
```

---

## 6. 🔄 State Management

### Strategy

| State Type | Solution          | Use Case             |
| ---------- | ----------------- | -------------------- |
| Local      | `useState`        | Component state      |
| Module     | Context           | Shared within module |
| Server     | Custom hooks      | API data             |
| URL        | `useSearchParams` | Filters, pagination  |

### Custom Hook Example

```typescript
// modules/collection/hooks/useCollections.ts
import { useState, useEffect } from "react";
import { collectionService } from "../services/collectionService";
import type { Collection } from "../types/collection.types";

export function useCollections() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const data = await collectionService.getAll();
            setCollections(data);
        } catch (err) {
            setError(err as string);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const refetch = () => fetchCollections();

    return { collections, loading, error, refetch };
}
```

---

## 7. 🧪 Testing

### Test Structure

```
src/
├── modules/
│   └── collection/
│       ├── __tests__/
│       │   ├── CollectionList.test.tsx
│       │   └── useCollections.test.ts
│       └── components/
└── ...
```

### Testing Tools

| Tool                  | Purpose           |
| --------------------- | ----------------- |
| Vitest                | Test runner       |
| React Testing Library | Component testing |
| MSW                   | API mocking       |

---

## 8. 📋 Implementation Checklist

| Module      | Status     | Components                 |
| ----------- | ---------- | -------------------------- |
| core/       | ⬜ Planned | api, hooks, types, utils   |
| components/ | 🟨 Partial | Shadcn UI installed        |
| collection/ | ⬜ Planned | List, Card, Create/Edit    |
| item/       | ⬜ Planned | List, Details, Form        |
| search/     | ⬜ Planned | SearchBar, Results         |
| pages/      | ⬜ Planned | Home, Collection, Settings |

---

## 🔗 Tài liệu Liên quan

-   [Components](./2-components.md)
-   [Styling Guide](./3-styling.md)
-   [Virtual Scrolling](./4-virtual-scrolling.md)
-   [Backend Integration](../03-backend-rust/2-commands.md)

---

_Cập nhật: 2026-01-08_
