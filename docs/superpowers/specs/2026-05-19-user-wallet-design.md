# User Wallet Design

Date: 2026-05-19
Project: He-Thong-Dat-Xan-develop
Scope: User wallet phase 1
Status: Draft approved in conversation, awaiting user review of written spec

## 1. Goal

Build a simple internal wallet for users that works as an official third payment method beside `VnPay` and `Momo`.

In phase 1, the wallet is used for:

- nap tien vao vi
- rut tien khoi vi
- thanh toan dat san bang vi
- nhan tien hoan ve vi khi huy san

The wallet should feel like a small product feature inside the booking system, not a separate fintech app.

## 2. Confirmed Direction

The wallet follows these confirmed decisions:

- Wallet is a user-facing internal balance
- Wallet is a third payment method beside `VnPay` and `Momo`
- At checkout, user chooses exactly one payment method: `Wallet`, `VnPay`, or `Momo`
- Wallet payment is full-payment only in phase 1
- If wallet balance is not enough, wallet payment is not allowed
- Wallet can be topped up through `VnPay` or `Momo`
- Withdrawal is available from the wallet
- Withdrawal is simulated inside the system in phase 1
- User enters bank information manually for each withdrawal
- No admin approval is required for withdrawal in phase 1
- Wallet balance is deducted immediately after a successful withdrawal request
- All eligible booking refunds go back to the wallet
- Refund destination does not depend on the original payment method
- No transaction fees in phase 1

## 3. Recommended Approach

The chosen direction is `Minimal wallet tied closely to booking`.

Why this approach:

- It covers the business need quickly without building a large finance subsystem.
- It keeps scope focused on booking payment and refund behavior.
- It reduces risk before moving into more complex features like recurring booking deposits.
- It fits the current product stage better than a full e-wallet architecture.

Approaches considered but not chosen:

- `Ledger-first wallet`: cleaner long-term audit story, but heavier than needed for phase 1
- `Mini e-wallet platform`: too large for the current scope

## 4. Scope

### 4.1 In scope

- wallet balance for each user
- wallet transaction history
- top-up flow using `VnPay` or `Momo`
- withdrawal flow with manual bank information input
- wallet payment option in booking checkout
- automatic refund-to-wallet flow for eligible booking cancellations

### 4.2 Out of scope

- mixed payment from wallet plus another payment method
- real bank payout integration
- user-to-user transfers
- owner wallet
- loyalty points, cashback, or voucher balance
- advanced reconciliation dashboard

## 5. Business Rules

### 5.1 Wallet ownership

- Each user has one wallet
- Wallet belongs only to the user account
- Wallet balance cannot go below zero

### 5.2 Top-up

- User enters an amount to top up
- User chooses `VnPay` or `Momo`
- Wallet balance increases only after the external payment succeeds
- A top-up transaction record is created after success

### 5.3 Withdrawal

- User enters withdrawal amount
- User manually enters bank name, account number, and account holder name each time
- System validates available wallet balance before processing
- In phase 1, withdrawal is simulated and completed inside the system
- No admin review step exists in phase 1
- Wallet balance is deducted immediately when the withdrawal succeeds
- A withdrawal transaction record is created immediately

### 5.4 Booking payment by wallet

- Checkout shows three payment methods: `Wallet`, `VnPay`, `Momo`
- User selects one method only
- If `Wallet` is selected, system checks current wallet balance
- If the balance is enough, booking payment succeeds and wallet balance is deducted
- If the balance is not enough, wallet payment is rejected and user must choose another method
- A wallet payment transaction record is created and linked to the booking

### 5.5 Refund to wallet

- If a booking cancellation is eligible for refund, money always returns to the wallet
- This rule applies even if the original payment used `VnPay` or `Momo`
- Refund logic still respects existing cancellation/refund eligibility rules
- A refund transaction record is created and linked to the booking

### 5.6 Fees

- No fee is charged for top-up
- No fee is charged for withdrawal
- No fee is charged for refund-to-wallet

## 6. Data Design

Phase 1 should use a simple data model:

- one wallet per user
- one transaction record for every balance-changing action

### 6.1 Wallet data

Wallet should store at least:

- `userId`
- `balance`
- timestamps

### 6.2 Wallet transaction data

Transaction records should store at least:

- `userId`
- `type`
- `amount`
- `status`
- `description`
- `referenceType`
- `referenceId`
- `metadata` for payment or bank info when needed
- timestamps

### 6.3 Transaction types

Phase 1 needs these transaction types:

- `TOP_UP`
- `WITHDRAW`
- `BOOKING_PAYMENT`
- `BOOKING_REFUND`

### 6.4 Consistency rule

Any successful money-changing action must:

1. update the wallet balance
2. create the matching transaction record

These two steps must behave as one business action so the system does not end up with:

- changed balance without history
- history without changed balance

## 7. User Experience

### 7.1 Wallet page

The wallet page should show:

- current balance
- main actions: `Nap tien`, `Rut tien`, `Lich su giao dich`
- a short explanation that wallet can be used to pay for bookings and receive refunds

### 7.2 Top-up UI

The top-up flow should allow the user to:

- enter amount
- choose `VnPay` or `Momo`
- continue into the existing payment flow

### 7.3 Withdrawal UI

The withdrawal flow should allow the user to:

- enter amount
- enter bank name
- enter account number
- enter account holder name
- confirm withdrawal

### 7.4 Transaction history UI

History should list recent wallet transactions with:

- transaction type
- plus/minus amount
- time
- status
- short description

When related to a booking, the UI should make that obvious, for example:

- `Thanh toan don dat san`
- `Hoan tien do huy san`

### 7.5 Booking checkout integration

The booking payment UI should:

- add `Wallet` as a visible payment method beside `VnPay` and `Momo`
- show current wallet balance near the wallet option
- clearly show when the balance is insufficient

## 8. System Flow

### 8.1 Top-up flow

1. User opens wallet
2. User chooses top-up
3. User enters amount
4. User selects `VnPay` or `Momo`
5. External payment succeeds
6. System increases wallet balance
7. System creates `TOP_UP` transaction

### 8.2 Withdrawal flow

1. User opens wallet
2. User chooses withdrawal
3. User enters amount and bank information
4. System validates balance
5. System deducts wallet balance
6. System creates `WITHDRAW` transaction
7. System returns success result

### 8.3 Booking payment flow

1. User reaches booking checkout
2. User selects `Wallet`
3. System checks balance
4. If enough, system deducts balance
5. Booking is marked paid
6. System creates `BOOKING_PAYMENT` transaction

### 8.4 Refund flow

1. Booking cancellation is processed
2. Existing refund eligibility rules determine refund amount
3. Refund amount is added to the user wallet
4. System creates `BOOKING_REFUND` transaction

## 9. Technical Impact

### 9.1 Backend

Expected backend work:

- add wallet data model
- add wallet transaction data model
- add APIs for wallet summary and transaction history
- add top-up entry flow
- add withdrawal flow
- extend booking payment handling for `Wallet`
- extend booking cancellation refund handling to support refund-to-wallet

### 9.2 Frontend

Expected frontend work:

- add wallet page
- add top-up form or modal
- add withdrawal form or modal
- add wallet transaction history view
- update booking checkout to include `Wallet`

## 10. Success Criteria

Phase 1 is successful when:

- users can top up wallet balance through `VnPay` or `Momo`
- users can withdraw balance through the phase-1 simulated flow
- users can pay for a booking by selecting `Wallet`
- insufficient balance blocks wallet checkout clearly
- eligible booking cancellations refund money back to the wallet
- each successful balance change has matching transaction history

## 11. Risks and Constraints

- Real bank payout is intentionally not implemented in phase 1
- Refund behavior is intentionally normalized to wallet-only, which may differ from some external gateway expectations
- The wallet design is intentionally simple and may need extension later for recurring booking deposits or financial reporting
