# Food And Drink Ordering Design

Date: 2026-05-20
Project: He-Thong-Dat-Xan-develop
Scope: Menu and food/drink ordering tied to field bookings
Status: Draft approved in conversation, awaiting user review of written spec

## 1. Goal

Build a phase-1 food and drink ordering feature that feels like a net cafe workflow:

- user can choose drinks and fast food while booking a field
- user can place additional orders later from booking detail
- each food order is billed separately from the field booking
- each order is still tied to one booking and one field
- owner manages the menu and fulfills the order
- admin keeps full override power

This feature should support:

- owner-managed menu per field
- admin override and moderation
- separate food-order invoices linked to bookings
- multiple food orders under one booking
- payment by wallet, VnPay, or MoMo
- ordering allowed only during the valid booking play window
- receiving food at the field

## 2. Confirmed Direction

The feature follows these confirmed decisions:

- Owner is the main menu manager
- Admin still has full control across the whole system
- User can order:
  - during field booking
  - and again later from booking detail
- Food/drink billing is separate from field-booking billing
- One booking can have multiple food orders
- Order status flow in phase 1 is:
  - `pending`
  - `preparing`
  - `delivered`
- User may pay for food order at any time, but only within the booking play window
- Food orders can be paid by:
  - `wallet`
  - `vnpay`
  - `momo`
- User may start ordering immediately after the booking is successfully created
- Delivery mode is `receive at field`
- Phase 1 menu contains:
  - drinks
  - fast food
- Each menu item stores:
  - `name`
  - `price`
  - `image`
  - `is_available`
- Menu ownership is at `field` level, not stadium-wide
- Each food order is attached to the concrete field where the booking happens
- Food selection UI during booking should be a dedicated section with item cards and quantity controls
- Additional ordering after booking should happen in the booking detail page

## 3. Recommended Approach

The chosen direction is `simple field-level menu with separate booking-linked food orders`.

Why this approach:

- It keeps the current booking and payment flows stable because food ordering is added as a separate subsystem.
- It matches the intended net-cafe behavior more closely than merging food into the original field invoice.
- It allows repeat ordering during the same play session without rewriting booking payment logic.
- It keeps owner operations straightforward by associating every order with the exact field that must receive the items.

Approaches considered but not chosen:

- `single combined invoice with booking`: too rigid once users want to add items later
- `stadium-wide shared menu`: weaker operational mapping when each field may have different service rules
- `advanced POS workflow`: too large for phase 1

## 4. Scope

### 4.1 In scope

- owner-managed menu per field
- admin override of menu and order records
- drinks and fast food only
- item cards with quantity controls during booking
- additional ordering from booking detail
- multiple food orders under one booking
- separate food-order invoices
- wallet, VnPay, and MoMo payment methods
- owner order-status updates
- payment-time restriction to booking play window

### 4.2 Out of scope

- combo products
- kitchen printer / bill printing
- deep analytics for food sales
- complex fulfillment dashboards
- cross-booking carts
- shared stadium-level menus
- delivery outside the field
- post-session ordering after the booking window closes

## 5. User Behavior

The user flow for phase 1 is:

1. User chooses a field and booking time
2. In the booking flow, the system shows food/drink cards for that field
3. User can increase or decrease quantity per item
4. If the user chooses items, the system creates:
   - the booking as usual
   - the first food order linked to that booking
5. After the booking exists, user can open booking detail
6. Booking detail shows the same field-specific menu
7. User can place additional food orders
8. Each later order becomes its own separate food-order record
9. User can pay a food order by wallet, VnPay, or MoMo
10. User may only create or pay orders while the booking is still within its valid play window

## 6. Owner And Admin Behavior

### 6.1 Owner behavior

Owner should be able to:

- manage menu items for each field
- mark items available or unavailable
- see food orders for the exact field
- move order state through:
  - `pending`
  - `preparing`
  - `delivered`

### 6.2 Admin behavior

Admin should retain full authority to:

- view all menu items
- edit or disable menu items
- inspect food orders
- intervene if owner data or status handling is incorrect

## 7. Payment Rules

### 7.1 Separation from booking payment

Food ordering should not change the existing field-booking invoice structure.

Instead:

- field booking remains one payment flow
- each food order becomes a separate payment flow
- both are tied together through the booking reference

### 7.2 Allowed methods

Each food order may be paid by:

- `wallet`
- `vnpay`
- `momo`

### 7.3 Payment timing

Food orders may be paid at any point only while the related booking is still inside its valid play window.

That means:

- ordering can begin immediately after booking creation
- additional orders are allowed while the session is active
- new order placement or unpaid-order settlement should stop after the session window is no longer valid

## 8. Order Status Rules

Phase 1 order status should stay intentionally simple:

- `pending`
- `preparing`
- `delivered`

This is enough for real owner operation without introducing approval loops or cancellation complexity too early.

## 9. Data Design

Phase 1 should use a three-layer structure:

### 9.1 Menu item

Each item belongs to one field and should store at least:

- `field_id`
- `name`
- `price`
- `image`
- `is_available`
- timestamps

### 9.2 Food order

Each food order is one ordering action linked to one booking and should store at least:

- `booking_id`
- `user_id`
- `field_id`
- `status`
- `total_amount`
- `payment_method`
- `payment_status`
- `ordered_at`
- timestamps

Suggested payment statuses:

- `unpaid`
- `paid`

### 9.3 Food order item

Each row inside an order should store at least:

- `food_order_id`
- `menu_item_id`
- `quantity`
- `unit_price`
- `line_total`

Price snapshotting is important so later menu edits do not rewrite historical order totals.

## 10. UX Direction

### 10.1 Booking flow

The booking page should show a dedicated food-order section:

- card-based menu
- image, name, and price
- quantity increment and decrement controls
- clear subtotal feedback

### 10.2 Booking detail

Booking detail should allow:

- viewing previous food orders for that booking
- ordering more items
- paying unpaid food orders that are still within the allowed time window

### 10.3 Owner UI

Owner should get:

- menu management per field
- food-order list per field
- simple status controls

## 11. Risks And Constraints

Main implementation risks:

- avoiding accidental mixing of booking payment and food-order payment
- enforcing the valid booking-time ordering window consistently
- keeping owner views scoped correctly to the exact field
- preserving menu history correctly when prices change later

## 12. Summary

Phase 1 should deliver a practical net-cafe-style ordering system:

- choose food during booking
- order more from booking detail
- separate invoice for food
- multiple food orders per booking
- owner handles menu and fulfillment
- admin keeps full override control

This gives the product a realistic add-on ordering flow without turning the project into a full POS system yet.
