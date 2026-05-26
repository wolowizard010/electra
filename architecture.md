# Electra: Enterprise Full-Stack Web Application Architecture Blueprint

This blueprint describes the complete system design and implementation plan for **Electra**, an enterprise-grade full-stack e-commerce and logistics platform for a private electronics shipping company. 

The architecture is built upon the principles of **Clean Architecture** and **Domain-Driven Design (DDD)** using a modular monorepo structure. This guarantees that modules are encapsulated, boundaries are enforced, and developer teams can implement or modify components in complete isolation without systemic regression risks.

---

## 1. Architectural Overview & System Flow

Electra utilizes a **Hexagonal (Ports & Adapters) Architecture** model to isolate core business rules from external frameworks, databases, and third-party logistics (3PL) APIs.

### System Architecture Diagram
```mermaid
graph TD
    %% User Types
    Customer[Customer / Web Browser]
    Admin[Admin / Ops Dashboard]
    Warehouse[Warehouse Operator]

    %% Frontend Gateways
    subgraph Client Layer
        WebClient[Next.js App Router SPA / SSR]
    end

    %% Application Framework API
    subgraph API & Routing Layer
        API[Next.js Route Handlers / REST API]
    end

    %% Core Services / Packages (Bounded Contexts)
    subgraph Core Business Domains (Monorepo Packages)
        AuthModule[packages/auth: RBAC & Sessions]
        CatalogModule[packages/catalog: Catalog & Search]
        OrderModule[packages/orders: Order State Machine]
        InventoryModule[packages/inventory: Warehouse & Stock Allocator]
        PaymentModule[packages/payments: Gateway Adapters]
        ShippingModule[packages/shipping: 3PL Courier Adapters]
        NotifyModule[packages/notifications: Event-driven Messaging]
    end

    %% Data and External Infrastructures
    subgraph Infrastructure Layer
        DB[(PostgreSQL Database / Prisma ORM)]
        Cache[(Redis Cache & Queue)]
        Stripe[Stripe SDK]
        EasyPost[EasyPost API: FedEx / UPS / DHL]
        Resend[Resend / Twilio API]
    end

    %% User Interaction Flows
    Customer -->|Browse / Purchase| WebClient
    Admin -->|Manage Catalog / Analytics| WebClient
    Warehouse -->|Pack / Ship| WebClient

    WebClient -->|HTTPS / JSON| API
    
    %% API to Internal Modules
    API --> AuthModule
    API --> CatalogModule
    API --> OrderModule
    API --> InventoryModule

    %% Cross-Module Orchestration
    OrderModule -->|Validate Stock| InventoryModule
    OrderModule -->|Charge Cards| PaymentModule
    OrderModule -->|Create Labels| ShippingModule
    OrderModule -->|Send Invoice| NotifyModule

    %% Module Infrastructure Integrations
    AuthModule -.-> DB
    CatalogModule -.-> DB
    OrderModule -.-> DB
    InventoryModule -.-> DB
    
    PaymentModule -.-> Stripe
    ShippingModule -.-> EasyPost
    NotifyModule -.-> Resend
```

---

## 2. Directory Structure (Modular Monorepo)

To enforce isolation, the project uses a workspace-based monorepo (npm, Yarn, or pnpm workspaces). Strict dependency graphs are enforced via ESLint rules and TypeScript path aliases. No package can directly access the internal details of another package; interaction must occur through defined **public interface contracts**.

```text
electra/
├── apps/
│   └── web/                         # Next.js App Router Application
│       ├── src/
│       │   ├── app/                 # Page layouts, routes, and API endpoints
│       │   │   ├── api/             # API Route Handlers (delegates to packages/*)
│       │   │   ├── (auth)/          # Authentication flow views
│       │   │   ├── (dashboard)/     # Admin, warehouse, and customer portal views
│       │   │   └── shop/            # Public-facing storefront pages
│       │   ├── components/          # Reusable UI elements (Buttons, Cards, Modals)
│       │   ├── hooks/               # Client-side custom React hooks
│       │   ├── lib/                 # Browser-only utilities (analytics, local-storage)
│       │   └── styles/              # Global styles (Tailwind / Vanilla CSS)
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── auth/                        # Authentication & RBAC Layer
│   │   ├── src/
│   │   │   ├── index.ts             # Public API (getSession, authorizeRole, hashPassword)
│   │   │   ├── config.ts            # Auth provider setups (NextAuth / JWT options)
│   │   │   └── rbac.ts              # RBAC middleware & permission definitions
│   │   └── package.json
│   ├── db/                          # Database Client & Migration Layer
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Canonical Single-Source-of-Truth Schema
│   │   │   └── seed.ts              # Mock data generator (products, roles, initial stocks)
│   │   ├── src/
│   │   │   └── index.ts             # Instantiated Prisma Client export
│   │   └── package.json
│   ├── catalog/                     # Product catalog and search module
│   │   ├── src/
│   │   │   ├── index.ts             # Public API (searchProducts, getProductDetails)
│   │   │   ├── services/            # Catalog indexing and filtering logic
│   │   │   └── types.ts             # Catalog domain models
│   │   └── package.json
│   ├── orders/                      # Order creation & state transition engine
│   │   ├── src/
│   │   │   ├── index.ts             # Public API (createOrder, updateOrderStatus)
│   │   │   ├── services/            # Order verification & checkout business rules
│   │   │   └── types.ts             # Order aggregate types & transition validation
│   │   └── package.json
│   ├── inventory/                   # Stock allocation & warehouse management
│   │   ├── src/
│   │   │   ├── index.ts             # Public API (reserveStock, releaseStock, receiveInventory)
│   │   │   ├── services/            # Real-time allocation algorithms
│   │   │   └── types.ts             # Inventory models
│   │   └── package.json
│   ├── payments/                    # Payment gateway abstraction layer
│   │   ├── src/
│   │   │   ├── index.ts             # Public API (chargePayment, refundPayment)
│   │   │   ├── adapters/            # Gateway adapter implementations (Stripe, Paypal)
│   │   │   └── types.ts             # Universal payment schemas
│   │   └── package.json
│   ├── shipping/                    # 3PL & carrier shipping integration engine
│   │   ├── src/
│   │   │   ├── index.ts             # Public API (estimateRates, generateLabel, trackShipment)
│   │   │   ├── adapters/            # Carrier integration adapters (EasyPost, FedEx, UPS)
│   │   │   └── types.ts             # Package dimensions, weight configurations
│   │   └── package.json
│   └── notifications/               # Event-driven communications module
│       ├── src/
│       │   ├── index.ts             # Public API (sendEmailNotification, sendSMSNotification)
│       │   ├── templates/           # Email templates (HTML/MJML format for invoices, shipping)
│       │   └── types.ts             # Dispatch parameters
│       └── package.json
├── package.json                     # Root workspace configurations
├── tsconfig.json                    # Root tsconfig with path mappings
└── README.md
```

---

## 3. Data Models & Database Schema

The database schema is defined using **Prisma Schema Language** (PostgreSQL-optimized). It implements precise relationships to track catalog status, real-time warehouse inventory, cart reservations, transactional orders, logistics tracking, and audits.

```prisma
// file: packages/db/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  WAREHOUSE_OPERATOR
  SUPPORT_SPECIALIST
  ADMIN
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PROCESSING         // In preparation by warehouse
  READY_TO_SHIP      // Packed, label applied
  SHIPPED            // Handed over to logistics carrier
  DELIVERED
  CANCELLED
  REFUNDED
}

enum ShipmentStatus {
  LABEL_CREATED
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  EXCEPTION
}

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  firstName    String
  lastName     String
  role         Role        @default(CUSTOMER)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  // Relations
  addresses    Address[]
  orders       Order[]
  cart         Cart?
  auditLogs    AuditLog[]
}

model Address {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  isDefault    Boolean  @default(false)
  label        String   // e.g., "Home", "Office"
  street1      String
  street2      String?
  city         String
  state        String
  postalCode   String
  country      String
  phone        String
  
  // Relations
  shipments    Shipment[]
  orders       Order[]    @relation("ShippingAddress")
}

model Product {
  id          String   @id @default(uuid())
  sku         String   @unique
  name        String
  description String
  price       Decimal  @db.Decimal(10, 2)
  weightKg    Float    // For shipping rate calculation
  dimensions  Json     // { widthCm: Float, heightCm: Float, depthCm: Float }
  images      String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  inventory   InventoryItem?
  orderItems  OrderItem[]
  cartItems   CartItem[]
}

model InventoryItem {
  id          String   @id @default(uuid())
  productId   String   @unique
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity    Int      @default(0) // Physical count in warehouse
  reserved    Int      @default(0) // Allocated to unpaid or packing orders
  location    String   // Warehouse aisle/shelf locator, e.g., "Aisle 4, Shelf B1"
  updatedAt   DateTime @updatedAt
}

model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  
  // Relations
  items     CartItem[]
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
  createdAt DateTime @default(now())

  @@unique([cartId, productId])
}

model Order {
  id                String      @id @default(uuid())
  orderNumber       String      @unique // Human-readable sequence, e.g. ELEC-10024
  userId            String
  user              User        @relation(fields: [userId], references: [id])
  shippingAddressId String
  shippingAddress   Address     @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  status            OrderStatus @default(PENDING_PAYMENT)
  totalItemsPrice   Decimal     @db.Decimal(10, 2)
  shippingCost      Decimal     @db.Decimal(10, 2)
  taxCost           Decimal     @db.Decimal(10, 2)
  totalAmount       Decimal     @db.Decimal(10, 2)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  items             OrderItem[]
  shipments         Shipment[]
  transactions      Transaction[]
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  quantity    Int
  pricePaid   Decimal  @db.Decimal(10, 2) // Price locked at checkout
}

model Shipment {
  id                String         @id @default(uuid())
  orderId           String
  order             Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  destinationAddressId String
  destinationAddress Address       @relation(fields: [destinationAddressId], references: [id])
  carrier           String         // e.g., "FedEx", "DHL", "UPS"
  trackingNumber    String?        @unique
  shippingLabelUrl  String?
  estimatedDelivery DateTime?
  status            ShipmentStatus @default(LABEL_CREATED)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Transaction {
  id            String   @id @default(uuid())
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  gateway       String   // e.g., "Stripe"
  transactionId String   @unique // Gateway reference ID
  amount        Decimal  @db.Decimal(10, 2)
  status        String   // e.g., "succeeded", "failed", "refunded"
  createdAt     DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   // e.g., "UPDATE_INVENTORY", "CANCEL_ORDER"
  details   String   // JSON string of differences
  createdAt DateTime @default(now())
}
```

---

## 4. Module Interfaces & API Boundaries

To prevent cross-module pollution, packages must interact through strictly declared interfaces. Direct database modification bypasses are strictly forbidden. Below are the core TypeScript contract specifications:

### Catalog Module Public Interface
```typescript
// packages/catalog/src/index.ts
export interface ProductFilter {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export interface CatalogService {
  getProductById(id: string): Promise<ProductDTO | null>;
  getProductBySKU(sku: string): Promise<ProductDTO | null>;
  listProducts(filter: ProductFilter, limit: number, offset: number): Promise<{ items: ProductDTO[], total: number }>;
  createProduct(data: CreateProductInput): Promise<ProductDTO>;
  updateProduct(id: string, data: UpdateProductInput): Promise<ProductDTO>;
}
```

### Inventory Module Public Interface
```typescript
// packages/inventory/src/index.ts
export interface InventoryService {
  checkStockAvailability(productId: string, quantity: number): Promise<boolean>;
  reserveStock(orderId: string, items: { productId: string; quantity: number }[]): Promise<boolean>;
  releaseStock(orderId: string, items: { productId: string; quantity: number }[]): Promise<boolean>;
  commitReservation(orderId: string, items: { productId: string; quantity: number }[]): Promise<void>;
  updateWarehouseStock(productId: string, adjustment: number, location: string): Promise<void>;
}
```

### Order Module Public Interface
```typescript
// packages/orders/src/index.ts
export interface CheckoutInput {
  userId: string;
  shippingAddressId: string;
  cartId: string;
  paymentMethodToken: string;
}

export interface OrderService {
  checkout(input: CheckoutInput): Promise<OrderDTO>;
  updateOrderStatus(orderId: string, status: OrderStatus, actorUserId: string): Promise<OrderDTO>;
  getOrderDetails(orderId: string): Promise<OrderDTO | null>;
}
```

### Payments Module Public Interface
```typescript
// packages/payments/src/index.ts
export interface ChargeInput {
  amount: number; // In base units (e.g. cents)
  currency: string;
  paymentMethodToken: string;
  orderReference: string;
}

export interface ChargeResult {
  transactionId: string;
  gateway: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(transactionId: string, amount: number): Promise<boolean>;
}
```

### Shipping Module Public Interface
```typescript
// packages/shipping/src/index.ts
export interface ShippingParcel {
  weightKg: number;
  widthCm: number;
  heightCm: number;
  depthCm: number;
}

export interface ShippingRatesInput {
  originAddress: ShippingAddress;
  destinationAddress: ShippingAddress;
  parcels: ShippingParcel[];
}

export interface ShippingLabelResult {
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  ratePaid: number;
}

export interface ShippingService {
  getRates(input: ShippingRatesInput): Promise<ShippingRateOption[]>;
  purchaseLabel(rateId: string): Promise<ShippingLabelResult>;
  trackShipment(trackingNumber: string): Promise<ShipmentTrackingTimeline>;
}
```

---

## 5. Web Client Application Gateways (Next.js Routing)

All client actions routes map to dedicated backend endpoint actions, structured clean inside REST conventions.

### Customer Public Routes
- `GET  /api/catalog` - Dynamic list of stock items with custom paging.
- `GET  /api/catalog/[productId]` - Details of a single electronics component.
- `POST /api/cart` - Add items to a user session cart.
- `DELETE /api/cart/[itemId]` - Remove/adjust quantities.
- `POST /api/orders/checkout` - Submits payment token, reserves inventory, issues receipts.
- `GET  /api/orders/history` - User orders status and tracking indicators.

### Operations & Warehouse Portal
- `GET  /api/admin/orders` - Complete system order backlog sorted by status (`PROCESSING`, `READY_TO_SHIP`).
- `PUT  /api/admin/orders/[orderId]/status` - Operations step updates.
- `POST /api/admin/shipping/generate-label` - Calls logistics API (`packages/shipping`), locks tracking numbers.
- `PATCH /api/admin/inventory/stock` - Adjust real-world inventory values after warehouse checkins.

---

## 6. Implementation Phases (Step-by-Step Blueprint)

### Phase 1: Repository Orchestration & DB Setup
- **Objective**: Establish the workspace, config patterns, and deploy the database engine.
- **Tasks**:
  1. Initialize monorepo workspaces and target TypeScript configuration files (`tsconfig.json`).
  2. Implement `packages/db` module, add Prisma models, and write initial database migration files.
  3. Formulate `packages/db/prisma/seed.ts` script to load catalog items and users.
- **Validation**: Run `npx prisma db seed` on local postgres container; assert correct relations table creation.

### Phase 2: User Access Controls (RBAC Core)
- **Objective**: Create user profiles and enforce RBAC rules across routes.
- **Tasks**:
  1. Build custom hashing and verification methods in `packages/auth`.
  2. Structure Middleware checks for Next.js endpoints based on the `Role` column.
  3. Create standard REST register/login routes inside `apps/web/src/app/api/auth`.
- **Validation**: Verify that warehouse endpoints return a `403 Forbidden` response when accessed using a token registered under a `CUSTOMER` role.

### Phase 3: Catalog & Real-time Inventory System
- **Objective**: Develop core storefront catalog features linked to inventory levels.
- **Tasks**:
  1. Build `packages/catalog` to fetch products using pagination.
  2. Build `packages/inventory` with robust transaction safety to allocate and release items during transactions.
  3. Connect client frontend catalog layout routes.
- **Validation**: Attempt concurrent orders on stock items. Verify that system returns proper stock error codes when count drops below requested size.

### Phase 4: Payments & Order Checkout Logic
- **Objective**: Enable secure customer transactions.
- **Tasks**:
  1. Construct `packages/payments` adapters using Stripe Mock / Sandbox configurations.
  2. Code the main order checkout process inside `packages/orders` using transactional safeguards:
     - Reserve inventory -> Process payment via Stripe -> Commit inventory update -> Create invoice order.
  3. Implement automatic inventory release routines if a checkout transaction fails or times out.
- **Validation**: Verify database records show order changes to `PAID` state, transaction rows are added, and inventory counts correctly deduct reserved items.

### Phase 5: Warehouse Shipping & 3PL Integration
- **Objective**: Connect logistics APIs to manage shipping and tracking.
- **Tasks**:
  1. Connect `packages/shipping` using Sandbox keys (EasyPost/DHL).
  2. Build a dedicated UI portal for warehouse workers to view `PAID` orders, print shipping labels, and mark orders as `SHIPPED`.
  3. Configure webhooks to update tracking status as shipments progress.
- **Validation**: Simulate a shipping label purchase; confirm that a mock carrier tracking code is generated and saved to the database.

### Phase 6: Event Notifications & System Tuning
- **Objective**: Improve reliability, send alerts, and add caching.
- **Tasks**:
  1. Add mail layouts to `packages/notifications` using Resend.
  2. Configure Redis queues to process background emails and trigger automatic restock orders when inventory runs low.
  3. Implement transaction audit logs to track user and staff actions.
- **Validation**: Complete a purchase and verify that order confirmation and invoice emails are dispatched.
