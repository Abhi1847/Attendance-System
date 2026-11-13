import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

// Admin Pages & Layout
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { EmployeeManagementPage } from '../pages/admin/EmployeeManagementPage';
import { AttendanceManagementPage } from '../pages/admin/AttendanceManagementPage';
import { LeaveManagementPage } from '../pages/admin/LeaveManagementPage';
import { LeaveHistoryPage } from '../pages/admin/LeaveHistoryPage';
import { LeaveReportsPage } from '../pages/admin/LeaveReportsPage';
import { AdminDocumentsPage } from '../pages/admin/AdminDocumentsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

// Employee Pages & Layout
import { EmployeeLayout } from '../layouts/EmployeeLayout';
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard';
import { EmployeeAttendancePage } from '../pages/employee/EmployeeAttendancePage';
import { ApplyLeavePage } from '../pages/employee/ApplyLeavePage';
import { EmployeeLeaveHistoryPage } from '../pages/employee/EmployeeLeaveHistoryPage';
import { EmployeeDocumentsPage } from '../pages/employee/EmployeeDocumentsPage';
import { EmployeeProfilePage } from '../pages/employee/EmployeeProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Panel Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<EmployeeManagementPage />} />
        <Route path="attendance" element={<AttendanceManagementPage />} />
        <Route path="leave-requests" element={<LeaveManagementPage />} />
        <Route path="leave-history" element={<LeaveHistoryPage />} />
        <Route path="reports" element={<LeaveReportsPage />} />
        <Route path="documents" element={<AdminDocumentsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Employee Panel Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRole="employee">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="attendance" element={<EmployeeAttendancePage />} />
        <Route path="apply-leave" element={<ApplyLeavePage />} />
        <Route path="leave-history" element={<EmployeeLeaveHistoryPage />} />
        <Route path="documents" element={<EmployeeDocumentsPage />} />
        <Route path="profile" element={<EmployeeProfilePage />} />
      </Route>

      {/* Default redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

