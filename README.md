# Brik Backend API

A minimal field service management system backend covering the complete workflow from lead to payment.

## Stack Choice

- **Node.js + Express + TypeScript** - Lightweight web framework with type safety
- **Prisma ORM** - Type-safe database access with automatic migrations
- **SQLite** - File-based database, no external setup required
- **Zod** - Runtime validation and type inference
- **Jest + Supertest** - Testing framework for unit and integration tests
- **date-fns** - Date manipulation utilities

### Tradeoffs & Rationale

**SQLite**
- ✅ Zero configuration, file-based, perfect for development and demos
- ✅ Full SQL support with ACID compliance
- ❌ Not suitable for production with high concurrency
- Would migrate to PostgreSQL for production

**Prisma ORM**
- ✅ Type-safe queries, auto-generated client
- ✅ Intuitive migrations and schema management
- ❌ Less control over raw SQL compared to query builders
- Chose for developer experience and rapid development

**Express**
- ✅ Minimal, flexible, widely adopted
- ✅ Large ecosystem of middleware
- ❌ Requires more setup than opinionated frameworks
- Chose for simplicity and familiarity

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### Environment Variable
Create a .env file and add the following:

- `DATABASE_URL="file:./prisma/dev.db"`
- `PORT=3001`
- `NODE_ENV=development`

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npm run db:migrate
```

## Run Instructions

### Development Mode

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Seed Script

```bash
npm run db:seed
```

**Seed data includes:**
- 3 Customers: John Smith, Sarah Johnson, Mike Williams
- 1 Technician: Taylor
- 3 Jobs:
  - HVAC Repair (New)
  - Plumbing Installation (New)
  - Electrical Inspection (Scheduled with Taylor, tomorrow 10:00-12:00)

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# View test coverage (if configured)
npm run test:coverage
```

## Key Design Decisions & Tradeoffs

### Data Model
- **Normalized schema**: Separate tables for Customers, Technicians, Jobs, Appointments, Invoices, LineItems, Payments, and JobActivity
- **Time windows**: Stored as DateTime; overlap detection via SQL/application logic
- **Invoice line items**: Normalized as separate table (LineItem) for queryability
- **Job activities**: Audit trail stored in JobActivity table
- **Status transitions**: Enforced at application layer with validation
- **Cascading deletes**: Configured at database level via Prisma relations

### API Design
- RESTful resources with standard HTTP methods
- Nested endpoints for relationships (e.g., `/jobs/:id/appointments`, `/jobs/:id/invoice`)
- HTTP status codes:
  - `201` Created - with resource location
  - `400` Bad Request - validation errors
  - `404` Not Found - resource doesn't exist
  - `409` Conflict - business rule violations (overlaps, invalid transitions)
- Request validation using Zod schemas
- Consistent error response format

### State Management
- Jobs workflow: `New` → `Scheduled` → `Done` → `Invoiced` → `Paid`
- Business rules:
  - Appointments can only be created for New/Scheduled jobs
  - Jobs must be Scheduled before marking Done
  - Jobs must be Done before creating invoice
  - Job auto-transitions to Paid when invoice balance reaches 0
- All state changes tracked in JobActivity table

### Validation Strategy
- Zod schemas for runtime request validation and type inference
- Prisma schema constraints for data integrity (@unique, onDelete)
- Business logic validation in service/controller layer
- Transactions for atomic operations (invoice creation with line items)

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
- Business logic validation
- Data transformation utilities
- Service layer methods

**Integration Tests:**
- Complete Lead-to-Paid flow (end-to-end)
- API endpoint behavior
- Database operations with transactions
- Error handling and edge cases

## Project Structure

```
brik-backend/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.ts             # Seed data script
├── src/
│   ├── controllers/        # HTTP request handlers
│   ├── services/           # Business logic layer
│   ├── middlewares/        # Express middleware (validation, error handling)
│   ├── validators/         # Zod validation schemas
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── index.ts            # Application entry point
│   └── app.ts              # Express app configuration
├── tests/                  # Test files (unit & integration)
├── .env                    # Environment variables
├── .env.example            # Example environment config
└── prisma.db              # SQLite database file (generated)
```