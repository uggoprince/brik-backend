# Brik Lead-to-Paid CRM

A minimal field service management system covering the complete workflow from lead to payment.

## Stack Choice

**Backend:**
- Node.js + Express + TypeScript
- SQLite with better-sqlite3 (synchronous, simpler than async)
- Jest + Supertest for testing

**Frontend:**
- React 18 + TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Date handling with date-fns

**Rationale:**
- SQLite: Perfect for take-home - no external DB setup, file-based, full SQL support
- TypeScript: Type safety catches errors early, better DX
- Express: Lightweight, widely known, quick to set up RESTful APIs
- React: Component-based UI, easy state management for this scope

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies for both backend and frontend
npm run install:all

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### Running the Application

```bash
# Run both backend and frontend concurrently (recommended)
npm run dev

# Or run separately:
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm start
```

### Seed Data

```bash
cd backend
npm run seed
```

Seeds:
- 3 customers (Alice Johnson, Bob Smith, Carol Davis)
- 1 technician (Taylor)
- 2 jobs in "New" status
- 1 job in "Scheduled" status (Taylor, 10:00-12:00)

### Testing

```bash
# Run all backend tests
cd backend && npm test

# Run with coverage
npm run test:coverage

# Frontend tests (if implemented)
cd frontend && npm test
```

## Key Design Decisions & Tradeoffs

### Data Model
- **Single technician table**: Could be extended to a "User" table with roles
- **Time windows**: Stored as ISO strings; simple overlap detection with string comparison
- **Invoice line items**: Stored as JSON array; would normalize in production for querying
- **Status transitions**: Enforced at application layer; could add DB constraints

### API Design
- RESTful resources with standard HTTP methods
- Nested endpoints for relationships (e.g., `/jobs/:id/appointments`)
- 409 Conflict for business rule violations (overlaps, invalid transitions)
- 422 Unprocessable Entity for validation errors
- All successful creates return 201 with Location header

### State Management
- Jobs move through states: New → Scheduled → Done → Invoiced → Paid
- Appointments can only be created for New/Scheduled jobs
- Jobs must be Scheduled before marking Done
- Jobs must be Done before creating invoice
- Job auto-transitions to Paid when invoice balance reaches 0

### Validation Strategy
- Joi schemas for request validation
- Database constraints for data integrity
- Business logic validation in service layer
- Atomic operations using transactions

### What I'd Add with More Time
- **Authentication & Authorization**: Multi-tenant with RBAC
- **Audit Log**: Track who changed what and when
- **Soft Deletes**: Keep historical data
- **Pagination**: For job/customer lists
- **Search**: Full-text search on customers/jobs
- **Notifications**: Email/SMS for appointments
- **File Uploads**: Photos, signatures, documents
- **Calendar Integration**: Sync with Google Calendar
- **Optimistic UI Updates**: Better perceived performance
- **WebSocket**: Real-time updates for dispatch board
- **Advanced Scheduling**: Recurring jobs, travel time, territories
- **Reporting**: Revenue, technician utilization, etc.

## API Endpoints

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `GET /api/customers` - List customers (with search)

### Jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs` - List jobs (filter by status)
- `GET /api/jobs/:id` - Get job with full details
- `PATCH /api/jobs/:id/status` - Update job status

### Appointments
- `POST /api/jobs/:id/appointments` - Schedule technician

### Invoices
- `POST /api/jobs/:id/invoice` - Generate invoice
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices/:id/payments` - Record payment

### Technicians
- `GET /api/technicians` - List technicians

## Testing Coverage

**Unit Tests:**
- Invoice calculation (subtotal, tax, total)
- Payment balance updates
- Appointment overlap detection

**Integration Tests:**
- Complete Lead-to-Paid flow
- Appointment conflict handling (409 response)
- Status transition validations

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic
│   ├── models/          # Database access layer
│   ├── middleware/      # Express middleware
│   ├── validators/      # Request validation schemas
│   ├── database.ts      # DB connection & migrations
│   ├── seed.ts         # Seed data script
│   └── server.ts       # Express app setup
├── tests/              # Test files
└── database.sqlite     # SQLite database file

frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page-level components
│   ├── services/      # API client
│   ├── types/         # TypeScript types
│   └── App.tsx        # Main app component
└── public/

```