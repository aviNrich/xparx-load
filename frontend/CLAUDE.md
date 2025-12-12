# Frontend - Claude Context

## Service Overview
This is the **ETL Engine Frontend** - a modern React TypeScript application that provides a user interface for managing database connections, ETL mappings, schemas, and schedules.

**Port:** 5173 (Vite dev server)
**Framework:** React with TypeScript
**Build Tool:** Vite
**Purpose:** User interface for ETL configuration and management

## Architecture

### Tech Stack
- **React 18.2** - UI library
- **TypeScript 5.3** - Type safety
- **Vite 5** - Fast build tool and dev server
- **React Router DOM 7** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Pre-built UI components (Radix UI primitives)
- **React Hook Form 7** - Form state management
- **Zod 3.22** - Schema validation
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Monaco Editor** - SQL editor component

### Key Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^7.10.1",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "axios": "^1.6.5",
    "@monaco-editor/react": "^4.7.0",
    "lucide-react": "^0.309.0",
    "tailwindcss": "^3.4.1",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16"
  }
}
```

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                          # Main app component with router
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Global styles + Tailwind imports
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── label.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── combobox.tsx
│   │   │   ├── stepper.tsx
│   │   │   └── confirm-dialog.tsx
│   │   ├── layout/
│   │   │   └── Sidebar.tsx              # Left navigation sidebar
│   │   ├── connections/
│   │   │   ├── ConnectionList.tsx       # Grid of connection cards
│   │   │   └── ConnectionForm.tsx       # Create/edit connection form
│   │   ├── mappings/
│   │   │   ├── MappingList.tsx          # List of ETL mappings
│   │   │   ├── ColumnMappingList.tsx    # Column mapping configuration
│   │   │   ├── DirectMappingRow.tsx     # Direct mapping row
│   │   │   ├── SplitMappingRow.tsx      # Split mapping row
│   │   │   ├── JoinMappingRow.tsx       # Join mapping row
│   │   │   ├── SqlPreviewTable.tsx      # SQL query preview table
│   │   │   └── EntityColumnSelectionDialog.tsx
│   │   ├── schemas/
│   │   │   ├── SchemaList.tsx           # List of schemas
│   │   │   └── SchemaForm.tsx           # Create/edit schema form
│   │   └── dashboard/
│   │       ├── MetricCard.tsx
│   │       ├── MarketDemands.tsx
│   │       └── ItemSuppliers.tsx
│   ├── pages/
│   │   ├── SourcesPage.tsx              # Connections management
│   │   ├── MappingsPage.tsx             # Mappings list page
│   │   ├── NewMappingPage.tsx           # Create/edit mapping
│   │   ├── ColumnMappingPage.tsx        # Column mapping configuration
│   │   ├── SchedulingPage.tsx           # Schedule management
│   │   └── SchemaPage.tsx               # Schema management
│   ├── hooks/
│   │   ├── useConnections.ts            # Connection state management
│   │   ├── useMappings.ts               # Mapping state management
│   │   ├── useSchemas.ts                # Schema state management
│   │   └── useTables.ts                 # Table listing hook
│   ├── services/
│   │   ├── api.ts                       # Main API client (Axios)
│   │   └── schedule.api.ts              # Schedule API client
│   ├── types/
│   │   ├── connection.ts                # Connection TypeScript types
│   │   ├── mapping.ts                   # Mapping TypeScript types
│   │   ├── schema.ts                    # Schema TypeScript types
│   │   └── schedule.ts                  # Schedule TypeScript types
│   └── lib/
│       └── utils.ts                     # Utility functions (cn, etc.)
├── public/                              # Static assets
├── .env.local                           # Environment variables (gitignored)
├── .env.example                         # Example environment file
├── package.json
├── vite.config.ts                       # Vite configuration
├── tailwind.config.js                   # Tailwind configuration
├── tsconfig.json                        # TypeScript configuration
├── postcss.config.js                    # PostCSS configuration
└── components.json                      # shadcn/ui configuration
```

## Environment Variables

Create `.env.local` in the frontend directory:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

This points to the backend API service.

## Design System

### Color Scheme: Purple & Grey
The application uses a **purple and grey** color palette for a professional, modern look:

**Primary Purple:**
- `primary-50` to `primary-900` (Tailwind purple scale)
- Primary: `#8b5cf6` (purple-500)
- Hover: `#7c3aed` (purple-600)

**Neutral Grey:**
- `neutral-50` to `neutral-900`
- Light backgrounds: `#fafafa`
- Dark text: `#171717`

**Sidebar Colors:**
```js
sidebar: {
  bg: '#fafafa',
  text: '#525252',
  active: '#8b5cf6',
  hover: '#f5f3ff',
}
```

### UI Components (shadcn/ui)
All UI components are based on **Radix UI** primitives with custom Tailwind styling:

- **Button** - Multiple variants (default, outline, ghost, destructive)
- **Input** - Text inputs with validation states
- **Select** - Dropdown select boxes
- **Dialog** - Modal dialogs
- **Card** - Content containers
- **Table** - Data tables
- **Badge** - Status indicators
- **Alert** - Success/error messages
- **Combobox** - Searchable select
- **Popover** - Floating content
- **ConfirmDialog** - Confirmation modals

### Animations & Transitions
- Smooth hover effects on all interactive elements
- Fade-in animations for modals and dialogs
- Transition classes: `transition-colors`, `duration-200`
- Gradient backgrounds: `bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200`

## Key Features & Pages

### 1. Dashboard (/)
**Component:** `DashboardPage` in `App.tsx`

Overview page with metrics and charts (placeholder content):
- Metric cards (Amazon, Walmart, TikTok Shop)
- Market demands chart
- Item suppliers table
- Search and export functionality

### 2. Sources Page (/sources)
**Component:** `SourcesPage.tsx`

Manage database connections:
- **List View:** Grid of connection cards
- **Create/Edit:** Modal form with connection details
- **Test Connection:** Test before saving (shows DB version)
- **Status Indicators:** Green (success), Red (failed), Grey (untested)
- **Supported Types:** MySQL, PostgreSQL

**Connection Fields:**
- Name (unique)
- Database Type (MySQL/PostgreSQL)
- Host
- Port (default: 3306 for MySQL, 5432 for PostgreSQL)
- Database Name
- Username
- Password (encrypted on backend)

**Workflow:**
1. Fill form
2. Test connection (required before save)
3. Save connection (only enabled after successful test)

### 3. Mappings Page (/mappings)
**Component:** `MappingsPage.tsx`

Manage ETL mappings:
- **List View:** Table of all mappings
- **Create Button:** Navigate to `/mappings/new`
- **Edit Button:** Navigate to `/mappings/:id`
- **Delete Button:** Confirm and delete mapping

### 4. New Mapping Page (/mappings/new or /mappings/:id)
**Component:** `NewMappingPage.tsx`

Create or edit ETL mappings:
- **Step 1:** Mapping details (name, description)
- **Step 2:** Select source connection
- **Step 3:** Write/edit SQL query (Monaco Editor)
- **Step 4:** Preview query results
- **Step 5:** Select target schema
- **Navigation:** Save → Column Mapping

**SQL Editor:**
- Monaco Editor component (VS Code editor)
- Syntax highlighting
- Preview button to test query

### 5. Column Mapping Page (/mappings/:id/columns)
**Component:** `ColumnMappingPage.tsx`

Configure column transformations:
- **Left Panel:** Source columns (from SQL query)
- **Right Panel:** Target fields (from schema)
- **Mapping Types:**
  - **Direct:** Drag source column to target field
  - **Split:** Split one source column into multiple targets (delimiter)
  - **Join:** Join multiple source columns into one target (separator)
- **Visual Feedback:** Mapped columns highlighted
- **Save:** Persist column mappings to backend

**Mapping Row Components:**
- `DirectMappingRow.tsx` - 1:1 mapping
- `SplitMappingRow.tsx` - 1:N mapping with delimiter input
- `JoinMappingRow.tsx` - N:1 mapping with separator input

### 6. Schema Page (/schema)
**Component:** `SchemaPage.tsx`

Manage target table schemas:
- **List View:** Table of all schemas
- **Create/Edit:** Form with schema name and column definitions
- **Column Fields:**
  - Name
  - Data Type (string, integer, float, boolean, date, timestamp)
- **Add/Remove Columns:** Dynamic form rows

### 7. Scheduling Page (/mappings/:id/schedule)
**Component:** `SchedulingPage.tsx`

Schedule ETL executions:
- **Cron Expression:** Define schedule timing
- **Enable/Disable:** Toggle schedule active status
- **Last Run:** Display last execution time
- **Next Run:** Display next scheduled time

## API Integration

### API Client (`services/api.ts`)

**Base Configuration:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});
```

**API Modules:**

#### connectionAPI
- `list()` - GET `/connections/`
- `get(id)` - GET `/connections/{id}`
- `create(data)` - POST `/connections/`
- `update(id, data)` - PUT `/connections/{id}`
- `delete(id)` - DELETE `/connections/{id}`
- `test(data)` - POST `/connections/test`
- `testExisting(id)` - POST `/connections/{id}/test`

#### schemaAPI
- `list()` - GET `/schemas/`
- `get(id)` - GET `/schemas/{id}`
- `create(data)` - POST `/schemas/`
- `update(id, data)` - PUT `/schemas/{id}`
- `delete(id)` - DELETE `/schemas/{id}`

#### mappingAPI
- `list()` - GET `/mappings/`
- `get(id)` - GET `/mappings/{id}`
- `create(data)` - POST `/mappings/`
- `update(id, data)` - PUT `/mappings/{id}`
- `delete(id)` - DELETE `/mappings/{id}`
- `listTables(connectionId)` - GET `/mappings/connections/{connectionId}/tables`
- `previewSql(data)` - POST `/mappings/preview`

#### columnMappingAPI
- `create(config)` - POST `/mappings/{mapping_id}/column-mappings`
- `get(mappingId)` - GET `/mappings/{mapping_id}/column-mappings`
- `update(config)` - PUT `/mappings/{mapping_id}/column-mappings`
- `delete(mappingId)` - DELETE `/mappings/{mapping_id}/column-mappings`

#### executionAPI
- `run(mappingId)` - POST `/mappings/{mappingId}/run`

### Custom Hooks

**useConnections.ts:**
- Manages connection state
- Provides CRUD operations
- Handles test connection logic

**useMappings.ts:**
- Manages mapping state
- Provides CRUD operations
- Handles SQL preview

**useSchemas.ts:**
- Manages schema state
- Provides CRUD operations

**useTables.ts:**
- Fetches table list from connection
- Used in SQL query builder

## TypeScript Types

### Connection Types (`types/connection.ts`)
```typescript
export type DatabaseType = 'mysql' | 'postgresql';

export interface Connection {
  _id: string;
  name: string;
  db_type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;  // Encrypted on backend
  created_at: string;
  updated_at: string;
  last_tested_at?: string;
  last_test_status?: 'success' | 'failed';
}

export interface ConnectionFormData {
  name: string;
  db_type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: {
    db_type?: string;
    version?: string;
    error_type?: string;
    traceback?: string;
  };
}
```

### Mapping Types (`types/mapping.ts`)
```typescript
export interface Mapping {
  _id: string;
  name: string;
  description?: string;
  source_connection_id: string;
  source_query: string;
  target_schema_id: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnMappingConfiguration {
  _id: string;
  mapping_id: string;
  mappings: Array<DirectMapping | SplitMapping | JoinMapping>;
  created_at: string;
  updated_at: string;
}

export interface DirectMapping {
  type: 'direct';
  source_column: string;
  target_field: string;
}

export interface SplitMapping {
  type: 'split';
  source_column: string;
  target_fields: string[];
  delimiter: string;
}

export interface JoinMapping {
  type: 'join';
  source_columns: string[];
  target_field: string;
  separator: string;
}
```

### Schema Types (`types/schema.ts`)
```typescript
export interface TableSchema {
  _id: string;
  name: string;
  description?: string;
  columns: SchemaColumn[];
  created_at: string;
  updated_at: string;
}

export interface SchemaColumn {
  name: string;
  data_type: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'timestamp';
}
```

## Routing

**React Router DOM v7** handles client-side routing:

```tsx
<Routes>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/sources" element={<SourcesPage />} />
  <Route path="/mappings" element={<MappingsPage />} />
  <Route path="/mappings/new" element={<NewMappingPage />} />
  <Route path="/mappings/:mappingId" element={<NewMappingPage />} />
  <Route path="/mappings/:mappingId/columns" element={<ColumnMappingPage />} />
  <Route path="/mappings/:mappingId/schedule" element={<SchedulingPage />} />
  <Route path="/schema" element={<SchemaPage />} />
</Routes>
```

**Navigation:**
- Sidebar links use `react-router-dom` `Link` component
- Programmatic navigation with `useNavigate()` hook
- URL parameters with `useParams()` hook

## Form Management

**React Hook Form + Zod** for form state and validation:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  // ...
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

**Validation:**
- Client-side validation with Zod schemas
- Real-time error messages
- Disabled submit until valid

## Running the Frontend

### Development Mode
```bash
cd frontend
npm install
npm run dev
```
Access at: http://localhost:5173

### Build for Production
```bash
npm run build
```
Output in `dist/` directory

### Preview Production Build
```bash
npm run preview
```

### Docker (via docker-compose from root)
```bash
docker-compose up frontend
```

## Common Development Tasks

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add sidebar link in `Sidebar.tsx`
4. Create types in `src/types/` if needed
5. Create API functions in `src/services/api.ts`
6. Create custom hook in `src/hooks/` if needed

### Adding a New UI Component
1. Use shadcn/ui CLI: `npx shadcn-ui@latest add <component-name>`
2. Component added to `src/components/ui/`
3. Customize styling in component file

### Adding a New API Endpoint
1. Define TypeScript types in `src/types/`
2. Add API function to appropriate module in `src/services/api.ts`
3. Use in component with `useEffect` or custom hook

### Updating Theme Colors
Edit `tailwind.config.js` to change color palette:
```js
colors: {
  primary: { /* ... */ },
  neutral: { /* ... */ }
}
```

## Integration with Backend

**Backend API:** http://localhost:8000/api/v1
**Frontend:** http://localhost:5173

**CORS:**
Backend configured to allow requests from frontend origin.

**Authentication:**
Currently no authentication (POC phase).

**Error Handling:**
- Axios interceptors could be added for global error handling
- Currently errors handled per-request with try/catch

## Browser Support

- **Chrome** - Full support
- **Firefox** - Full support
- **Safari** - Full support
- **Edge** - Full support
- **Mobile** - Responsive design (desktop-first)

## Performance Considerations

### Vite Fast Refresh
- Hot Module Replacement (HMR) for instant updates
- Fast build times with Vite

### Code Splitting
- React Router lazy loading possible for large apps
- Currently not implemented (app size is small)

### State Management
- Local component state with `useState`
- Custom hooks for data fetching
- No global state library (Redux/Zustand) needed yet

## Known Limitations

- No authentication/authorization
- No user management
- No pagination (assumes small datasets)
- No real-time updates (requires manual refresh)
- No offline support
- No data caching (refetches on every mount)
- Desktop-first design (mobile experience not optimized)

## Future Enhancements

- Add authentication (JWT tokens)
- Implement role-based access control
- Add pagination for large lists
- Real-time updates with WebSockets
- Execution history view
- Data quality dashboard
- Advanced SQL editor features (autocomplete, formatting)
- Dark mode toggle
- Internationalization (i18n)
- Unit tests (React Testing Library)
- E2E tests (Playwright/Cypress)

## Troubleshooting

### Common Issues

**CORS Errors:**
- Verify backend CORS_ORIGINS includes frontend URL
- Check `VITE_API_BASE_URL` in `.env.local`

**API Not Found:**
- Ensure backend service is running on port 8000
- Check `.env.local` has correct `VITE_API_BASE_URL`

**Styling Not Applied:**
- Verify Tailwind config includes all source paths
- Check `index.css` imports Tailwind directives
- Clear cache and restart dev server

**Monaco Editor Not Loading:**
- Check `@monaco-editor/react` is installed
- Verify component import path

**Form Validation Not Working:**
- Check Zod schema is correctly defined
- Verify `zodResolver` is passed to `useForm`
- Check error messages are being displayed

## Development Workflow

1. **Start backend:** `cd backend && uvicorn app.main:app --reload`
2. **Start frontend:** `cd frontend && npm run dev`
3. **Make changes:** Edit files, Vite hot-reloads automatically
4. **Test in browser:** http://localhost:5173
5. **API docs:** http://localhost:8000/docs

## Code Style

- **TypeScript:** Strict mode enabled
- **Components:** Functional components with hooks
- **Styling:** Tailwind utility classes
- **File naming:** PascalCase for components, camelCase for utils
- **Exports:** Named exports preferred

## Useful Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Add shadcn/ui component
npx shadcn-ui@latest add <component-name>
```
