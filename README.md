# AttendFlow - Enterprise Attendance & Leave Management System

A modern, responsive, full-featured SaaS Attendance and Leave Management System built with **React**, **TypeScript**, **Tailwind CSS**, **React Router v6**, and **Recharts**.

The application operates completely on the frontend with mock data and persistent **LocalStorage**, designed with an enterprise-ready modular service layer for seamless future backend deployment on **Microsoft Azure** (Azure Static Web Apps, Azure Functions, Azure SQL, and Azure Blob Storage).

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173` (or the port Vite provides).

### 3. Production Build
```bash
npm run build
```

---

## 🔑 Demo Login Credentials

The system includes simulated role-based authentication with pre-configured demo test accounts:

### 👑 Administrator Portal
- **Email:** `admin@demo.com`
- **Password:** `admin123`
- **Role:** Administrator (Full control over staff directory, leave approvals, system configurations, and enterprise reporting)

### 👤 Employee Portal
- **Email:** `employee@demo.com`
- **Password:** `employee123`
- **Role:** Employee (Sarah Johnson - Self-service dashboard, leave applications, attendance records, document vault, and profile management)

---

## 💼 Core Business Rules & Calculations

### 1. 14 Annual Leave Days
- Every employee receives a baseline of **14 annual leave days** per year (configurable in Admin Settings).

### 2. Carry-Forward Leave & Consumption Priority
- Unused leave from the previous year is tracked separately as **Carry-Forward Leave**.
- **Priority Rule:** Employees consume their **Current-Year Leave FIRST**. Carry-forward balance is preserved and only consumed after the current-year balance reaches zero (0).

### 3. Half-Day Leave
- Full-day leaves deduct **1 day**.
- Half-day leaves (Morning / Afternoon) deduct exactly **0.5 days**.
- Decimal leave balances (e.g., 11.5 days, 2.5 days) are correctly calculated and formatted across all tables, cards, and charts.

### 4. Configurable Weekly Off Days & Weekend Exclusion
- **Sunday is the default weekly off day.** Saturday is considered a working day.
- Leave requests that span across weekends automatically exclude Sundays (e.g., Friday to Monday equals 4 calendar days, but **3 deductible leave days**).
- Multi-week leave calculations accurately exclude all configured weekly off days.
- Admin can configure additional weekly off days in **Admin Settings**.

### 5. Dynamic Utilization Progress Bars & Gradients
The employee dashboard features a large dynamic leave utilization progress bar with automated color gradient transitions:
- **0–40%:** `Green` (Low leave utilization)
- **41–65%:** `Blue` (Normal leave utilization)
- **66–85%:** `Orange` (High leave utilization)
- **86–100%:** `Red` (Critical / Near-exhaustion leave utilization)

---

## 🏛️ Application Architecture & Future Azure Deployment

The project follows a clean service-oriented architecture:
```
src/
├── components/          # Reusable UI components
│   ├── common/          # FileUpload, StatCards, StatusBadges, ConfirmationModals, Breadcrumbs
│   └── leave/           # LeaveProgressBar with dynamic gradient thresholds
├── context/             # AuthContext, AppDataContext, ToastContext
├── data/                # Initial realistic mock dataset (10 employees, attendance logs, requests)
├── layouts/             # AdminLayout & EmployeeLayout with collapsible dark navy sidebars
├── pages/
│   ├── auth/            # LoginPage with demo account presets
│   ├── admin/           # Dashboard, Employees, Attendance, Leave Requests, History, Reports, Documents, Settings
│   └── employee/        # Dashboard, My Attendance, Apply Leave, Leave History, Documents, Profile
├── routes/              # ProtectedRoute and role-based AppRoutes
├── services/mock/       # StorageService abstraction layer (LocalStorage backed)
├── types/               # TypeScript domain interfaces and types
└── utils/               # centralized leaveCalculations, dateUtils, storageUtils
```

### Azure Integration Readiness
- **AuthService:** Pre-structured for Microsoft Entra ID (Azure AD) or MSAL.
- **LeaveService / AttendanceService / EmployeeService:** Ready to be swapped with REST/GraphQL calls to **Azure Functions** backed by **Azure SQL Database**.
- **FileUpload Component & DocumentService:** Prepared for direct SAS URL uploads to **Azure Blob Storage**.
- **Configuration:** Environment variables template provided in [`.env.example`](.env.example).

