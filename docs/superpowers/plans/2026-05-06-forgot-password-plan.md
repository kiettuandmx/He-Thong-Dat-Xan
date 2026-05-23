# Forgot Password Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a secure "Forgot Password" and "Reset Password" workflow using database-backed tokens and email delivery via Nodemailer.

**Architecture:** We will add token fields to the `users` table via migration. We will build two backend endpoints (`/forgot-password` and `/reset-password/:token`). On the frontend, we will integrate the existing `ForgotPassword.jsx` page and create a new `ResetPassword.jsx` page.

**Tech Stack:** Node.js, Express, Sequelize, Nodemailer, React, Axios.

---

### Task 1: Add Token Fields to Database (Migration & Model)

**Files:**
- Create: `backend/migrations/20260506000002-add-reset-token-to-users.js`
- Modify: `backend/models/user.js`

**Step 1: Create Migration File**
Create `backend/migrations/20260506000002-add-reset-token-to-users.js`
```javascript
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'resetPasswordToken', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'resetPasswordExpire', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'resetPasswordToken');
    await queryInterface.removeColumn('users', 'resetPasswordExpire');
  }
};
```

**Step 2: Update User Model**
Modify `backend/models/user.js` to include the new fields.
```javascript
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpire: DataTypes.DATE,
```

**Step 3: Run Migration**
Run `npx sequelize-cli db:migrate` in the `backend` directory.

---

### Task 2: Install Nodemailer and Build Backend APIs

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/routes/authRoutes.js`
- Modify: `backend/controllers/authController.js`

**Step 1: Install Nodemailer**
Run `npm install nodemailer` in the `backend` directory.

**Step 2: Add Routes**
Modify `backend/routes/authRoutes.js`
```javascript
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password/:token', auth.resetPassword);
```

**Step 3: Implement Controllers**
Modify `backend/controllers/authController.js`
Add `forgotPassword` logic:
- Check if user exists.
- Generate random token with `crypto.randomBytes(20).toString('hex')`.
- Hash it with `crypto.createHash('sha256')`.
- Save hash and expiry to user.
- Send email using `nodemailer`.

Add `resetPassword` logic:
- Hash URL token and find user where token matches and expiry > Date.now().
- Hash new password using `bcryptjs` and save.
- Set tokens to null.

---

### Task 3: Build Frontend UI

**Files:**
- Modify: `frontend/src/pages/ForgotPassword.jsx`
- Create: `frontend/src/pages/ResetPassword.jsx`
- Modify: `frontend/src/App.jsx` (to add routes)

**Step 1: Update ForgotPassword.jsx**
Ensure Axios call uses `http://localhost:5000/api/auth/forgot-password`.

**Step 2: Create ResetPassword.jsx**
Create page with URL param `useParams()` to extract token. Form for new password. Call `POST /api/auth/reset-password/:token`. On success, navigate to `/login`.

**Step 3: Add Route**
Modify `App.jsx` to include `<Route path="/reset-password/:token" element={<ResetPassword />} />`.
