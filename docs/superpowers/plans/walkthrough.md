# Walkthrough - Stadium Hashtags Assignment

I have completed the implementation of the Hashtag Assignment system for Stadiums. Owners and Admins can now categorize their stadiums using the shared hashtag system.

## Changes Made

### Backend
- **`stadiumController.js`**: Refactored to use Sequelize models instead of raw SQL. This allows including associated `Hashtags` and `Locations` in all stadium responses (`getAll`, `getById`, `getOwnerStadiums`).

### Frontend
- **`StadiumHashtagModal.jsx`**: A new reusable component that allows selecting hashtags via checkboxes. It fetches all available tags and handles the update API call.
- **`ManageStadiums.jsx`**: Added a "Hashtag" button to the stadium table for Owners.
- **`AdminStadiums.jsx`**: Added a "Hashtag" button to the field cards for Admins, allowing them to manage the hashtags of the associated stadium area.

## Verification
- Verified the code structure and associations.
- The UI components are integrated and ready for use.
- Backend now correctly supports many-to-many relationships between Stadiums and Hashtags.

## How to use
1. Go to **Hashtag** menu in Admin and create some tags (e.g., #Quan12, #SanCo).
2. Go to **Quản lý Sân** (Admin) or **Khu Sân** (Owner).
3. Click the **Hashtag** button on any stadium.
4. Select the tags and click **Lưu thay đổi**.
