# 🧩 Components - Vaultrs

> **Mục tiêu:** Hướng dẫn về UI components sử dụng Shadcn UI và custom components.

---

## 📋 TL;DR

| Component Type      | Location                | Purpose                    |
| ------------------- | ----------------------- | -------------------------- |
| **Shadcn UI**       | `components/ui/`        | Base accessible components |
| **Layout**          | `components/Layout/`    | App layout structure       |
| **Common**          | `components/common/`    | Shared app components      |
| **Module-specific** | `modules/*/components/` | Feature components         |

---

## 1. 📁 Component Organization

### Directory Structure

```
src/components/
├── ui/                      # Shadcn UI base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── badge.tsx
│   └── ...
│
├── Layout/                  # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── MainLayout.tsx
│   └── index.ts
│
├── common/                  # Shared components
│   ├── Logo.tsx
│   ├── SearchInput.tsx
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   └── index.ts
│
└── ThemeProvider.tsx        # Theme context
```

---

## 2. 🎯 Shadcn UI Components

### Installation

```bash
# Add Shadcn components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add badge
```

### Button Variants

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With loading state
<Button disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save Changes
</Button>
```

### Card Component

```tsx
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";

<Card>
    <CardHeader>
        <CardTitle>Collection Name</CardTitle>
        <CardDescription>Collection description</CardDescription>
    </CardHeader>
    <CardContent>
        <p>Card content goes here</p>
    </CardContent>
    <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
    </CardFooter>
</Card>;
```

### Dialog Component

```tsx
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

function CreateCollectionDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Collection</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Collection</DialogTitle>
                    <DialogDescription>
                        Add a new collection to organize your items.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4">
                    <Input placeholder="Collection name" />
                    <Input placeholder="Slug (url-friendly)" />
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

---

## 3. 🏗️ Layout Components

### MainLayout.tsx

```tsx
// components/Layout/MainLayout.tsx
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    );
}
```

### Header.tsx

```tsx
// components/Layout/Header.tsx
import { SearchInput } from "../common/SearchInput";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur">
            <div className="flex h-full items-center justify-between px-6">
                <div className="flex-1 max-w-md">
                    <SearchInput placeholder="Search items..." />
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
```

### Sidebar.tsx

```tsx
// components/Layout/Sidebar.tsx
import { useCollections } from "@/modules/collection";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const { collections } = useCollections();

    return (
        <aside className="w-64 border-r bg-muted/30">
            <div className="p-4">
                <Logo />
            </div>

            <nav className="space-y-1 px-2">
                <SidebarLink href="/" icon={<Home />}>
                    Dashboard
                </SidebarLink>

                <div className="py-2">
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase">
                        Collections
                    </h3>
                    {collections.map((collection) => (
                        <SidebarLink
                            key={collection.id}
                            href={`/collection/${collection.slug}`}
                            icon={collection.icon}
                        >
                            {collection.name}
                        </SidebarLink>
                    ))}
                </div>
            </nav>
        </aside>
    );
}

function SidebarLink({ href, icon, children, className }: SidebarLinkProps) {
    return (
        <Link
            to={href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-accent transition-colors",
                className
            )}
        >
            {icon}
            <span>{children}</span>
        </Link>
    );
}
```

---

## 4. 🔧 Common Components

### LoadingSpinner.tsx

```tsx
// components/common/LoadingSpinner.tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingSpinner({
    size = "md",
    className,
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    return (
        <Loader2
            className={cn(
                "animate-spin text-muted-foreground",
                sizeClasses[size],
                className
            )}
        />
    );
}
```

### EmptyState.tsx

```tsx
// components/common/EmptyState.tsx
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// Usage
<EmptyState
    icon={<FolderOpen className="h-12 w-12" />}
    title="No collections yet"
    description="Create your first collection to start organizing your media."
    action={<Button>Create Collection</Button>}
/>;
```

### SearchInput.tsx

```tsx
// components/common/SearchInput.tsx
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder,
}: SearchInputProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-9"
            />
            {value && (
                <button
                    onClick={() => onChange?.("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
            )}
        </div>
    );
}
```

---

## 5. 📦 Module Components

### CollectionCard.tsx

```tsx
// modules/collection/components/CollectionCard.tsx
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import type { Collection } from "../types/collection.types";

interface CollectionCardProps {
    collection: Collection;
    onClick?: () => void;
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
    return (
        <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={onClick}
        >
            <CardHeader>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{collection.icon || "📁"}</span>
                    <div>
                        <CardTitle className="text-lg">
                            {collection.name}
                        </CardTitle>
                        {collection.description && (
                            <CardDescription className="line-clamp-2">
                                {collection.description}
                            </CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
```

### ItemList.tsx

```tsx
// modules/item/components/ItemList.tsx
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import type { Item } from "../types/item.types";

interface ItemListProps {
    items: Item[];
    loading?: boolean;
    onItemClick?: (item: Item) => void;
}

export function ItemList({ items, loading, onItemClick }: ItemListProps) {
    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <EmptyState
                title="No items found"
                description="Add your first item to this collection."
            />
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Added</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onItemClick?.(item)}
                    >
                        <TableCell className="font-medium">
                            {item.title}
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">
                                {item.properties?.status || "Unknown"}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                            {formatDate(item.created_at)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

---

## 6. 🎨 Component Patterns

### Compound Components

```tsx
// Example: Tabs with compound pattern
<Tabs defaultValue="details">
    <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="metadata">Metadata</TabsTrigger>
    </TabsList>
    <TabsContent value="details">
        <ItemDetails item={item} />
    </TabsContent>
    <TabsContent value="metadata">
        <ItemMetadata item={item} />
    </TabsContent>
</Tabs>
```

### Render Props

```tsx
// components/common/DataFetcher.tsx
interface DataFetcherProps<T> {
    fetchFn: () => Promise<T>;
    children: (
        data: T,
        loading: boolean,
        error: string | null
    ) => React.ReactNode;
}

export function DataFetcher<T>({ fetchFn, children }: DataFetcherProps<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ... fetch logic

    return <>{children(data!, loading, error)}</>;
}

// Usage
<DataFetcher fetchFn={() => api.getItems(collectionId)}>
    {(items, loading, error) => <ItemList items={items} loading={loading} />}
</DataFetcher>;
```

---

## 🔗 Tài liệu Liên quan

-   [Frontend Overview](./1-overview.md)
-   [Styling Guide](./3-styling.md)
-   [Virtual Scrolling](./4-virtual-scrolling.md)

---

_Cập nhật: 2026-01-08_
