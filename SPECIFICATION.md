# ETL Engine - Phase 1 Specification
## Source Connection Manager

---

## Project Overview

Building the first phase of an ETL (Extract, Transform, Load) system focused on managing source database connections. This is a **Proof of Concept (POC)** for a management pitch, requiring an impressive, modern UI design.

---

## Architecture

### Technology Stack

**Backend:**
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (for storing connection configurations)
- **ORM/Driver:** PyMongo (MongoDB interaction)
- **Database Testing:** SQLAlchemy Core (for MySQL/PostgreSQL connection testing)
- **Security:** Cryptography library (Fernet encryption for passwords)

**Frontend:**
- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **HTTP Client:** Axios
- **Form Management:** React Hook Form + Zod validation

**Infrastructure:**
- **Monorepo:** Single repository with `backend/` and `frontend/` folders
- **API Style:** REST
- **Authentication:** None (POC phase)
- **Deployment:** Docker Compose (optional for development)

---

## Design Requirements

### UI/UX Specifications

**Color Scheme: Purple & Grey**
- Primary Purple: `#9333ea` (purple-600)
- Dark Purple: `#7e22ce` to `#581c87` (gradient for sidebar)
- Light Purple: `#a855f7`, `#c084fc` (accents, hover states)
- Grey Scale: `#171717` to `#fafafa` (neutral colors)

**Design Goals:**
- Modern, impressive design suitable for management presentation
- Professional and polished appearance
- Smooth animations and transitions
- Clear visual hierarchy
- Responsive layout

**Key UI Elements:**
1. **Dark purple gradient sidebar** (left side navigation)
2. **Connection cards** with hover effects and status indicators
3. **Professional form** with purple accents and clear validation
4. **Status indicators:** Green checkmarks (success), Red X (failed), Grey dot (untested)
5. **Empty states** with meaningful messaging
6. **Loading states** with elegant spinners

---

## Functional Requirements

### 1. Source Connection Manager

**Location:** Single item in left sidebar navigation

**Supported Database Types:**
- MySQL
- PostgreSQL

**CRUD Operations:**

#### Create Connection
- Form with the following fields:
  - **Connection Name** (text, required, unique)
  - **Database Type** (dropdown: MySQL or PostgreSQL)
  - **Host** (text, required)
  - **Port** (number, required, default: 3306 for MySQL, 5432 for PostgreSQL)
  - **Database Name** (text, required)
  - **Username** (text, required)
  - **Password** (password field, required)

#### Test Connection
- **Test button** in the form
- Must test connection **before** allowing save
- Uses SQLAlchemy to verify connection
- Shows results:
  - **Success:** Display database version info with green checkmark
  - **Failure:** Display error message with red X icon
- 5-second timeout for connection attempts
- Save button is **disabled** until test succeeds

#### Save Connection
- Only enabled after successful test
- Encrypts password before storing in MongoDB
- Stores connection metadata with timestamps

#### Read/List Connections
- Display all connections as cards in a grid layout
- Each card shows:
  - Connection name
  - Database type (badge: purple for MySQL, grey for PostgreSQL)
  - Host:Port
  - Database name
  - Username
  - Last test status (icon indicator)
  - Last tested timestamp
  - Edit and Delete buttons

#### Update Connection
- Edit button opens form with existing values
- Must re-test connection if credentials change
- Same validation as create

#### Delete Connection
- Delete button with confirmation dialog
- Removes connection from MongoDB

---

## Data Model

### MongoDB Collection: `connections`

```javascript
{
  _id: ObjectId,                        // Auto-generated
  name: String,                         // Unique, required
  db_type: "mysql" | "postgresql",      // Required
  host: String,                         // Required
  port: Number,                         // Required (1-65535)
  database: String,                     // Required
  username: String,                     // Required
  password: String,                     // Encrypted, required
  created_at: ISODate,                  // Auto-generated
  updated_at: ISODate,                  // Auto-updated
  last_tested_at: ISODate | null,       // Set when connection tested
  last_test_status: "success" | "failed" | null  // Test result
}
```

**Indexes:**
- `name` (unique)
- `db_type` (for filtering)
- `updated_at` (for sorting, descending)

---

## API Specification

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

#### 1. Create Connection
```
POST /connections/
Content-Type: application/json

Request Body:
{
  "name": "Production MySQL",
  "db_type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "username": "admin",
  "password": "secret123"
}

Response: 201 Created
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Production MySQL",
  "db_type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "username": "admin",
  "password": "encrypted_value",
  "created_at": "2025-12-08T10:00:00Z",
  "updated_at": "2025-12-08T10:00:00Z",
  "last_tested_at": null,
  "last_test_status": null
}
```

#### 2. List Connections
```
GET /connections/

Response: 200 OK
[
  { ...connection object... },
  { ...connection object... }
]
```

#### 3. Get Single Connection
```
GET /connections/{connection_id}

Response: 200 OK
{ ...connection object... }
```

#### 4. Update Connection
```
PUT /connections/{connection_id}
Content-Type: application/json

Request Body:
{
  "host": "new-host.com",
  "port": 3307
}

Response: 200 OK
{ ...updated connection object... }
```

#### 5. Delete Connection
```
DELETE /connections/{connection_id}

Response: 204 No Content
```

#### 6. Test New Connection
```
POST /connections/test
Content-Type: application/json

Request Body:
{
  "name": "Test Connection",
  "db_type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "testdb",
  "username": "user",
  "password": "pass123"
}

Response: 200 OK
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "db_type": "postgresql",
    "version": "PostgreSQL 15.3 on x86_64-pc-linux-gnu"
  }
}
```

#### 7. Test Existing Connection
```
POST /connections/{connection_id}/test

Response: 200 OK
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "db_type": "mysql",
    "version": "8.0.35"
  }
}
```

---

## Security Considerations

### Password Encryption
- **Algorithm:** Fernet (symmetric encryption from cryptography library)
- **Key Storage:** Environment variable (`ENCRYPTION_KEY`)
- **Key Generation:** `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
- **Process:**
  1. Encrypt password before storing in MongoDB
  2. Decrypt only when testing connection
  3. Never return decrypted password in API responses

### Validation
- All inputs validated with Pydantic schemas
- Port range: 1-65535
- Required fields enforced
- SQL injection prevented by SQLAlchemy parameterized queries

### CORS
- Restricted to frontend origin (http://localhost:5173)
- Configurable via environment variables

---

## Project Structure

```
etl-engine-3/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI app entry point
│   │   ├── config.py                    # Settings and configuration
│   │   ├── database.py                  # MongoDB connection
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── connection.py            # Pydantic models
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── connection_service.py    # CRUD business logic
│   │   │   └── test_connection_service.py # Connection testing
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── connections.py           # API endpoints
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── encryption.py            # Password encryption
│   │       └── exceptions.py            # Custom exceptions
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env                             # (gitignored)
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                      # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   └── badge.tsx
│   │   │   ├── layout/
│   │   │   │   └── Sidebar.tsx          # Left navigation
│   │   │   └── connections/
│   │   │       ├── ConnectionForm.tsx   # Create/Edit form
│   │   │       └── ConnectionList.tsx   # Card grid
│   │   ├── services/
│   │   │   └── api.ts                   # Axios API client
│   │   ├── hooks/
│   │   │   └── useConnections.ts        # State management hook
│   │   ├── types/
│   │   │   └── connection.ts            # TypeScript interfaces
│   │   ├── lib/
│   │   │   └── utils.ts                 # Utility functions
│   │   ├── App.tsx                      # Main application
│   │   ├── main.tsx                     # React entry point
│   │   └── index.css                    # Global styles
│   ├── public/
│   ├── .env.local                       # (gitignored)
│   ├── .env.example
│   ├── components.json                  # shadcn config
│   ├── tailwind.config.js               # Tailwind + purple/grey theme
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── SPECIFICATION.md                     # This file
```

---

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- MongoDB 7.0+ (or Docker)
- Git

### Environment Variables

**Backend (.env):**
```bash
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=etl_engine
ENCRYPTION_KEY=your-fernet-key-here
API_V1_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:5173"]
```

**Frontend (.env.local):**
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Running Locally

**1. Start MongoDB:**
```bash
docker run -d -p 27017:27017 --name etl-mongodb mongo:7.0
```

**2. Start Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**3. Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend UI: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Running with Docker

```bash
docker-compose up --build
```

---

## User Flow

### Creating a New Connection

1. User clicks "New Connection" button (purple, with icon)
2. Dialog/modal opens with connection form
3. User fills in:
   - Connection name
   - Selects database type (MySQL/PostgreSQL)
   - Enters host, port, database, username, password
4. User clicks "Test Connection" button
   - Button shows loading spinner
   - API makes connection attempt (5 second timeout)
   - Success: Green alert with database version info
   - Failure: Red alert with error message
5. If test successful, "Save" button becomes enabled
6. User clicks "Save"
   - Password is encrypted
   - Connection saved to MongoDB
   - Dialog closes
   - Connection appears in card grid

### Editing a Connection

1. User clicks "Edit" button on connection card
2. Form opens pre-filled with existing values
3. User modifies fields
4. User must re-test connection
5. Save (same as create)

### Deleting a Connection

1. User clicks "Delete" button on connection card
2. Confirmation dialog appears
3. User confirms
4. Connection removed from MongoDB
5. Card disappears from grid

---

## Non-Functional Requirements

### Performance
- API response time: < 200ms (excluding connection tests)
- Connection test timeout: 5 seconds
- Frontend initial load: < 2 seconds

### Scalability
- Support for 100+ connections in UI (pagination not required for Phase 1)
- MongoDB can handle thousands of connection documents

### Usability
- Intuitive UI requiring no training
- Clear error messages
- Visual feedback for all actions
- Keyboard-friendly form navigation

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design (desktop-first for management demo)

---

## Future Enhancements (Phase 2+)

### Additional Database Types
- Oracle
- SQL Server
- Amazon Redshift
- Snowflake
- Google BigQuery
- NoSQL databases (Cassandra, etc.)

### ETL Pipeline Features
- Source to destination mapping
- Transformation rules
- Scheduling
- Monitoring and logging
- Error handling and retry logic

### User Management
- Authentication and authorization
- Role-based access control
- Audit logging
- Team collaboration features

### Advanced Connection Features
- SSH tunneling
- SSL/TLS certificates
- Connection pooling
- Health monitoring
- Automated connection testing
- Connection groups/folders
- Bulk import/export

---

## Success Criteria

### Phase 1 Completion
- [ ] Backend API fully functional with all 7 endpoints
- [ ] MongoDB storing encrypted connections
- [ ] Frontend with impressive purple/grey design
- [ ] Connection test working for MySQL and PostgreSQL
- [ ] Full CRUD operations working
- [ ] Form validation and error handling
- [ ] Animations and transitions polished
- [ ] No console errors
- [ ] Ready for management demonstration

### Management Pitch Demo
- [ ] Create connection with test
- [ ] Show successful connection with version info
- [ ] Show failed connection with error handling
- [ ] Edit and update connection
- [ ] Delete connection
- [ ] Highlight impressive UI design
- [ ] Demonstrate responsive behavior
- [ ] Show empty state
- [ ] Show loading states

---

## Risks and Mitigations

### Risk: Connection test failures
**Mitigation:** Clear error messages, timeout handling, detailed logging

### Risk: Password security
**Mitigation:** Fernet encryption, environment-based keys, never expose in API

### Risk: UI not impressive enough
**Mitigation:** Purple/grey theme, smooth animations, professional design system

### Risk: Time constraints
**Mitigation:** Focus on core features first, polish iteratively

---

## Timeline Estimate

- **Backend Core:** 45 minutes
- **Backend Data Layer:** 60 minutes
- **Backend API:** 30 minutes
- **Frontend Setup:** 45 minutes
- **Frontend State:** 30 minutes
- **Frontend UI:** 2-3 hours
- **Integration & Testing:** 1 hour

**Total:** 5-7 hours

---

## Glossary

- **ETL:** Extract, Transform, Load - data integration process
- **Source Connection:** Database connection for extracting data
- **Fernet:** Symmetric encryption algorithm
- **shadcn/ui:** React component library built on Radix UI
- **Pydantic:** Python data validation library
- **SQLAlchemy:** Python SQL toolkit and ORM

---

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Status:** Ready for Implementation
