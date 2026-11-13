import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { formatDate } from '../../utils/dateUtils';
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const EmployeeAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { attendance } = useAppData();

  const employeeId = user?.employeeId || 'EMP002';
  const myRecords = attendance.filter(a => a.employeeId === employeeId);

  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Stats
  const presentDays = myRecords.filter(a => a.status === 'Present').length;
  const absentDays = myRecords.filter(a => a.status === 'Absent').length;
  const lateDays = myRecords.filter(a => a.status === 'Late').length;
  const halfDays = myRecords.filter(a => a.status === 'Half Day').length;
  const total = myRecords.length || 1;
  const attendanceRate = (((presentDays + lateDays + halfDays * 0.5) / total) * 100).toFixed(1);

  const filteredRecords = myRecords.filter(r => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Employee' }, { label: 'My Attendance' }]} />

      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Attendance Records</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          View daily check-in timestamps, working durations, and attendance status logs.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Present</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{presentDays}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Absent</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{absentDays}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Late</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{lateDays}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Half Days</span>
          <span className="text-2xl font-bold text-indigo-600 mt-1 block">{halfDays}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Rate</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{attendanceRate}%</span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Filter Status:</span>
        <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          {['All', 'Present', 'Late', 'Half Day', 'On Leave', 'Absent'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === st
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Check In</th>
                <th className="px-5 py-3.5">Check Out</th>
                <th className="px-5 py-3.5">Working Hours</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredRecords.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-semibold text-gray-900">{formatDate(item.date)}</td>
                  <td className="px-5 py-4 font-medium text-gray-800">{item.checkIn || '—'}</td>
                  <td className="px-5 py-4 font-medium text-gray-800">{item.checkOut || '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{item.workingHours || '—'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4 text-gray-400">{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

