import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { exportToCSV } from '../../utils/storageUtils';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { formatDate } from '../../utils/dateUtils';
import {
  CalendarCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';
import { AttendanceStatus } from '../../types';

export const AttendanceManagementPage: React.FC = () => {
  const { attendance, employees } = useAppData();
  const { success } = useToast();

  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLlc, setSelectedLlc] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const llcList = ['All', ...Array.from(new Set(employees.map(e => e.llcName || 'Acme Solutions LLC')))];

  const filteredAttendance = attendance.filter(record => {
    const matchedEmp = employees.find(e => e.id === record.employeeId);
    const empLlc = matchedEmp?.llcName || 'Acme Solutions LLC';

    const matchesEmp =
      record.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || record.status === selectedStatus;
    const matchesLlc = selectedLlc === 'All' || empLlc === selectedLlc;
    const matchesDate = !selectedDate || record.date === selectedDate;
    return matchesEmp && matchesStatus && matchesLlc && matchesDate;
  });

  const handleExportCSV = () => {
    const rows = filteredAttendance.map(r => {
      const matchedEmp = employees.find(e => e.id === r.employeeId);
      return {
        ID: r.id,
        EmployeeID: r.employeeId,
        EmployeeName: r.employeeName,
        LLC: matchedEmp?.llcName || 'Acme Solutions LLC',
        Date: r.date,
        CheckIn: r.checkIn || 'N/A',
        CheckOut: r.checkOut || 'N/A',
        WorkingHours: r.workingHours || 'N/A',
        Status: r.status,
        Notes: r.notes || ''
      };
    });
    exportToCSV('Attendance_Records', rows);
    success('Attendance records exported successfully.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Attendance' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Enterprise Attendance</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor daily check-ins, punctuality, approved on-leave statuses, and work hours.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs"
        >
          <Download className="w-4 h-4 mr-1.5 text-gray-500" />
          Export Attendance CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchEmployee}
            onChange={e => setSearchEmployee(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-blue-600 bg-gray-50/50"
          />
        </div>

        <div>
          <select
            value={selectedLlc}
            onChange={e => setSelectedLlc(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:border-blue-600"
          >
              <option value="All">All LLCs</option>
            {
                llcList.filter(d => d !== 'All').map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))
              }
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">LLC Name</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Check-In</th>
                <th className="px-5 py-3.5">Check-Out</th>
                <th className="px-5 py-3.5">Working Hours</th>
                <th className="px-5 py-3.5">Attendance Status</th>
                <th className="px-5 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
                {
                  filteredAttendance.map(item => {
                    const matchedEmp = employees.find(e => e.id === item.employeeId);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          <div>
                            <span>{item.employeeName}</span>
                            <span className="block text-[10px] text-gray-400 font-mono font-normal">
                              {item.employeeId}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-600">{matchedEmp?.llcName || 'Acme Solutions LLC'}</td>
                        <td className="px-5 py-4 text-gray-600">{formatDate(item.date)}</td>
                        <td className="px-5 py-4 font-medium text-gray-900">{item.checkIn || '—'}</td>
                        <td className="px-5 py-4 font-medium text-gray-900">{item.checkOut || '—'}</td>
                        <td className="px-5 py-4 text-gray-600">{item.workingHours || '—'}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4 text-gray-400 max-w-xs truncate">
                          {item.notes || '—'}
                        </td>
                      </tr>
              );
              })}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                    No attendance records match the selected filter criteria.
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

