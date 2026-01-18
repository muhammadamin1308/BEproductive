# Personal Productivity App - Setup Guide

## Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or remotely)

## 1. Backend Setup

1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/beproductive?schema=public"
   GOOGLE_CLIENT_ID="your_google_client_id"
   JWT_SECRET="your_secret_key"
   PORT=3000
   ```
3. Initialize Database:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start Server:
   ```bash
   npm run dev
   ```

## 2. Frontend Setup

1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Create `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID="your_google_client_id"
   ```
3. Start Dev Server:
   ```bash
   npm run dev
   ```

## 3. How to Check Authentication

1. Open http://localhost:5173
2. You should see the **Login Page** (instead of the placeholders).
3. Click "Sign in with Google".
4. If configured correctly, you will be redirected to Google, then back to the app.
5. Upon success, you will see the **Today Page** (currently a placeholder).
