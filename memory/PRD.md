# POSQ - WhatsApp POS System

## Original Problem Statement
Aplikasi POS (Point of Sale) berbasis web dengan frontend React/TypeScript dan backend PHP WordPress. User ingin semua error diperbaiki, semua menu dan sub-menu berjalan tanpa error, dan aplikasi siap production.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI + TanStack Query
- **Backend**: PHP WordPress Plugin (remote: `https://erpos.tekrabyte.id/wp-json/posq/v1`)
- **Database**: WordPress MySQL (remote, managed by PHP backend)

## Project Structure
```
/app/
├── frontend/           # Thin wrapper for Emergent supervisor
├── backend/            # Minimal FastAPI health endpoint
├── src/                # Main React source code
│   ├── components/
│   │   ├── admin/      # Admin pages (Dashboard, POS, Kiosk, etc.)
│   │   │   ├── hooks/  # Admin-specific hooks (unused duplicate)
│   │   │   └── kiosk/  # Kiosk sub-pages (not actively routed)
│   │   └── ui/         # Shadcn UI components
│   ├── hooks/
│   │   └── useQueries.ts   # Central React Query hooks
│   ├── services/
│   │   └── api.ts          # API client
│   ├── lib/
│   │   ├── utils.ts        # Utility functions
│   │   └── packageStockCalculator.ts
│   └── types/
│       └── types.ts        # TypeScript type definitions
├── vite.config.ts
└── package.json
```

## Admin Pages (all routed via state in App.tsx)
1. Dashboard - `DashboardPage`
2. POS - `POSPage`
3. Kiosk - `KioskPage`
4. Tables - `TableManagementPage`
5. Outlets - `OutletsManagementPage`
6. Staff - `StaffManagementPage`
7. Customers - `CustomerManagementPage`
8. Products - `ProductManagementPage`
9. Inventory - `InventoryManagement`
10. Category & Brand - `CategoryBrandPage`
11. Reports - `ReportsPage`
12. Cashflow - `CashflowPage`
13. Payments - `PaymentSettingsPage`
14. Promo - `PromoManagementPage`
15. Settings - `SettingsPage`

## What's Been Implemented (March 2026)

### Bug Fixes Completed
- [x] **P0**: Fixed missing hook exports for `useCreateStandalonePromo`, `useListStandalonePromos`, etc. (were already present, import paths were wrong)
- [x] **P1**: Refactored ALL `BigInt`/`bigint`/`0n` usage to `number` across:
  - `types/types.ts` (stock property)
  - `KioskPage.tsx` (stock comparisons, formatCurrency)
  - `POSPage.tsx` (addToCart, cart items, stock comparisons)
  - `KioskHomePage.tsx` (stock comparisons)
  - `KioskOrdersPage.tsx` (formatCurrency, formatDate types)
  - `CustomerManagementPage.tsx` (formatDate, formatCurrency, handleStatusChange types, tuple→object fix)
  - `ProductManagementPage.tsx` (formatCurrency type)
- [x] **P1**: Fixed wrong import paths:
  - `../../backend` → `../../types/types` (KioskOrdersPage)
  - `../../types` → `../../types/types` (CategoryBrandPage)
  - `../types` → `../types/types` (11 component files)
  - Removed `@tanstack/react-router` imports (not installed) from 4 kiosk sub-pages
- [x] **P1**: Fixed Vite `allowedHosts` configuration for preview domain
- [x] **P1**: Set up Emergent platform structure (frontend/backend directories)
- [x] Fixed `useInternetIdentity` `clear` → `logout` mapping in KioskProfilePage
- [x] Fixed CustomerManagementPage tuple destructuring → flat object iteration
- [x] Fixed `updateStatus.mutate` parameter naming

### Testing Results
- Vite production build: PASSED
- ESLint: PASSED on all admin components
- Login page render: NO console errors
- All imports verified: NO missing exports

## Remaining/Upcoming Tasks
- [ ] **P1**: Full integration testing with WordPress credentials (verify all 15 admin pages load and function)
- [ ] **P1**: Improve "nota" (receipt) feature in Cash Flow menu
- [ ] **P1**: Improve POS interface and functionality
- [ ] **P2**: Address pre-existing TypeScript type errors (CashflowPage transaction types, Avatar component props)
- [ ] **P2**: Clean up unused `src/components/admin/hooks/useQueries.ts` (duplicate)
- [ ] **P2**: General production readiness review
