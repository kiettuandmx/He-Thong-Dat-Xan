# Weekly Recurring Booking With Per-Occurrence Exceptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp recurring booking theo tuần để user có thể đặt theo thứ trong tuần, lặp mỗi N tuần, review danh sách các tuần sẽ đặt, và chỉnh riêng từng tuần như một ngoại lệ của cùng chuỗi.

**Architecture:** Giữ `RecurringBookingSeries` là rule gốc và `RecurringBookingItem` là từng occurrence. Bổ sung các trường rule mới ở cấp series (`weekday`, `repeat_interval_weeks`) và các cờ trạng thái ngoại lệ ở cấp item (`is_exception`, `is_skipped`, `sequence_number`). Backend sẽ trở thành nguồn sự thật cho việc sinh occurrence và áp override; frontend chỉ thu rule, hiển thị preview, và gửi `occurrence_overrides`.

**Tech Stack:** Node.js, Express, Sequelize, MySQL, React, Axios, Vitest, Node test runner

---

## File structure

### Backend

**Modify**
- `backend/models/recurringbookingseries.js`
  - Bổ sung các trường rule mới cho chuỗi recurring.
- `backend/models/recurringbookingitem.js`
  - Bổ sung cờ ngoại lệ, skip, và sequence number.
- `backend/utils/recurringBookingTypes.js`
  - Chuẩn hóa enum/status nếu cần cho skip/exception.
- `backend/utils/recurringBookingService.js`
  - Nâng cấp builder weekly occurrence, preview, create, validate, conflict detection.
- `backend/controllers/recurringBookingController.js`
  - Nhận payload mới và trả dữ liệu preview/create mới.
- `backend/routes/recurringBookingRoutes.js`
  - Chỉ chỉnh nếu cần validate/shape mới ở route layer.
- `backend/tests/recurringBookingService.test.js`
  - TDD cho logic sinh weekly interval, override, skip, exception.
- `backend/tests/recurringBookingController.test.js`
  - Test request/response cho preview/create với payload mới.

**Create**
- `backend/migrations/20260605000001-add-weekly-exception-columns-to-recurring-series.js`
  - Thêm `weekday`, `repeat_interval_weeks`.
- `backend/migrations/20260605000002-add-exception-flags-to-recurring-items.js`
  - Thêm `is_exception`, `is_skipped`, `sequence_number`.

### Frontend

**Modify**
- `frontend/src/pages/RecurringBookingPage.jsx`
  - Thêm form `weekday`, `repeat_interval_weeks`, UI review occurrence, và editor override từng tuần.
- `frontend/src/services/recurringBookingService.js`
  - Gửi payload mới và nhận preview/create shape mới.
- `frontend/src/test/recurring-booking-page.test.jsx`
  - TDD cho form mới và payload override.

**Optional later if needed**
- `frontend/src/components/` (nếu tách review list riêng)
  - Chỉ tạo nếu `RecurringBookingPage.jsx` phình quá mức.

### Docs

**Already created**
- `docs/superpowers/specs/2026-06-05-weekly-recurring-exceptions-design.md`

---

## Task 1: Lock the new data contract in tests

**Files:**
- Modify: `backend/tests/recurringBookingService.test.js`
- Modify: `backend/tests/recurringBookingController.test.js`
- Modify: `frontend/src/test/recurring-booking-page.test.jsx`

**Steps:**
- [ ] Add a failing backend service test for weekly recurring with `repeat_interval_weeks = 2`.
- [ ] Add a failing backend service test that marks an occurrence as `is_exception` when its day changes.
- [ ] Add a failing backend service test that marks an occurrence as `is_exception` when its time changes.
- [ ] Add a failing backend service test that marks an occurrence as `is_skipped` when a week is skipped.
- [ ] Add a failing backend controller test for preview payload containing `weekday`, `repeat_interval_weeks`, and `occurrence_overrides`.
- [ ] Add a failing backend controller test for create payload containing one skipped occurrence and one edited occurrence.
- [ ] Add a failing frontend test that verifies the form renders `thứ trong tuần`.
- [ ] Add a failing frontend test that verifies the form renders `lặp lại mỗi ... tuần`.
- [ ] Add a failing frontend test that verifies review rows can emit override payload for one occurrence.
- [ ] Run the targeted tests and confirm they fail for the expected reasons.
- [ ] Commit: `test: lock weekly recurring exception behavior`

---

## Task 2: Add database columns for weekly interval and exceptions

**Files:**
- Create: `backend/migrations/20260605000001-add-weekly-exception-columns-to-recurring-series.js`
- Create: `backend/migrations/20260605000002-add-exception-flags-to-recurring-items.js`
- Modify: `backend/models/recurringbookingseries.js`
- Modify: `backend/models/recurringbookingitem.js`

**Steps:**
- [ ] Create a migration adding `weekday` and `repeat_interval_weeks` to recurring series with safe defaults.
- [ ] Create a migration adding `is_exception`, `is_skipped`, and `sequence_number` to recurring items.
- [ ] Update `RecurringBookingSeries` model to expose the new fields.
- [ ] Update `RecurringBookingItem` model to expose the new fields.
- [ ] Make sure migration code is idempotent enough for this repo’s existing DB drift patterns.
- [ ] Run migrations locally.
- [ ] Run model-related tests or service tests to make sure schema changes load correctly.
- [ ] Commit: `feat: add recurring weekly exception schema`

---

## Task 3: Upgrade weekly occurrence generation in the service layer

**Files:**
- Modify: `backend/utils/recurringBookingService.js`
- Modify: `backend/utils/recurringBookingTypes.js`
- Modify: `backend/tests/recurringBookingService.test.js`

**Steps:**
- [ ] Refactor weekly occurrence generation to accept `weekday`.
- [ ] Add support for `repeat_interval_weeks` to advance occurrences by `7 * interval` days.
- [ ] Ensure `occurrence_count` still works with the new interval logic.
- [ ] Ensure `end_date` still works with the new interval logic.
- [ ] Keep existing monthly recurring behavior untouched.
- [ ] Run recurring service tests and make sure only the intended weekly path changes.
- [ ] Commit: `feat: support repeat-every-n-weeks recurring generation`

---

## Task 4: Apply per-occurrence overrides in preview and create

**Files:**
- Modify: `backend/utils/recurringBookingService.js`
- Modify: `backend/tests/recurringBookingService.test.js`

**Steps:**
- [ ] Define a normalized `occurrence_overrides` shape in the service layer.
- [ ] Add logic to match overrides by `sequence_number`.
- [ ] Apply override date/time changes during preview generation.
- [ ] Apply skip behavior during preview generation.
- [ ] Mark changed rows as `is_exception = true`.
- [ ] Mark skipped rows as `is_skipped = true`.
- [ ] Ensure unchanged rows stay as normal occurrences.
- [ ] Re-run service tests and confirm preview behavior is correct.
- [ ] Commit: `feat: apply per-occurrence recurring overrides`

---

## Task 5: Persist exceptions and skipped weeks on create

**Files:**
- Modify: `backend/utils/recurringBookingService.js`
- Modify: `backend/tests/recurringBookingService.test.js`

**Steps:**
- [ ] Update series creation to save `weekday` and `repeat_interval_weeks`.
- [ ] Update recurring item creation to save `sequence_number`.
- [ ] Save `is_exception` for changed occurrences.
- [ ] Save `is_skipped` for skipped occurrences.
- [ ] Decide the item status used for skipped rows and keep it consistent with the existing enum model.
- [ ] Ensure skipped rows do not accidentally create active booking obligations.
- [ ] Run recurring service tests again.
- [ ] Commit: `feat: persist recurring booking exceptions`

---

## Task 6: Validate conflicts and guardrails at occurrence level

**Files:**
- Modify: `backend/utils/recurringBookingService.js`
- Modify: `backend/tests/recurringBookingService.test.js`

**Steps:**
- [ ] Make conflict detection run on the final overridden occurrence date/time, not only on the base rule.
- [ ] Ensure skipped rows are excluded from conflict validation that would otherwise block the series.
- [ ] Return enough preview metadata to identify which sequence row has a conflict.
- [ ] Keep validation errors understandable for the frontend.
- [ ] Re-run recurring service tests with conflict scenarios.
- [ ] Commit: `fix: validate recurring conflicts after overrides`

---

## Task 7: Update controller payload handling

**Files:**
- Modify: `backend/controllers/recurringBookingController.js`
- Modify: `backend/routes/recurringBookingRoutes.js`
- Modify: `backend/tests/recurringBookingController.test.js`

**Steps:**
- [ ] Accept `weekday` in preview requests.
- [ ] Accept `repeat_interval_weeks` in preview requests.
- [ ] Accept `occurrence_overrides` in preview requests.
- [ ] Accept the same fields in create requests.
- [ ] Ensure controller passes the new payload to the service without mangling types.
- [ ] Keep backward-compatible defaults where possible for older requests.
- [ ] Run recurring controller tests.
- [ ] Commit: `feat: accept weekly recurring exception payloads`

---

## Task 8: Extend recurring booking form for weekday and interval

**Files:**
- Modify: `frontend/src/pages/RecurringBookingPage.jsx`
- Modify: `frontend/src/test/recurring-booking-page.test.jsx`

**Steps:**
- [ ] Add a field for `thứ trong tuần`.
- [ ] Add a numeric input for `lặp lại mỗi ... tuần`.
- [ ] Add these values into the preview/create request payload.
- [ ] Preserve existing fields for deposit, payment method, and count/end-date.
- [ ] Run the recurring page tests and confirm the new payload is sent.
- [ ] Commit: `feat: add weekly recurring interval inputs`

---

## Task 9: Build the review UI for per-occurrence editing

**Files:**
- Modify: `frontend/src/pages/RecurringBookingPage.jsx`
- Modify: `frontend/src/test/recurring-booking-page.test.jsx`

**Steps:**
- [ ] Render preview occurrences as a list or table with `sequence`, `date`, `weekday`, `time`, and `status`.
- [ ] Add UI controls for changing the date of one occurrence.
- [ ] Add UI controls for changing the time of one occurrence.
- [ ] Add UI control for skipping one occurrence.
- [ ] Add a reset action for restoring one occurrence back to the base rule.
- [ ] Show a badge for `Ngoại lệ`.
- [ ] Show a badge for `Bỏ qua`.
- [ ] Keep the override state in a frontend `occurrence_overrides` array keyed by `sequence_number`.
- [ ] Run frontend tests for editing and skipping one row.
- [ ] Commit: `feat: add recurring occurrence review editor`

---

## Task 10: Wire create flow with reviewed overrides

**Files:**
- Modify: `frontend/src/pages/RecurringBookingPage.jsx`
- Modify: `frontend/src/services/recurringBookingService.js`
- Modify: `frontend/src/test/recurring-booking-page.test.jsx`

**Steps:**
- [ ] Send the reviewed overrides in the final create request.
- [ ] Reset preview/editor state cleanly after successful create.
- [ ] Ensure success messaging still reflects auto-approve vs owner review.
- [ ] Ensure failure messaging still reflects conflict or validation errors.
- [ ] Run frontend tests for preview then create with overrides.
- [ ] Commit: `feat: create recurring series from reviewed overrides`

---

## Task 11: End-to-end verification

**Files:**
- Modify: `RUN_PROJECT.md` only if the manual verification flow needs documenting.

**Steps:**
- [ ] Run `node --test backend/tests/recurringBookingService.test.js`.
- [ ] Run `node --test backend/tests/recurringBookingController.test.js`.
- [ ] Run `npm test -- src/test/recurring-booking-page.test.jsx`.
- [ ] Run `npm run build` in `frontend`.
- [ ] Manually verify one weekly series with `repeat_interval_weeks = 1`.
- [ ] Manually verify one weekly series with `repeat_interval_weeks = 2`.
- [ ] Manually verify one occurrence edited to another day.
- [ ] Manually verify one occurrence edited to another hour.
- [ ] Manually verify one skipped occurrence.
- [ ] Confirm saved rows still belong to the same series in DB or owner view.
- [ ] Commit: `test: verify weekly recurring exceptions flow`

---

## Manual QA checklist

- [ ] User can choose a weekday.
- [ ] User can enter “repeat every 2 weeks”.
- [ ] Preview shows the correct set of future occurrences.
- [ ] One occurrence can be changed to another date.
- [ ] One occurrence can be changed to another time slot.
- [ ] One occurrence can be skipped.
- [ ] Edited rows are clearly labeled as exceptions.
- [ ] Skipped rows are clearly labeled as skipped.
- [ ] Final create request respects reviewed overrides.
- [ ] Existing monthly recurring flow still works.

---

## Risks and notes

- The project already has recurring infrastructure, so avoid rewriting the whole flow.
- The biggest risk is mixing “base rule” logic with “final occurrence” logic and validating the wrong one.
- Skip behavior must not accidentally generate real playable bookings later in the pipeline.
- If `RecurringBookingPage.jsx` becomes too large while adding the review editor, split the review list into a small local component in a follow-up commit rather than forcing a large rewrite up front.
