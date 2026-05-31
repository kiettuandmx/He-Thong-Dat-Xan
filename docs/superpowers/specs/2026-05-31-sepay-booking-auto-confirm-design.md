# SePay Booking Auto Confirm Design

## Goal

Add SePay-based bank transfer reconciliation for direct field bookings so that when the customer transfers the correct amount with the correct transfer content, the system automatically confirms the booking without requiring owner approval.

This applies to both:

- `deposit` bookings paid with the expected `50%` amount
- `full` bookings paid with the expected `100%` amount

## Business Rule

For bookings paid by bank transfer through the SePay flow:

- If SePay reports a real incoming transfer that matches the booking reference and exact expected amount, the booking is auto-confirmed.
- Owner approval is skipped for these successfully matched transfers.
- A `deposit` booking that receives the correct deposit amount becomes:
  - `payment_status = partially_paid`
  - `status = confirmed`
- A `full` booking that receives the correct full amount becomes:
  - `payment_status = paid`
  - `status = confirmed`

If the transfer does not match exactly, the system must not auto-confirm the booking.

## Current System Context

The project already has the core booking and payment scaffolding needed for this feature:

- Booking creation already supports `payment_type = deposit | full`
- Booking rows already store:
  - `total_price`
  - `amount_paid`
  - `payment_status`
  - `payment_method`
  - `payment_recorded_at`
  - `hold_until`
- Non-wallet online bookings are currently created as:
  - `status = pending`
  - `payment_status = unpaid`
- There is already a manual payment confirmation path in [bookingController.js](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\backend\controllers\bookingController.js)
- The payment UI already shows bank-transfer QR/payment screens in [PaymentPage.jsx](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\frontend\src\pages\PaymentPage.jsx) and [PaymentMoMo.jsx](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\frontend\src\pages\PaymentMoMo.jsx)

The main missing pieces are:

- a durable booking payment reference
- a SePay webhook endpoint
- reconciliation logic
- transaction receipt persistence
- UI states that reflect automatic verification instead of user self-confirmation

## Scope

This spec covers only:

- direct field booking payment by bank transfer
- automatic verification through SePay webhook
- automatic booking confirmation when transfer data matches

This spec does not cover:

- wallet top-up by SePay
- recurring booking payment by SePay
- owner withdrawal flows
- refund automation to bank accounts

## User Flow

### 1. Booking creation

The user creates a booking and chooses bank transfer payment with either:

- `deposit`
- `full`

Backend creates the booking in unpaid pending state and computes:

- expected payment amount for this transaction
- unique payment reference for this booking

### 2. Payment instructions

The payment page displays:

- receiving bank account
- exact amount to transfer
- transfer content containing the payment reference
- QR code prefilled with both amount and reference

The page no longer treats a user click as proof of payment. It only communicates that the system is waiting for bank confirmation.

### 3. Real bank transfer

The customer sends money through a real banking app.

### 4. SePay webhook

SePay detects the incoming transfer and calls a backend webhook with transaction details.

### 5. Reconciliation

Backend validates the webhook and attempts to match the transfer to a booking by payment reference.

It then checks:

- booking exists
- booking is still eligible for auto confirmation
- transfer amount matches the expected amount exactly
- payment has not already been processed

### 6. Automatic confirmation

If the transfer matches:

- update booking payment fields
- set booking status to `confirmed`
- clear hold timeout
- persist receipt/transaction record
- emit notifications and socket events

### 7. Frontend status refresh

The user sees the booking move automatically into confirmed state without waiting for owner approval.

## Data Model Changes

### Booking changes

The booking row needs an explicit immutable payment reference used for matching bank transfers.

Add a field on `bookings`:

- `payment_reference`

Recommended format:

- `BK<bookingId>` or `SBK<bookingId>`

The reference must be:

- unique
- human-readable
- short enough for transfer content
- stable for the lifetime of the booking

### Payment receipt table

Add a dedicated table for bank transfer receipts, for example:

- `booking_payment_receipts`

Suggested columns:

- `id`
- `booking_id`
- `provider`
- `provider_transaction_id`
- `payment_reference`
- `transfer_amount`
- `raw_transfer_content`
- `bank_sub_account`
- `matched_status`
- `matched_reason`
- `raw_payload`
- `received_at`
- `processed_at`

This table is required for:

- webhook idempotency
- auditability
- exception handling
- debugging incorrect transfers

## Payment State Rules

### Expected amount

Expected transfer amount is derived from booking state:

- `deposit` -> `expected_amount = total_price * 0.5`
- `full` -> `expected_amount = total_price`

The current `amount_paid` field in bookings is already being used as the amount due in the first payment step. The new flow will continue using it that way, but the system must distinguish:

- amount expected for current transfer
- amount actually received from bank

The bank receipt table is the source of truth for actual incoming transfer data.

### Status updates

On successful exact match:

- `deposit`
  - `payment_status = partially_paid`
  - `status = confirmed`
  - `payment_method = sepay`
  - `payment_recorded_at = now`
  - `hold_until = null`
- `full`
  - `payment_status = paid`
  - `status = confirmed`
  - `payment_method = sepay`
  - `payment_recorded_at = now`
  - `hold_until = null`

### Idempotency

If the same SePay transaction or webhook arrives more than once:

- no duplicate state changes
- no duplicate notifications
- no duplicate slot confirmation events

## Matching Rules

### Match key

Primary match key is the booking payment reference embedded in transfer content.

Example content:

- `BK12345`
- `SBK12345`

The frontend QR and payment instructions must consistently use the same reference format.

### Exact amount rule

Auto confirmation only happens when transfer amount equals the exact expected amount.

Examples:

- booking `deposit`, expected `200000`, transfer `200000` -> auto-confirm
- booking `deposit`, transfer `400000` -> no auto-confirm
- booking `full`, expected `400000`, transfer `400000` -> auto-confirm
- booking `full`, transfer `200000` -> no auto-confirm

This strict rule avoids accidental confirmation against the wrong payment stage.

### Eligible booking rule

Booking must still be eligible for processing. The system should reject auto-confirm if:

- booking was cancelled
- booking was refunded
- booking was already paid/processed
- booking no longer represents a live payable reservation

For expired hold handling, the chosen rule is:

- expired bookings must not auto-confirm
- unmatched successful bank transfers against expired bookings are recorded for manual handling

This avoids confirming a slot that may already have been released and rebooked.

## Backend Components

### 1. Booking payment reference generation

Extend booking creation so every bank-transfer booking has a payment reference.

This logic belongs in the booking creation flow, close to the existing amount and hold handling in [bookingController.js](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\backend\controllers\bookingController.js).

### 2. SePay webhook route

Add a dedicated webhook route, for example:

- `POST /api/payments/sepay/webhook`

Responsibilities:

- receive payload from SePay
- validate authenticity
- hand off to reconciliation service
- return fast success/error response

### 3. Reconciliation service

Add a focused service module responsible for:

- parsing SePay payload
- extracting booking reference
- finding booking
- validating eligibility
- validating amount
- writing receipt record
- updating booking atomically
- ensuring idempotency

This should be a separate service instead of mixing reconciliation rules directly into the controller.

### 4. Transaction-safe booking update

Use a DB transaction and row lock when processing matched payments so that:

- concurrent webhooks do not double-confirm
- manual actions cannot race the webhook

### 5. Notification and socket integration

After auto-confirm:

- notify user that booking is confirmed
- notify owner that a confirmed paid booking was created automatically
- emit slot confirmation socket event using the existing socket pattern

## Frontend Changes

### Payment page behavior

In [PaymentPage.jsx](C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\frontend\src\pages\PaymentPage.jsx):

- show exact amount and booking payment reference
- generate QR content using booking payment reference
- replace manual confirmation semantics

The existing button should no longer mean:

- `I confirm I paid`

It should become something like:

- `Tôi đã chuyển khoản, chờ hệ thống xác nhận`

or be replaced by passive status plus refresh polling.

### Polling or refresh

Frontend should periodically fetch booking status while user remains on the payment screen so the UI can switch automatically to confirmed state once webhook processing completes.

This can be simple polling in the first version.

### User messaging

The payment UI should clearly communicate:

- exact amount required
- exact transfer content required
- transfer will be auto-verified
- wrong amount or wrong content may delay confirmation

## Error and Exception Handling

### Wrong content

If transfer arrives but payment reference is missing or invalid:

- store receipt as unmatched
- do not confirm booking

### Wrong amount

If reference matches but amount does not:

- store receipt as mismatched
- do not confirm booking

### Duplicate webhook

If transaction already processed:

- return success
- do not re-apply booking state update

### Expired booking

If payment arrives after hold expiry:

- store receipt
- do not auto-confirm
- mark as needing manual review

### SePay outage or delayed webhook

If user has paid but webhook is delayed:

- booking remains pending/unpaid until webhook arrives
- payment page keeps showing waiting state

No optimistic confirmation should happen on the frontend.

## Security Considerations

- Verify SePay webhook authenticity using the provider’s supported signature or secret mechanism.
- Do not trust client-originated payment confirmation.
- Do not allow the user to directly call manual booking confirmation for bank transfer success.
- Store raw webhook payload for audit, but avoid exposing it to frontend responses.

## Testing Strategy

### Backend tests

Add tests for:

- deposit booking exact-match webhook -> `partially_paid + confirmed`
- full booking exact-match webhook -> `paid + confirmed`
- wrong amount -> no confirm
- wrong reference -> no confirm
- duplicate webhook -> idempotent
- expired booking -> no confirm

### Frontend tests

Add tests for:

- payment page displays booking payment reference
- waiting state is shown instead of manual self-confirm
- confirmed booking status appears after backend state changes

## Rollout Notes

- Keep manual admin/owner payment tools for fallback handling, but they should no longer be the normal success path for SePay bank-transfer bookings.
- Existing bookings without payment references can remain legacy; the SePay auto-confirm flow only needs to apply to bookings created after this feature is deployed, unless a migration/backfill is explicitly added later.

## Success Criteria

This feature is successful when:

- a customer transfers the exact deposit or full amount through the bank
- SePay webhook reaches backend
- backend matches transfer to booking and confirms it automatically
- booking no longer waits for owner approval
- UI reflects confirmed status without manual payment confirmation by the customer
