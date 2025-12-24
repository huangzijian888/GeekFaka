# GeekFaka Project Context

## Project Overview
GeekFaka is a digital goods sales system (automatic card issuance system) designed for independent developers and creators. It handles product display, ordering, payment integration (EPay, Alipay, WeChat), and automatic delivery of digital goods (licenses/keys).

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Shadcn UI (Radix UI primitives)
- **Database:** Prisma ORM (SQLite for dev, MySQL/PostgreSQL for production)
- **State Management:** React Hooks, Server State (via Next.js)
- **Deployment:** Docker, Docker Compose

## Key Directories & Structure

### `app/` (Next.js App Router)
- **`api/`**: Backend API routes.
    - `admin/`: Admin-related endpoints (products, settings, auth).
    - `config/`: System configuration endpoints.
    - `orders/`: Order creation and checking.
    - `payments/`: Payment callbacks and handling.
- **`admin/`**: Admin dashboard pages.
    - `(dashboard)/`: Protected admin routes (Orders, Products, Categories, Settings).
    - `login/`: Admin login page.
- **`orders/`**: Public order tracking pages.
- **`page.tsx`**: Public storefront homepage.

### `components/`
- **`ui/`**: Reusable UI components (Buttons, Inputs, Dialogs, etc.), likely based on Shadcn UI.
- **`admin/`**: Admin-specific components (e.g., StockManager).
- **`navbar.tsx`, `store-front.tsx`**: Main layout components.

### `lib/`
- **`prisma.ts`**: Prisma client instance.
- **`auth.ts`**: Authentication utilities.
- **`payments/`**: Payment gateway integrations (currently EPay).
- **`utils.ts`**: General helper functions (likely `cn` for Tailwind).

### `prisma/`
- **`schema.prisma`**: Database schema definition.
- **`seed.ts`**: Database seeding script.

## Core Database Models
- **Product**: Items for sale.
- **Category**: Product categorization.
- **License**: The actual digital good (code/key) to be delivered.
- **Order**: Customer transactions.
- **SystemSetting**: Dynamic configuration (payment keys, site title).
- **User**: Admin users.

## Development Workflow

### 1. Setup
```bash
npm install
# or
yarn install
```

### 2. Environment Variables
Copy `.env.example` to `.env` (if not present, refer to `README.md` for keys).
Key variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_URL`.

### 3. Database
The project uses Prisma.
```bash
# Run migrations (dev)
npx prisma migrate dev

# Open database GUI
npx prisma studio
```

### 4. Running
```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

## Conventions
- **Styling**: Use Tailwind CSS utility classes. Avoid custom CSS files where possible.
- **UI Components**: Use the components in `components/ui/` which wrap Radix UI primitives.
- **API**: Use Next.js Route Handlers (`route.ts`) in `app/api/`. Return standard JSON responses.
- **Type Safety**: Strictly use TypeScript interfaces/types, especially for API responses and Props.
- **Database**: Access the DB via the global `prisma` client imported from `@/lib/prisma`.
