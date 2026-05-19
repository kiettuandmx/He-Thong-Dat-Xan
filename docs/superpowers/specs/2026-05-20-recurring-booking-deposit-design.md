# Recurring Booking With Deposit Design

Date: 2026-05-20
Project: He-Thong-Dat-Xan-develop
Scope: User recurring booking with deposit, approval, and payment reminders
Status: Draft approved in conversation, awaiting user review of written spec

## 1. Goal

Build a phase-1 recurring booking feature that lets a user request a fixed sports field schedule for themselves, place a deposit for the whole series, and manage remaining payments over time.

This feature should support:

- dat san dinh ky theo tuan
- dat san dinh ky theo thang
- coc mot khoan chung cho ca chuoi
- xu ly trung lich bang khung thay the trong cung tuan
- owner duyet thu cong neu muc coc duoi 50 phan tram
- tu dong duyet neu da coc tu 50 phan tram tro len
- nhac thanh toan tung buoi khi con 5 ngay truoc ngay choi

## 2. Confirmed Direction

The feature follows these confirmed decisions:

- Recurring booking belongs to the user, not the owner
- Phase 1 supports `weekly` and `monthly` recurrence only
- User can define the series by:
  - `start_date + end_date`
  - or `occurrence_count`
- The system creates one parent series record and all child bookings immediately
- Deposit is a single amount for the whole series
- User enters the deposit amount manually
- Deposit must be:
  - at least `25%` of total series value
  - at most `100%` of total series value
- If deposit is `>= 50%`, the system auto-approves the series
- If deposit is from `25%` to under `50%`, the series requires owner approval
- In owner-review flow, owner can only:
  - approve
  - reject
- If a target slot is unavailable, the system suggests alternative day/time options within the same week
- User can:
  - accept suggested replacements
  - or cancel the entire recurring-booking request
- Each child booking has its own remaining balance and due date
- User can pay the remaining balance partially or fully over time
- If a child booking still has unpaid balance and is 5 days away, notify both user and owner

## 3. Recommended Approach

The chosen direction is `Simple recurring series with immediate child booking generation`.

Why this approach:

- It fits the current booking architecture best because each actual field usage already maps naturally to a booking record.
- It makes availability checking easier because the full series is evaluated before creation.
- It supports owner approval, deposit validation, and payment reminders without requiring a custom recurrence engine.
- It minimizes hidden behavior by generating concrete child bookings instead of storing only abstract repeat rules.

Approaches considered but not chosen:

- `Lazy generation over time`: lighter at creation time, but much harder for availability guarantees and due-date visibility
- `Rule-only recurrence storage`: too abstract for phase 1 and poorly aligned with current booking-based workflows
- `Advanced recurrence engine`: too large for this scope

## 4. Scope

### 4.1 In scope

- user-created recurring booking requests
- weekly recurrence
- monthly recurrence
- start/end date input
- occurrence-count input
- one series-level deposit
- auto approval when deposit is at least 50%
- owner review when deposit is between 25% and under 50%
- full child-booking generation at creation time
- alternative slot suggestion within the same week when conflicts appear
- remaining-balance tracking per child booking
- reminder notifications 5 days before due child bookings

### 4.2 Out of scope

- owner-created recurring series
- custom recurrence rules beyond weekly/monthly
- partial creation where some child bookings are skipped silently
- negotiation loops for deposit amount
- owner-edited deposit proposals
- edit-one-occurrence flows after the series has already been created
- full recurring-booking analytics or reporting suite

## 5. User Behavior

The user flow for phase 1 is:

1. User chooses a field and recurring-booking mode
2. User chooses weekly or monthly recurrence
3. User enters:
   - start date
   - end date or occurrence count
   - preferred day/time
   - deposit amount
4. System generates all intended occurrences
5. System checks availability of every occurrence
6. If conflicts exist, system suggests alternative slots in the same week
7. User either:
   - accepts the suggested replacements
   - or cancels the whole request
8. System validates the deposit amount against the total series value
9. System decides:
   - auto-approved if deposit is at least 50%
   - pending owner review if deposit is from 25% to under 50%
10. System creates:
    - the recurring series record
    - all child booking records
    - all recurring-item linkage records

## 6. Availability and Conflict Handling

### 6.1 What counts as a conflict

A recurring occurrence is considered conflicting when its target slot is no longer available because of:

- an existing booking
- a pending booking that is still holding the slot
- an unavailable schedule row
- another recurring series that has already reserved that slot

### 6.2 Conflict resolution rule

The system should not silently skip conflicting occurrences.

Instead:

- generate suggested replacement options
- keep replacement suggestions inside the same week
- allow both day and time to change

### 6.3 User decision rule

If any suggested replacement is not acceptable to the user, the user can cancel the entire recurring-booking creation flow.

The system should only commit the series when the full set of intended occurrences has been accepted.

## 7. Deposit and Approval Rules

### 7.1 Deposit range

The user-entered deposit amount must satisfy:

- `deposit_amount >= 25% of total_estimated_amount`
- `deposit_amount <= total_estimated_amount`

### 7.2 Approval split

- `deposit_amount >= 50% of total_estimated_amount`
  - recurring series is auto-approved
- `deposit_amount >= 25% and < 50%`
  - recurring series is created in owner-review state

### 7.3 Owner review powers

In phase 1, owner review is intentionally simple:

- approve
- reject

Owner cannot counter-propose a different deposit amount in this phase.

## 8. Payment Behavior After Creation

The deposit is one shared upfront amount for the series, but the remaining balance is tracked against each child booking.

### 8.1 Remaining payments

After the series is created:

- user may pay additional amounts partially
- or pay the remaining amount in full

### 8.2 Due dates

Each child booking has its own due date.

### 8.3 Reminder rule

If a child booking still has unpaid balance and is 5 days away from the play date, the system should notify:

- the user
- the owner

## 9. Data Design

Phase 1 should use a two-layer recurring structure:

### 9.1 Recurring series record

The parent series should store at least:

- `user_id`
- `field_id`
- `stadium_id`
- `recurrence_type`
- `start_date`
- `end_date`
- `occurrence_count`
- `preferred_day_of_week`
- `preferred_start_time`
- `preferred_end_time`
- `total_estimated_amount`
- `deposit_amount`
- `deposit_percent`
- `approval_status`
- `payment_status_summary`
- `created_by`
- timestamps

Suggested approval statuses:

- `pending_owner_review`
- `approved`
- `rejected`
- `cancelled`

### 9.2 Recurring item record

Each generated occurrence should store at least:

- `series_id`
- `booking_id`
- `scheduled_date`
- `start_time`
- `end_time`
- `base_price`
- `amount_paid`
- `remaining_amount`
- `payment_due_date`
- `item_status`
- `was_rescheduled`
- `original_date_time`
- timestamps

Suggested item statuses:

- `pending`
- `confirmed`
- `rejected`
- `cancelled`
- `completed`

### 9.3 Relationship to existing booking records

The current `booking` table remains the core operational record for each field session.

The recurring system should not replace booking.

Instead:

- recurring series acts as the parent manager
- each recurring occurrence still maps to one normal booking row

This preserves compatibility with current booking history, approval, notification, and payment logic.

## 10. System Flow

### 10.1 Creation flow

1. Accept recurring request input
2. Generate intended dates
3. Check each occurrence for conflicts
4. If conflicts exist, generate alternatives within the same week
5. Ask user to accept replacements or cancel
6. Validate deposit amount
7. Determine approval mode
8. Create recurring series
9. Create all child bookings
10. Create recurring-item rows
11. Send notifications to user and owner when relevant

### 10.2 Approval flow

For deposit under 50%:

1. Series is created as pending owner review
2. Owner receives a notification
3. Owner chooses approve or reject
4. System updates series and child item statuses accordingly

### 10.3 Reminder flow

For each child booking:

1. Detect unpaid remaining balance
2. Check whether current date is 5 days before play date
3. If true, send reminder notifications to both sides

## 11. UI Expectations

Phase 1 UI should include:

- user recurring-booking creation flow
- conflict-resolution step with replacement suggestions
- recurring-series summary before submission
- user-facing series status view
- owner-facing approve/reject view for series that need manual review

The UI does not need a complex calendar management studio in phase 1. It only needs enough clarity for creation, approval, and payment follow-up.

## 12. Success Criteria

The feature is successful when:

- users can create recurring weekly or monthly series for themselves
- the system can generate all child bookings immediately
- deposit validation follows the approved 25%-100% rule
- deposit at 50% or more auto-approves the series
- lower qualifying deposits route to owner review
- conflicts generate replacement suggestions within the same week
- users can cancel the entire flow if they reject replacements
- each child booking can track remaining balance and due date
- reminders are triggered 5 days before unpaid child bookings

## 13. Risks and Constraints

- Conflict suggestion logic can become complex if many occurrences are unavailable
- Immediate generation of all child bookings increases creation-time complexity but is still the simplest operational model for phase 1
- Payment reminder scheduling needs a reliable background execution path
- Because booking remains the core operational entity, recurring-series updates must stay consistent with child booking states
