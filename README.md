 # BEproductive Command Center

**BEproductive** is a personal productivity system designed with a high-performance "Command Center" aesthetic. It transforms the way you manage your day by combining task management, deep focus tools, long-term goal tracking, and weekly self-reflection into a single, cohesive interface.

Unlike standard to-do lists, BEproductive is built for "operators" who want to treat their productivity like a system—tracking metrics, optimizing efficiency, and executing tasks with precision.

## Key Features

### 1. Dashboard (The Command Center)
Your central hub for daily operations.
- **Active Processes**: Manage your daily tasks as a prioritized list of "active processes."
- **Terminal Input**: Quickly add new tasks using a command-line style interface for rapid entry.
- **Live Metrics**: Track real-time stats like tasks completed, total focus time, and daily efficiency percentages.

### 2. Focus Mode
A distraction-free environment for deep work.
- **Focus Timer**: A specialized Pomodoro-style timer to break work into manageable intervals (default 25 minutes).
- **Session Tracking**: Visual progress rings and session counters help you pace your energy throughout the day.
- **Strict Mode**: Designed to keep you locked in on the task at hand until the timer hits zero.

### 3. Goal Tracking
Bridge the gap between daily actions and long-term dreams.
- **Multi-Level Goals**: Set and track goals across different time horizons: Yearly, Quarterly, Monthly, and Weekly.
- **Visual Progress**: Monitor completion rates with progress bars and statistics.
- **Categorization**: Organize goals into key life areas (Personal, Career, Health, Skills) to ensure a balanced approach to growth.

### 4. Weekly Review
A dedicated system for continuous improvement.
- **Performance Analytics**: visualize your week with charts showing daily activity, completion rates, and focus zones.
- **Structured Reflection**: A guided journaling interface to record what went well, what to improve, and key accomplishments.
- **Historical Data**: Look back at previous weeks to spot patterns and optimize your future performance.

---

# Personal Productivity App - Technical Setup Guide

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
