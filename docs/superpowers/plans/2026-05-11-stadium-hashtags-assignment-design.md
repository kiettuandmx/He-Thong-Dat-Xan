# Design Document - Stadium Hashtags Assignment UI

## Overview
This design focuses on completing the Hashtag system by providing a user interface for Owners and Admins to assign hashtags to Stadiums. This categorization will allow users to filter stadiums by tags like #Quan12, #SanCoNhanTao, #GiamGia, etc.

## Goals
- Allow Owners and Admins to manage hashtags for each stadium easily.
- Reuse logic and UI components across different roles.
- Ensure data consistency between the UI and the database.

## Proposed Changes

### Backend Enhancements
- Ensure `GET /api/stadiums` and `GET /api/stadiums/:id` include the associated `Hashtags` in the response.

### Frontend Components

#### 1. [NEW] `src/components/StadiumHashtagModal.jsx`
A reusable modal component that:
- Receives `stadiumId` and `initialHashtags` as props.
- Fetches all available hashtags from `GET /api/hashtags`.
- Displays hashtags as a grid of checkboxes.
- Handles the `PUT /api/hashtags/stadium/:id/hashtags` request to update associations.

#### 2. [MODIFY] `src/pages/ManageStadiums.jsx` (Owner View)
- Add a "Hashtag" button to each stadium row in the table.
- Integrate `StadiumHashtagModal`.

#### 3. [MODIFY] `src/pages/AdminStadiums.jsx` (Admin View)
- Add a "Hashtag" button to each field/stadium card or row.
- Integrate `StadiumHashtagModal`.

## User Experience Flow
1. User (Admin/Owner) navigates to their stadium management page.
2. User clicks the **"Hashtag"** button next to a stadium.
3. A modal appears showing all available hashtags. Hashtags already assigned to this stadium are pre-checked.
4. User toggles checkboxes and clicks **"Save Changes"**.
5. A success toast appears, and the modal closes.

## Verification Plan
- **Manual Test:** Assign 2 hashtags to a stadium, refresh the page, open the modal again to verify they are still checked.
- **Backend Test:** Verify the `StadiumHashtags` table contains the correct mappings after saving.
