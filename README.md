# WhirlDispatch Backend

Enterprise HVAC Field Service Mobile Operations API powering the WhirlDispatch iOS application ecosystem for field technicians, supervisors, and payment clerks.

## Architecture & Technology Stack

- Runtime: Node.js with Express.js (pure ECMAScript Modules)
- Language: TypeScript (strict mode, bundler resolution)
- Database: NeonDB Serverless PostgreSQL
- ORM: Drizzle ORM
- Validation: Zod
- Authentication: JWT with bcrypt password hashing and LocalAuthentication biometric support
- Testing: Vitest & Supertest
- Deployment: Vercel Serverless Functions

## API Modules

- Authentication & RBAC: Provisioning, JWT verification, Face ID/Touch ID verification
- Facilities & Fleet: Commercial buildings with geofence perimeters, service vehicles
- Work Orders: Dynamic dispatch, assignment, status state machine, EventKit calendar payload
- Attendance & Geofencing: Haversine distance verification, tamper-resistant audit logs, boundary breach logger
- Diagnostic Dossiers: HVAC baseline and post-service sensor metrics (PSI, amps, coil temp differentials), inspection checklists, geotagged proof photos
- Expense Ledger: Emergency parts expense submissions, automated threshold detection (25,000 LKR), supervisor optical inspection approval
- Billing & Invoicing: Automated cost estimation, labor hours calculation, parts markup, Swift Charts telemetry
- Notifications & WidgetKit: Push notification queues, lock screen shift telemetry feed
- OpenAPI Documentation: Interactive Swagger UI served at `/api/docs`

## Environment Configuration

Configure the following variables in `.env`:

```env
PORT=3000
NODE_ENV=production
DATABASE_URL="postgresql://neondb_owner:...-pooler.../neondb?sslmode=require&channel_binding=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:.../neondb?sslmode=require&channel_binding=require"
JWT_SECRET="whirldispatch_hvac_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
```

## Available Scripts

- `npm run dev`: Launch local development server with tsx hot reload
- `npm run build`: Compile TypeScript into distribution build (`tsc`)
- `npm start`: Execute production build (`node dist/server.js`)
- `npm test`: Run full Vitest integration test suite
- `npm run db:generate`: Generate Drizzle SQL migrations
- `npm run db:migrate`: Execute database migrations against NeonDB
- `npm run db:seed`: Seed realistic HVAC domain fixtures
