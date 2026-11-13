import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { exportToCSV } from '../../utils/storageUtils';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { formatDate } from '../../utils/dateUtils';
import {
  History,
  Download,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export const LeaveHistoryPage: React.FC = () => {
  const { leaveRequests } = useAppData();
  const { success } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const leaveTypes = ['All', 'Annual Leave', 'Casual Leave', 'Sick Leave', 'Personal Leave', 'Unpaid Leave'];

  const filteredHistory = leaveRequests.filter(r => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || r.leaveType === selectedType;
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportCSV = () => {
    const rows = filteredHistory.map(r => ({
      RequestID: r.id,
      Employee: r.employeeName,
      Department: r.department,
      LeaveType: r.leaveType,
      StartDate: r.startDate,
      EndDate: r.endDate,
      CalendarDays: r.calendarDays,
      DeductibleDays: r.deductibleDays,
      WeeklyOffExcluded: r.weeklyOffDaysExcluded,
      Duration: r.durationType,
      HalfDaySession: r.halfDaySession || 'None',
      Status: r.status,
      Reason: r.reason,
      RequestedOn: r.requestDate,
      ReviewedBy: r.reviewedBy || 'N/A',
      RejectionReason: r.rejectionReason || ''
    }));
    exportToCSV('Enterprise_Leave_History', rows);
    success('Leave history exported successfully.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Leave History' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Enterprise Leave History</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Full audit log of all leave applications across the organization with status progressions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs"
        >
          <Download className="w-4 h-4 mr-1.5 text-gray-500" />
          Export History CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, ID, department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-blue-600 bg-gray-50/50"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:border-blue-600"
          >
            {leaveTypes.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Dates</th>
                <th className="px-5 py-3.5 text-center">Calendar Days</th>
                <th className="px-5 py-3.5 text-center">Deduction</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Review Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredHistory.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-4 font-mono font-bold text-gray-900">{req.id}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    <div>
                      <span>{req.employeeName}</span>
                      <span className="block text-[10px] text-gray-400 font-normal">{req.department}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">{req.leaveType}</span>
                    {req.halfDaySession && (
                      <span className="text-[10px] text-indigo-600 block">
                        ({req.halfDaySession} Half-Day)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatDate(req.startDate)} to {formatDate(req.endDate)}
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-gray-700">{req.calendarDays}d</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-blue-700">{req.deductibleDays}d</span>
                    {req.weeklyOffDaysExcluded > 0 && (
                      <span className="text-[10px] text-gray-400 block font-normal">
                        ({req.weeklyOffDaysExcluded} off day excluded)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 max-w-xs truncate text-gray-500" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {req.reviewedBy ? (
                      <div>
                        <span className="font-medium text-gray-700 block">{req.reviewedBy}</span>
                        {req.rejectionReason && (
                          <span className="text-[10px] text-rose-600 block truncate max-w-xs" title={req.rejectionReason}>
                            Reason: {req.rejectionReason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-400">
                    No leave history found matching the filters.
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

