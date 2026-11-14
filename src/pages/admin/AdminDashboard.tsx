import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { formatDate } from '../../utils/dateUtils';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Activity,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const AdminDashboard: React.FC = () => {
  const { employees, attendance, leaveRequests, activityLogs, approveLeave, rejectLeave } = useAppData();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 1. Dashboard statistics
  const totalEmployees = employees.length;
  const todayAttendance = attendance.filter(a => a.date === '2026-11-13');
  const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const absentToday = todayAttendance.filter(a => a.status === 'Absent').length;
  const onLeaveToday = todayAttendance.filter(a => a.status === 'On Leave').length;
  const pendingRequests = leaveRequests.filter(r => r.status === 'Pending').length;
  const totalApprovedLeaves = leaveRequests.filter(r => r.status === 'Approved').length;

  // 2. Charts Data
  // Chart A: Monthly Attendance Overview (Past 6 months simulation)
  const monthlyAttendanceData = [
    { month: 'Jun', Present: 96, Absent: 2, Leave: 2 },
    { month: 'Jul', Present: 94, Absent: 3, Leave: 3 },
    { month: 'Aug', Present: 97, Absent: 1, Leave: 2 },
    { month: 'Sep', Present: 93, Absent: 4, Leave: 3 },
    { month: 'Oct', Present: 95, Absent: 2, Leave: 3 },
    { month: 'Nov', Present: 96.5, Absent: 1.5, Leave: 2 }
  ];

  // Chart B: Leave Distribution by Type
  const leaveTypesMap: Record<string, number> = {};
  leaveRequests.forEach(req => {
    leaveTypesMap[req.leaveType] = (leaveTypesMap[req.leaveType] || 0) + req.deductibleDays;
  });
  const leaveTypeData = Object.keys(leaveTypesMap).map(name => ({
    name,
    value: Number(leaveTypesMap[name].toFixed(1))
  }));

  // Chart C: Approved vs Rejected Leaves
  const approvedCount = leaveRequests.filter(r => r.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'Rejected').length;
  const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;
  const leaveStatusData = [
    { name: 'Approved', count: approvedCount, fill: '#10B981' },
    { name: 'Pending', count: pendingCount, fill: '#F59E0B' },
    { name: 'Rejected', count: rejectedCount, fill: '#EF4444' }
  ];

  // Chart D: Employee Leave Utilization (top 5 taken)
  const employeeUtilizationData = employees.slice(0, 5).map(emp => ({
    name: emp.name.split(' ')[0],
    Taken: emp.leaveTaken,
    Remaining: emp.leaveRemaining
  }));

  // Actions
  const handleConfirmApproval = () => {
    if (!selectedRequest) return;
    const res = approveLeave(selectedRequest.id, 'System Admin');
    if (res.success) {
      success(res.message);
    } else {
      error(res.message);
    }
    setModalAction(null);
    setSelectedRequest(null);
  };

  const handleConfirmRejection = () => {
    if (!selectedRequest) return;
    const ok = rejectLeave(selectedRequest.id, rejectionReason, 'System Admin');
    if (ok) {
      success(`Leave request ${selectedRequest.id} rejected.`);
    } else {
      error('Failed to reject leave request.');
    }
    setModalAction(null);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest block mb-1">
            Overview & Operations
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Executive Attendance Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time tracking of team availability, leave utilization balances, approvals, and monthly workforce analytics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/leave-requests')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30 flex items-center space-x-1.5"
          >
            <span>Review Pending Requests</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Key Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Staff"
          value={totalEmployees}
          subtitle="Active directory"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          subtitle="On site & remote"
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={{ value: '3.2%', isPositive: true }}
        />
        <StatCard
          title="Absent Today"
          value={absentToday}
          subtitle="Unnotified"
          icon={UserX}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatCard
          title="On Leave Today"
          value={onLeaveToday}
          subtitle="Approved leaves"
          icon={CalendarDays}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          subtitle="Awaiting review"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Approved Leaves"
          value={totalApprovedLeaves}
          subtitle="Year to date"
          icon={CheckCircle2}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
        />
      </div>

      {/* Charts: Leave Utilization and Approved vs Rejected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Employee Leave Utilization</h3>
              <p className="text-xs text-gray-400">Days Taken vs Remaining (Key Employees)</p>
            </div>
            <span className="text-xs text-blue-600 font-medium">14 Days Annual Policy</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeUtilizationData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Taken" fill="#3B82F6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Remaining" fill="#10B981" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Request Resolution Rate</h3>
              <p className="text-xs text-gray-400">Approved vs Rejected vs Pending requests</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveStatusData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests Quick Action Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Pending Leave Approvals</h3>
            <p className="text-xs text-gray-400">Review requests that require immediate administrative decision</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            {pendingRequests} Action(s) Needed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">Employee Name</th>
                <th className="px-6 py-3.5">Leave Type</th>
                <th className="px-6 py-3.5">Date Range</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {leaveRequests
                .filter(r => r.status === 'Pending')
                .slice(0, 5)
                .map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {req.employeeName.charAt(0)}
                      </div>
                      <div>
                        <span>{req.employeeName}</span>
                        <span className="block text-[10px] text-gray-400 font-normal">{req.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{req.leaveType}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(req.startDate)} to {formatDate(req.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-blue-700">{req.deductibleDays} days</span>
                      {req.weeklyOffDaysExcluded > 0 && (
                        <span className="text-[10px] text-gray-400 block font-normal">
                          ({req.weeklyOffDaysExcluded} Sun excluded)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-gray-500" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setModalAction('approve');
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
                        title="Approve Leave"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setModalAction('reject');
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition"
                        title="Reject Leave"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              {pendingRequests === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No pending leave requests at this moment. All caught up!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Recent Enterprise Activity</h3>
          </div>
          <span className="text-xs text-gray-400">Real-time audit log</span>
        </div>

        <div className="space-y-3">
          {activityLogs.slice(0, 5).map(act => (
            <div
              key={act.id}
              className="flex items-start justify-between p-3.5 rounded-xl bg-gray-50/70 border border-gray-100"
            >
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900">{act.userName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({act.userRole})</span>
                    <span className="text-xs text-gray-700 font-semibold">• {act.action}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{act.details}</p>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 font-medium flex-shrink-0 ml-4">{act.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={modalAction === 'approve'}
        title="Approve Leave Request"
        message={`Are you sure you want to approve ${selectedRequest?.employeeName}'s leave from ${selectedRequest?.startDate} to ${selectedRequest?.endDate} (${selectedRequest?.deductibleDays} deductible days)? Leave balance will be deducted automatically (current-year first, carry-forward second).`}
        confirmLabel="Confirm Approval"
        variant="success"
        onConfirm={handleConfirmApproval}
        onCancel={() => {
          setModalAction(null);
          setSelectedRequest(null);
        }}
      />

      <ConfirmationModal
        isOpen={modalAction === 'reject'}
        title="Reject Leave Request"
        message={`Are you sure you want to reject the leave request for ${selectedRequest?.employeeName}? No leave balance will be deducted.`}
        confirmLabel="Reject Leave"
        variant="danger"
        onConfirm={handleConfirmRejection}
        onCancel={() => {
          setModalAction(null);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
      >
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-700 block mb-1">Rejection Reason</label>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="e.g. Critical project sprint milestone overlap..."
            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

