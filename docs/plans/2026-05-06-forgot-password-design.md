# Password Reset Feature Design

## Overview
This document outlines the design for the "Forgot Password" and "Reset Password" workflows across all user roles in the system. The system will use a secure, database-backed single-use token sent via email (SMTP).

## Architecture & Data Flow

### 1. Database Modifications
- **Table**: `users`
- **New Columns**:
  - `resetPasswordToken` (String, nullable): Stores the hashed version of the reset token.
  - `resetPasswordExpire` (Date, nullable): Stores the expiration timestamp (15 minutes from generation).

### 2. Backend APIs
#### POST `/api/auth/forgot-password`
- **Input**: `email`
- **Process**:
  1. Verify user exists.
  2. Generate a random 20-byte hex token using Node's built-in `crypto` module.
  3. Hash the token and save it to `resetPasswordToken`, set `resetPasswordExpire` to `Date.now() + 15 mins`.
  4. Construct the reset URL: `http://localhost:5173/reset-password/:unhashed_token`.
  5. Use `nodemailer` with Gmail SMTP to send an email to the user containing the link.
- **Output**: Success message ("Email sent").

#### POST `/api/auth/reset-password/:token`
- **Input**: `token` (from URL), `newPassword`
- **Process**:
  1. Hash the incoming `token` and search the `users` table for a match where `resetPasswordExpire` > `Date.now()`.
  2. If found, hash the `newPassword` using `bcrypt` and update the user's password.
  3. Security critical: Set `resetPasswordToken` and `resetPasswordExpire` back to `null` to ensure the token cannot be reused.
- **Output**: Success message ("Password reset successful").

### 3. Frontend Architecture
- **Dependencies**: React, Axios, React Router.
- **Pages**:
  - `ForgotPassword.jsx`: Contains a form to input the email. Calls `/api/auth/forgot-password` and displays a confirmation message.
  - `ResetPassword.jsx`: New component. Extracts the token from the URL params. Contains a form with "New Password" and "Confirm Password". Submits to `/api/auth/reset-password/:token` and redirects to `/login` upon success.
