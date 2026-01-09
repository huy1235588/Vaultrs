# 📜 Virtual Scrolling - Vaultrs

> **Mục tiêu:** Hướng dẫn implement virtual scrolling cho 10M+ records với TanStack Virtual.

---

## 📋 TL;DR

| Metric            | Without Virtual | With Virtual |
| ----------------- | --------------- | ------------ |
| DOM nodes         | 10,000,000      | ~50          |
| Memory usage      | Gigabytes       | Megabytes    |
| Initial render    | Minutes         | Milliseconds |
| Scroll performance| Unusable        | 60 FPS       |

---

## 1. 📖 Why Virtual Scrolling?

### The Problem

```
10M items × 50px height = 500,000,000 pixels
10M DOM nodes = Gigabytes of memory
= Browser crash 💥
```

### The Solution

```
Viewport height: 800px
Row height: 50px
Visible rows: 16
Overscan: 5 each side
Total rendered: ~26 rows

Memory: O(1) instead of O(n) ✅
```

### Visual Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TOTAL LIST (10M items)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← Not rendered        │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    (items 0-99,970)    │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                        │
│   ─────────────────────────────────── ← Overscan start       │
│   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒    (5 rows buffer)     │
│   ═══════════════════════════════════ ← Viewport start       │
│   ██████████████████████████████████                         │
│   ██████████████████████████████████    ← VISIBLE            │
│   ██████████████████████████████████      (~16 rows)         │
│   ██████████████████████████████████                         │
│   ═══════════════════════════════════ ← Viewport end         │
│   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒    (5 rows buffer)     │
│   ─────────────────────────────────── ← Overscan end         │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                        │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← Not rendered        │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    (remaining items)   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 📦 Installation

```bash
pnpm add @tanstack/react-virtual
```

---

## 3. 🔧 Basic Implementation

### Simple Virtual List

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps {
  items: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  rowHeight?: number;
}

export function VirtualList({ items, renderRow, rowHeight = 50 }: VirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5, // Render 5 extra rows above/below viewport
  });
  
  return (
    <div 
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderRow(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Usage

```tsx
function ItemsPage() {
  const { items } = useItems(collectionId);
  
  return (
    <VirtualList
      items={items}
      rowHeight={50}
      renderRow={(item, index) => (
        <div className="flex items-center px-4 border-b hover:bg-accent/50">
          <span className="w-16 text-muted-foreground">{item.id}</span>
          <span className="flex-1">{item.title}</span>
        </div>
      )}
    />
  );
}
```

---

## 4. 📊 Virtual Table

### Implementation

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  render?: (value: any, item: T) => React.ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
}

export function VirtualTable<T extends { id: number }>({ 
  data, 
  columns, 
  rowHeight = 48 
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });
  
  return (
    <div className="border rounded-lg">
      {/* Fixed Header */}
      <div className="border-b bg-muted/50">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead 
                  key={String(col.key)}
                  style={{ width: col.width }}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      
      {/* Virtual Body */}
      <div 
        ref={parentRef}
        className="h-[calc(100vh-200px)] overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          <Table>
            <TableBody>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = data[virtualRow.index];
                return (
                  <TableRow
                    key={item.id}
                    className="absolute w-full"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell 
                        key={String(col.key)}
                        style={{ width: col.width }}
                      >
                        {col.render 
                          ? col.render(item[col.key], item)
                          : String(item[col.key])
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
```

### Usage

```tsx
function ItemsTable() {
  const { items } = useItems(collectionId);
  
  const columns = [
    { key: 'id', header: 'ID', width: 80 },
    { key: 'title', header: 'Title' },
    { 
      key: 'status', 
      header: 'Status',
      width: 120,
      render: (value) => <Badge>{value}</Badge>
    },
    {
      key: 'created_at',
      header: 'Created',
      width: 150,
      render: (value) => formatDate(value),
    },
  ];
  
  return <VirtualTable data={items} columns={columns} />;
}
```

---

## 5. 🔄 Infinite Scrolling

### With Data Fetching

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteItems } from '../hooks/useInfiniteItems';

export function InfiniteItemList({ collectionId }: { collectionId: number }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const {
    items,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteItems(collectionId);
  
  const virtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });
  
  // Trigger fetch when approaching end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    
    if (!lastItem) return;
    
    if (
      lastItem.index >= items.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    items.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index > items.length - 1;
          const item = items[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <ItemRow item={item} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 6. ⚡ Performance Optimization

### Row Memoization

```tsx
const MemoizedRow = memo(function ItemRow({ item }: { item: Item }) {
  return (
    <div className="flex items-center px-4 h-full border-b">
      <span>{item.title}</span>
    </div>
  );
}, (prev, next) => prev.item.id === next.item.id);
```

### Stable Keys

```tsx
// ✅ Use stable unique IDs
key={item.id}

// ❌ Avoid using index as key
key={virtualRow.index}
```

### CSS Optimization

```css
/* Use transform instead of top */
.virtual-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateY(var(--row-offset));
  will-change: transform;
}

/* Avoid expensive properties in rows */
.virtual-row:hover {
  background: hsl(var(--accent) / 0.5);
  /* ❌ Avoid: box-shadow, border-radius changes */
}
```

---

## 7. 📊 With TanStack Table

### Combined Usage

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

function VirtualDataGrid({ data, columns }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  
  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-background z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {virtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index];
            return (
              <tr
                key={row.id}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔗 Tài liệu Liên quan

- [Frontend Overview](./1-overview.md)
- [Components](./2-components.md)
- [TanStack Virtual Docs](https://tanstack.com/virtual/latest)

---

_Cập nhật: 2026-01-08_
