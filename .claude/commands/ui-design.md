# ETL Engine UI Design System

Follow these design guidelines when creating or modifying UI components in the `ui/` folder.

## Color Palette

**Primary**: Purple/Indigo — use Tailwind's `primary-*` scale (based on #8b5cf6)
- Buttons: `bg-indigo-600 hover:bg-indigo-700` (default variant already set in Button component)
- Active nav/tabs: `text-primary-600 bg-primary-50`
- Links: `text-primary-600 hover:text-primary-700`
- Focus rings: `focus-visible:ring-primary-200`

**Backgrounds**:
- Page background: `bg-neutral-50` (#fafafa)
- Cards/panels: `bg-white`
- Hover states: `hover:bg-neutral-50` or `hover:bg-primary-50` for active items

**Text**:
- Headings: `text-neutral-900`
- Body: `text-neutral-700`
- Secondary/muted: `text-neutral-500`
- Disabled: `text-neutral-400`

**Borders**: `border-neutral-200` (subtle, light)

**Status colors**: Use the `success-*`, `warning-*`, `error-*`, `info-*` scales from tailwind config. Use the `StatusBadge` component from `components/ui/status-badge.tsx`.

## Layout Patterns

### Page Structure
```tsx
<PageContainer>
  <PageHeader title="..." description="..." actions={<Button>Action</Button>} />
  {/* Page content */}
</PageContainer>
```
- `PageContainer`: `p-6 max-w-[1400px] mx-auto`
- Always use `PageHeader` for consistent page tops

### Application Shell
- **Sidebar**: 60px wide, icon-only, `bg-white border-r border-neutral-200`
- Active item: left 3px purple border + `bg-primary-50 text-primary-600`
- Icons from `lucide-react`, 20px size
- Main content: `flex-1 overflow-auto bg-neutral-50`

### Card Grid Lists
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <ItemCard key={item._id} />)}
</div>
```
- Cards: `rounded-lg border border-neutral-200 bg-white shadow-sm`
- Card hover: `hover:shadow-md hover:border-primary-200 transition-all`
- Always provide grid/list view toggle
- Show `EmptyState` when no items

### Detail Pages
- Left info sidebar (~280px) + right content area with tabs
- Left panel: entity info, collapsible sections using `Accordion`
- Right panel: `Tabs` with horizontal tab bar, purple active indicator

## Component Patterns

### Cards
Use existing `Card`, `CardHeader`, `CardContent`, `CardFooter` from `components/ui/card.tsx`.
- For list item cards, add: `cursor-pointer hover:shadow-md hover:border-primary-200`
- Three-dot dropdown menu in top-right corner for actions (use `DropdownMenu`)
- Archived items: add `opacity-60` and an "Archived" badge

### Buttons
Use existing `Button` from `components/ui/button.tsx`.
- Primary action: `variant="default"` (purple)
- Secondary action: `variant="outline"`
- Danger action: `variant="destructive"`
- Icon buttons: `variant="ghost" size="icon"`
- Button in page header: always on the right side

### Forms & Modals
- Use `Dialog` from `components/ui/dialog.tsx` for create/edit modals
- Stack fields vertically with `space-y-4`
- Labels: `text-sm font-medium text-neutral-700`
- Required indicator: `<span className="text-error-500">*</span>` after label text
- Modal footer: `flex justify-end gap-3` with Cancel (outline) + Action (default/purple)
- Use `react-hook-form` + `zod` for all form validation
- Error messages: `text-sm text-error-500 mt-1`

### Tables
Use existing `Table` primitives from `components/ui/table.tsx`.
- Header: `bg-neutral-50 text-neutral-600 text-xs font-medium uppercase tracking-wider`
- Rows: `hover:bg-neutral-50` for interactivity
- Clickable rows: add `cursor-pointer`
- Always include `Pagination` below tables

### Badges & Status
- Use `StatusBadge` for run statuses (success/failed/running/etc.)
- Use `Badge` from `components/ui/badge.tsx` for categories/counts
- Connection type badges: small icon + label (Database/FileText icon from lucide)

### Empty States
- Centered in the content area
- Icon (lucide, 48px, `text-neutral-300`)
- Title: `text-lg font-medium text-neutral-900`
- Description: `text-sm text-neutral-500`
- CTA button below (optional)

### Loading States
- Use skeleton cards matching the page layout
- Inline loading: `Loader2` icon from lucide with `animate-spin`
- Never block the entire page — show skeletons in place

### Toolbar Pattern
For list pages, above the grid/table:
```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <SearchInput />
    <FilterDropdown />
  </div>
  <div className="flex items-center gap-2">
    <ViewToggle />
  </div>
</div>
```

## Typography

- Page title: `text-2xl font-semibold text-neutral-900`
- Section title: `text-lg font-medium text-neutral-900`
- Card title: `text-base font-medium text-neutral-900`
- Body: `text-sm text-neutral-700`
- Caption/meta: `text-xs text-neutral-500`
- Monospace (SQL, code): `font-mono text-sm`

## Spacing

- Page padding: `p-6`
- Card padding: `p-6` (via CardHeader/CardContent)
- Between sections: `space-y-6`
- Between cards in grid: `gap-4`
- Between form fields: `space-y-4`
- Between inline elements: `gap-2` or `gap-3`

## Animations

Use Tailwind animations defined in `tailwind.config.js`:
- Page/card entrance: `animate-fade-in`
- Sidebar slide: `animate-slide-in-left`
- Modal/popover: `animate-scale-in`
- Running status: `animate-pulse-subtle`
- Loading shimmer: `animate-shimmer`

Use `framer-motion` for:
- Card hover effects (`whileHover={{ y: -2 }}`)
- List item stagger animations
- Page transitions

## Icons

Use `lucide-react` exclusively. Common icons for this project:
- Dashboard: `LayoutDashboard`
- Connections: `Plug`
- Schemas: `Database`
- Mappings: `GitBranch`
- Run History: `History`
- Delta Lake: `HardDrive`
- Settings: `Settings`
- Add/Create: `Plus`
- Edit: `Pencil`
- Delete/Archive: `Trash2` / `Archive`
- Restore: `ArchiveRestore`
- Search: `Search`
- Filter: `Filter`
- Test connection: `Zap`
- Run/Execute: `Play`
- Success: `CheckCircle2`
- Error: `XCircle`
- Warning: `AlertCircle`
- File types: `FileText` (csv), `FileJson` (json), `FileSpreadsheet` (excel)
- Database types: `Database` (mysql/postgresql)

## Existing Components to Reuse

Always import from `@/components/ui/`:
- `Button` (with variants: default, destructive, outline, secondary, ghost, link)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
- `Input`, `Label`, `Textarea`, `Select`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge`, `StatusBadge`
- `Alert`, `AlertDescription`
- `ConfirmDialog`
- `Combobox`
- `DropdownMenu` and sub-components
- `Accordion` and sub-components
- `Popover`
- `Stepper`
- `MetricCard`
- `Toaster` (via `sonner` — use `toast.success()`, `toast.error()`)

Utility: `cn()` from `@/lib/utils` for conditional class merging.
