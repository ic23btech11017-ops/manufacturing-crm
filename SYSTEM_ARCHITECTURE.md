# Manufacturing Operations System (MOS) - Architecture & Implementation Plan

## 1. System Overview
This document outlines the end-to-end architecture for the comprehensive Manufacturing Operations System (MOS). It is designed to be a scalable, production-ready full-stack application.

## 2. Technology Stack
*   **Frontend:** React 18, Vite, React Router DOM, Tailwind CSS, Lucide Icons.
*   **Backend:** Node.js, Express.js (RESTful API architecture).
*   **Database:** PostgreSQL (Relational integrity is crucial for MOS).
*   **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).

## 3. Core Modules & Workflows

### A. Procurement & Inventory (Inward)
**Flow:** Purchase Order (PO) → Goods Receipt Note (GRN) → Inventory Addition
1.  **Procurement:** Managers draft POs to Suppliers.
2.  **Receiving:** Warehouse operator validates incoming shipment against PO.
3.  **Inventory Logic:** Raw materials mapped by SKU are appended. Reorder points trigger alerts if thresholds are breached.

### B. Production & Material Consumption (Internal)
**Flow:** Bill of Materials (BOM) → Work Order (WO) → Execution → Consumption
1.  **BOM Definition:** Engineering defines exact components (e.g., 1 Box = 0.5kg Resin + 1 Cardboard carton).
2.  **Work Order:** Production manager allocates a WO for 1,000 Boxes.
3.  **Execution Trigger:** When WO is marked `completed`:
    *   *Deduction Trigger:* The exact required raw materials are subtracted from `Raw Materials` inventory.
    *   *Addition Trigger:* The completed batch is added to `Finished Goods` inventory.

### C. Sales & Dispatch (Outward)
**Flow:** Quotation → Sales Order → Fulfillment → Dispatch
1.  **Sales:** Client approves Quotation, generating a Sales Order.
2.  **Fulfillment:** If Finished Goods stock is sufficient, stock is reserved. If not, a Work Order is triggered.
3.  **Dispatch:** Order leaves warehouse, triggering a final outbound inventory deduction.

## 4. Database Schema (PostgreSQL core entities)
*(A full SQL initialization script has been generated in `database/schema.sql`)*
*   `users`: Authentication and roles (`admin`, `manager`, `operator`).
*   `items`: Unified table for all SKUs (Raw, Finished, Consumables).
*   `warehouses` & `locations`: Physical tracking.
*   `inventory_balances`: Current qty mapped per item per location.
*   `stock_movements`: Immutable log of every change (In, Out, Transfer, Consume).
*   `boms` & `bom_components`: The technical recipe.
*   `work_orders`: Production execution queue.

## 5. Security & Access Rules
*   **Operators:** Can only view assigned Work Orders, change statuses, and issue inventory deducts via execution.
*   **Managers:** Can create POs, approve Quotes, and edit BOMs.
*   **Admins:** Full access, system configuration, audit logs, and analytics.

## 6. Implementation Roadmap (Phases)
### Phase 1: Foundations (Current)
- [x] Basic Routing, Theming, and Layout
- [x] CRM & Sales Order skeleton
- [x] Inventory Management skeleton (Add/Edit items, valuations)

### Phase 2: Production Engine (In Progress)
- [ ] Define PostgreSQL Schema definitions (Provided!)
- [ ] Bill of Materials (BOM) API & Table
- [ ] Work Order creation & automatic material consumption logic

### Phase 3: Advanced Workflows
- [ ] Multi-Warehouse management and transfers
- [ ] JWT Role enforcement
- [ ] Dynamic PDF / CSV generation for Audits

---
*Note: During this preview sandbox, we are simulating the relational PostgreSQL logic using advanced JSON/Memory structures in the Node.js backend. This allows instant previewing without external database connections while keeping exactly the same API signatures.*
