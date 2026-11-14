import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { LeaveProgressBar } from '../../components/leave/LeaveProgressBar';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { getLeaveSummary } from '../../utils/leaveCalculations';
import { formatDate } from '../../utils/dateUtils';
import {
  Calendar,
  Clock,
  CalendarCheck,
  CalendarX,
  FileText,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests, attendance, getEmployeeBalance } = useAppData();
  const navigate = useNavigate();

  const employeeId = user?.employeeId || 'EMP002';
  const balance = getEmployeeBalance(employeeId);
  const summary = getLeaveSummary(balance);

  // Filter employee data
  const myRequests = leaveRequests.filter(r => r.employeeId === employeeId);
  const myPendingRequests = myRequests.filter(r => r.status === 'Pending');
  const myAttendance = attendance.filter(a => a.employeeId === employeeId);

  // Calculate attendance summary
  const presentDays = myAttendance.filter(a => a.status === 'Present').length;
  const absentDays = myAttendance.filter(a => a.status === 'Absent').length;
  const lateDays = myAttendance.filter(a => a.status === 'Late').length;
  const totalLogged = myAttendance.length || 1;
  const attendanceRate = (((presentDays + lateDays) / totalLogged) * 100).toFixed(1);

  // Today's attendance
  const todayRecord = myAttendance.find(a => a.date === '2026-11-13');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Employee Self-Service Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Sarah Johnson'}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Employee ID: <span className="font-mono text-blue-300">{employeeId}</span>
          </p>
          <div className="mt-3 flex items-center space-x-3 text-xs text-slate-400">
            <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span className="flex items-center text-emerald-400 font-semibold">
              Today's Status: {todayRecord ? todayRecord.status : 'Present (09:00 AM)'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/employee/apply-leave')}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Leave Utilization Progress Bar Component */}
      <LeaveProgressBar balance={balance} />

      {/* 6 Leave Summary Cards */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Leave Balances & Allocations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block">Annual Allocation</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{summary.annualAllocation}d</span>
            <span className="text-[10px] text-gray-400">Standard 14 days baseline</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block">Current Year Rem.</span>
            <span className="text-2xl font-bold text-blue-700 mt-1 block">{summary.currentYearRemaining}d</span>
            <span className="text-[10px] text-gray-400">Consumed first</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block">Carry-Forward Rem.</span>
            <span className="text-2xl font-bold text-indigo-700 mt-1 block">{summary.carryForwardRemaining}d</span>
            <span className="text-[10px] text-gray-400">From prior year unused</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block">Total Leave Taken</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{summary.totalTaken}d</span>
            <span className="text-[10px] text-gray-400">{summary.currentYearTaken} Curr + {summary.carryForwardTaken} C/F</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block">Total Remaining</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{summary.totalRemaining}d</span>
            <span className="text-[10px] text-emerald-600 font-medium">Available balance</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block">Pending Leaves</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{myPendingRequests.length}</span>
            <span className="text-[10px] text-amber-600 font-medium">Awaiting approval</span>
          </div>
        </div>
      </div>

      {/* Attendance Summary Row */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Attendance Statistics</h3>
            <p className="text-xs text-gray-400">Recent check-in and punctuality summary</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {attendanceRate}% Punctuality Rate
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <span className="text-xs text-gray-500 block">Present Days</span>
            <span className="text-xl font-bold text-emerald-600">{presentDays}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <span className="text-xs text-gray-500 block">Absent Days</span>
            <span className="text-xl font-bold text-rose-600">{absentDays}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <span className="text-xs text-gray-500 block">Late Days</span>
            <span className="text-xl font-bold text-amber-600">{lateDays}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <span className="text-xs text-gray-500 block">Attendance Rate</span>
            <span className="text-xl font-bold text-blue-700">{attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">My Recent Leave Requests</h3>
            <p className="text-xs text-gray-400">Track status of your submitted applications</p>
          </div>
          <button
            onClick={() => navigate('/employee/leave-history')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Dates</th>
                <th className="px-5 py-3.5 text-center">Calendar Days</th>
                <th className="px-5 py-3.5 text-center">Deductible Days</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {myRequests.slice(0, 5).map(req => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-mono font-bold text-gray-900">{req.id}</td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-900">{req.leaveType}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatDate(req.startDate)} to {formatDate(req.endDate)}
                  </td>
                  <td className="px-5 py-4 text-center font-medium">{req.calendarDays}d</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-blue-700">{req.deductibleDays}d</span>
                    {req.weeklyOffDaysExcluded > 0 && (
                      <span className="text-[10px] text-gray-400 block font-normal">
                        ({req.weeklyOffDaysExcluded} off day excluded)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 max-w-xs truncate text-gray-500">{req.reason}</td>
                  <td className="px-5 py-4 text-right">
                    <StatusBadge status={req.status} />
                  </td>
                </tr>
              ))}
              {myRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    You have not submitted any leave requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

