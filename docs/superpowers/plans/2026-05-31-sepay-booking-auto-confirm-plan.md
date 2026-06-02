# SePay Booking Auto Confirm Implementation Plan

## Objective

Implement SePay-based automatic bank-transfer reconciliation for direct field bookings so that:

- `deposit` bookings are auto-confirmed when the exact `50%` transfer is received
- `full` bookings are auto-confirmed when the exact `100%` transfer is received
- owner approval is skipped for successfully matched SePay transfers

## Constraints

- Preserve existing booking creation and payment history behavior where possible.
- Keep wallet payment flow unchanged.
- Do not rely on client-side "I already paid" confirmation for bank-transfer bookings.
- Make webhook processing idempotent and transaction-safe.
- Avoid broad refactors in unrelated booking/payment code.

## Phase 1: Data Model And Persistence

### 1.1 Add booking payment reference

Add a new `payment_reference` field to bookings via migration and model update.

Tasks:

- Add migration for `bookings.payment_reference`
- Update [booking.js](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\backend\models\booking.js) to include the field
- Ensure new bank-transfer bookings get a unique reference after creation

Acceptance criteria:

- Every new direct-transfer booking stores a unique reference
- Existing bookings remain readable

### 1.2 Add SePay receipt table

Create a new table for webhook receipts and reconciliation audit.

Tasks:

- Add migration for `booking_payment_receipts`
- Add Sequelize model
- Include fields for provider transaction id, booking id, amount, raw content, raw payload, matched status, matched reason, timestamps

Acceptance criteria:

- The system can persist every SePay callback
- Duplicate callbacks can be detected by unique transaction key

## Phase 2: Booking Creation Integration

### 2.1 Extend bank-transfer booking creation

Update booking creation logic so transfer bookings carry the data needed for reconciliation.

Tasks:

- Update [bookingController.js](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\backend\controllers\bookingController.js) create-booking flow
- Generate and persist `payment_reference`
- Standardize `payment_method` for SePay transfer bookings
- Keep `wallet` flow unchanged

Acceptance criteria:

- Newly created transfer bookings expose payment reference in response payload
- Deposit and full bookings still compute expected payment amount correctly

### 2.2 Preserve hold behavior until webhook success

Keep unpaid transfer bookings in `pending/unpaid` with `hold_until`, then clear hold on successful reconciliation.

Acceptance criteria:

- Booking is not confirmed before real webhook verification
- Successful webhook clears `hold_until`

## Phase 3: SePay Webhook Processing

### 3.1 Add webhook route and controller

Introduce a dedicated SePay webhook endpoint in backend.

Tasks:

- Add route such as `POST /api/payments/sepay/webhook`
- Add controller handler
- Validate request authenticity using configured SePay secret/signature mechanism

Acceptance criteria:

- Backend accepts valid SePay webhook payloads
- Invalid webhook requests are rejected

### 3.2 Implement reconciliation service

Create a focused service for matching bank transfers to bookings.

Tasks:

- Add a new backend service module for:
  - extracting payment reference from transfer content
  - finding booking by reference
  - validating booking eligibility
  - validating exact amount
  - creating receipt record
  - updating booking state atomically
- Use DB transaction + row lock on booking update

Acceptance criteria:

- Matching logic is isolated from route/controller glue
- Processing the same transaction twice does not double-confirm a booking

### 3.3 Auto-confirm rules

Implement the exact business outcomes:

- `deposit` exact match -> `payment_status = partially_paid`, `status = confirmed`
- `full` exact match -> `payment_status = paid`, `status = confirmed`

Additional updates:

- set `payment_method = sepay`
- set `payment_recorded_at`
- clear `hold_until`
- emit slot confirmation event
- notify user and owner

Acceptance criteria:

- Successful transfers bypass owner approval
- Booking moves directly to confirmed state

## Phase 4: Exception Handling

### 4.1 Wrong amount / wrong reference

Handle non-matching transfers without auto-confirmation.

Tasks:

- Store receipt as mismatched or unmatched
- Do not mutate booking into confirmed state
- Return success to webhook caller after safe persistence if appropriate

Acceptance criteria:

- Incorrect transfer data never confirms a booking
- Support staff/admin can inspect receipt records later

### 4.2 Expired or already processed booking

Define safe behavior for stale bookings.

Tasks:

- Reject auto-confirm if booking is expired/cancelled/refunded/already processed
- Persist receipt with reason for manual follow-up

Acceptance criteria:

- Expired bookings are not resurrected by late bank transfers

## Phase 5: Frontend Payment Experience

### 5.1 Update payment page semantics

Revise [PaymentPage.jsx](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\frontend\src\pages\PaymentPage.jsx) so it no longer treats a button click as payment proof.

Tasks:

- Show payment reference clearly
- Build QR/payment content using exact expected amount + payment reference
- Replace manual confirm action with waiting-state UX
- Keep "pay later / cancel booking" logic only if still intended by product rules

Acceptance criteria:

- User sees exact amount and exact transfer content
- UI explains that confirmation is automatic after bank verification

### 5.2 Poll booking/payment state

Add lightweight polling on the payment page.

Tasks:

- Periodically refetch booking status while the page is open
- Detect transition from unpaid to partially paid/paid and confirmed
- Show success state automatically when webhook processing completes

Acceptance criteria:

- User does not need to refresh manually to see confirmed status

## Phase 6: Tests

### 6.1 Backend tests

Add focused test coverage for:

- deposit exact-match webhook -> partially paid + confirmed
- full exact-match webhook -> paid + confirmed
- wrong amount -> no confirm
- wrong reference -> no confirm
- duplicate webhook -> idempotent
- expired booking -> no confirm

Suggested locations:

- new webhook/service tests in `backend/tests`
- expand booking payment tests where appropriate

### 6.2 Frontend tests

Add or update tests for:

- payment page displays payment reference
- page shows waiting-for-bank-confirmation state
- polling reflects confirmed booking after backend state change

## Phase 7: Config And Rollout

### 7.1 Environment configuration

Add config entries for:

- SePay webhook secret / API auth material
- optional receiving account metadata if needed by frontend QR display

### 7.2 Backward compatibility

Keep legacy manual confirmation routes for fallback/admin use, but do not use them as the primary happy path for SePay transfer bookings.

### 7.3 Manual verification checklist

Before release, verify:

- new booking gets payment reference
- QR content includes reference
- SePay webhook with exact `50%` confirms booking
- SePay webhook with exact `100%` confirms booking
- owner no longer needs to approve these bookings

## Execution Order

1. Add data model changes for payment reference and receipt table
2. Wire payment reference into booking creation response
3. Implement SePay webhook route and reconciliation service
4. Update booking status transition logic for auto-confirm
5. Update payment UI to waiting-state model
6. Add tests for webhook, reconciliation, and payment page behavior
7. Run end-to-end manual verification with SePay sandbox or mocked webhook payloads

## Risks To Watch

- `bookingController.js` currently contains duplicated or heavily grown payment logic; keep edits narrow and verify no regression in wallet flow
- Existing manual payment confirmation endpoints may conflict with new automatic flow if left exposed in the same UI path
- Current MySQL auto-sync/index issue in coupons is unrelated but can pollute logs during testing; avoid mixing fixes unless it blocks payment work
