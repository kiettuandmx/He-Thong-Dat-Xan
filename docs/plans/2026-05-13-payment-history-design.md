# Payment History Feature Design

## Overview
This design defines a unified payment history experience for both users and owners. The feature shows payment and refund activity in one chronological timeline, reusing existing booking payment fields rather than introducing a separate financial ledger in this task.

## Product Goals
- Users can view only their own payment and refund history.
- Owners can view payment and refund history for every booking that belongs to their stadiums.
- The existing owner refund-history experience is replaced by a broader payment-history page that includes both payment and refund transactions.
- The timeline must stay financially correct for refunded, cancelled, and partially processed booking states supported by current data.

## Core Business Rules

### 1. Transaction source of truth
- `Booking` remains the current source of truth for financial history.
- One booking may create zero, one, or two timeline transactions.

### 2. Payment transaction rule
- Create a `payment` transaction when `amount_paid > 0`.
- Use `payment_recorded_at` when available as the payment transaction time.
- Fall back to `payment_completed_at`, then `createdAt`, when `payment_recorded_at` is missing.

### 3. Refund transaction rule
- Create a `refund` transaction when `refunded_at != null`.
- Use `refunded_at` as the refund transaction time.

### 4. Booking inclusion rule
- Do not hard-exclude `cancelled` bookings from payment history queries.
- A booking appears in payment history only if it has financial activity:
  - `amount_paid > 0`, or
  - `refunded_at != null`
- This keeps cancelled bookings visible when they still matter financially and excludes noise from bookings that never created a payment or refund event.

### 5. Timeline and pagination rule
- Payment and refund transactions are merged into one list.
- The list is sorted by transaction date descending.
- Pagination is calculated on transactions, not on bookings.

### 6. Default filter rule
- Default filter is the current month.
- Users can switch to a custom date range.
- Filter calculations are based on transaction dates, not booking dates.

## Backend Architecture

### Endpoints

#### GET `/api/bookings/payment-history`
Authenticated endpoint for a user to view only their own payment and refund history.

#### GET `/api/bookings/owner/payment-history`
Authenticated endpoint for an owner to view payment and refund history across all stadiums they own.

### Query parameters
- `startDate` in `YYYY-MM-DD`
- `endDate` in `YYYY-MM-DD`
- `month`
- `year`
- `limit` default `10`
- `offset` default `0`

### User endpoint behavior
1. Read `userId` from the auth token.
2. Query bookings belonging to that user.
3. Transform only financially relevant bookings into timeline transactions.
4. Join display data from `Booking -> Field -> Stadium`.
5. Apply date filters to transaction dates.
6. Sort descending by transaction time.
7. Paginate on the transaction array.
8. Return paginated transactions plus summary values for:
   - `totalPayment`
   - `totalRefund`

### Owner endpoint behavior
1. Read `ownerId` from the auth token.
2. Find every stadium owned by that owner.
3. Query bookings belonging to those stadiums.
4. Transform only financially relevant bookings into timeline transactions.
5. Join display data from `Booking -> User`, `Booking -> Field`, and `Field -> Stadium`.
6. Include owner-only transaction fields:
   - `userName`
   - `userPhone`
   - `bookingStatus`
   - `actualRevenue`
   - `refundReason`
7. Build summary values across the filtered transaction set:
   - `totalPayment`
   - `totalRefund`
   - `netRevenue = totalPayment - totalRefund`
8. Sort and paginate on transactions.

## Data Contract

### Shared transaction fields
- `bookingId`
- `stadiumName`
- `fieldName`
- `amount`
- `refundAmount`
- `transactionDate`
- `status`
- `type`
- `paymentMethod`
- `refundReason`

### Owner-only transaction fields
- `userName`
- `userPhone`
- `bookingStatus`
- `actualRevenue`

## Frontend Architecture

### Shared page
- Use one shared page at `frontend/src/pages/PaymentHistory.jsx`.
- The page adapts by authenticated role instead of maintaining separate owner and user implementations.

### Routes
- Add `/payment-history` for users.
- Replace owner navigation from `/owner/refund-history` to `/owner/payment-history`.
- Keep admin refund history unchanged in this task.

### Page behavior
- If current user is an owner, call the owner endpoint and show owner-only columns and summary cards.
- If current user is a standard user, call the user endpoint and show only their own history and shared summary cards.

### UI sections
1. Header with page title and role-aware subtitle.
2. Quick filter actions for current month and custom date range.
3. Summary cards:
   - User: total payment, total refund
   - Owner: total payment, total refund, net revenue
4. Unified transaction table or card list with clear payment vs refund styling.
5. Load-more pagination for long histories.

### Navigation migration
- The old owner-facing `RefundHistory` page is no longer the primary owner history screen.
- Owner menu text changes from "Lich su hoan tien" to "Lich su thanh toan".
- Existing admin refund history remains separate because the current requirement only expands user and owner financial history.

## Error Handling
- Return `401` when the authenticated actor cannot be resolved from token context.
- Return `400` for invalid date filter combinations or malformed month and year values.
- Return an empty successful response for owners who do not yet own any stadiums.
- Show empty-state UI when no transaction matches the current filters.

## Testing Strategy
- Verify a booking with `amount_paid > 0` produces a payment transaction.
- Verify `payment_recorded_at` is preferred over `createdAt` for payment transaction time.
- Verify a booking with `refunded_at` produces a refund transaction.
- Verify a cancelled booking with financial activity is still shown.
- Verify a booking with no payment and no refund is excluded.
- Verify current-month default filtering.
- Verify transaction sorting.
- Verify transaction-level pagination and `hasMore`.
- Verify owner summaries include `netRevenue`.
- Verify user endpoint never returns another user's bookings.

## Constraints
- Reuse the current booking model and existing payment-related booking fields.
- Do not redesign the domain into a dedicated payment ledger in this task.
- Follow existing backend route and controller patterns where possible.
- Minimize disruption to the existing admin refund-history flow.
