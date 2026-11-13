import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { exportToCSV } from '../../utils/storageUtils';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Award,
  Clock,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { Employee } from '../../types';
import { getLeaveSummary } from '../../utils/leaveCalculations';

export const EmployeeManagementPage: React.FC = () => {
  const { employees, leaveBalances, attendance, leaveRequests, documents } = useAppData();
  const { success } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'balance' | 'history' | 'documents'>('overview');

  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleExportCSV = () => {
    const data = filteredEmployees.map(e => ({
      ID: e.id,
      Name: e.name,
      Email: e.email,
      Department: e.department,
      Designation: e.designation,
      JoiningDate: e.joiningDate,
      AnnualLeave: e.annualLeave,
      CarryForwardLeave: e.carryForwardLeave,
      LeaveTaken: e.leaveTaken,
      LeaveRemaining: e.leaveRemaining,
      AttendanceRate: `${e.attendancePercentage}%`,
      Status: e.status
    }));
    exportToCSV('Employees_Master_List', data);
    success('Employee directory exported as CSV.');
  };

  const selectedBalance = selectedEmployee ? leaveBalances[selectedEmployee.id] : null;
  const balanceSummary = selectedBalance ? getLeaveSummary(selectedBalance) : null;
  const employeeAttendance = selectedEmployee ? attendance.filter(a => a.employeeId === selectedEmployee.id) : [];
  const employeeRequests = selectedEmployee ? leaveRequests.filter(r => r.employeeId === selectedEmployee.id) : [];
  const employeeDocs = selectedEmployee ? documents.filter(d => d.employeeId === selectedEmployee.id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Employees' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage staff profiles, track individualized leave balances, and review attendance records.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs"
        >
          <Download className="w-4 h-4 mr-1.5 text-gray-500" />
          Export Employees CSV
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-blue-600 bg-gray-50/50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-gray-500 font-medium">Department:</span>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:border-blue-600"
          >
            {departments.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Designation</th>
                <th className="px-5 py-3.5 text-center">Annual Leave</th>
                <th className="px-5 py-3.5 text-center">Taken</th>
                <th className="px-5 py-3.5 text-center">Remaining</th>
                <th className="px-5 py-3.5 text-center">Carry-Forward</th>
                <th className="px-5 py-3.5 text-center">Attendance %</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-9 h-9 rounded-xl object-cover border border-gray-200"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block">{emp.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{emp.id} • {emp.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium">{emp.department}</td>
                  <td className="px-5 py-4 text-gray-500">{emp.designation}</td>
                  <td className="px-5 py-4 text-center font-semibold text-gray-800">{emp.annualLeave}d</td>
                  <td className="px-5 py-4 text-center font-bold text-blue-700">{emp.leaveTaken}d</td>
                  <td className="px-5 py-4 text-center font-bold text-emerald-600">{emp.leaveRemaining}d</td>
                  <td className="px-5 py-4 text-center text-gray-600">
                    {emp.carryForwardLeave > 0 ? (
                      <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200 text-[10px]">
                        +{emp.carryForwardLeave}d
                      </span>
                    ) : (
                      '0d'
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-gray-900">{emp.attendancePercentage}%</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setActiveTab('overview');
                      }}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Details Modal / Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedEmployee(null)}
            />

            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl border border-gray-100 p-6 sm:p-8 z-10 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between pb-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>
                      <StatusBadge status={selectedEmployee.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedEmployee.designation} • {selectedEmployee.department}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      ID: {selectedEmployee.id} | Joined: {selectedEmployee.joiningDate}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-2 border-b border-gray-100 py-3 text-xs font-semibold overflow-x-auto">
                {(['overview', 'attendance', 'balance', 'history', 'documents'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="py-4 overflow-y-auto flex-1">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-400 uppercase font-semibold">Email</span>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{selectedEmployee.email}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-400 uppercase font-semibold">Phone</span>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{selectedEmployee.phone}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[11px] text-gray-400 uppercase font-semibold">Attendance Rate</span>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">{selectedEmployee.attendancePercentage}%</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Emergency Contact & Address</h4>
                      <p className="text-xs text-gray-600"><b>Contact:</b> {selectedEmployee.emergencyContact || 'Not specified'}</p>
                      <p className="text-xs text-gray-600 mt-1"><b>Address:</b> {selectedEmployee.address || 'Not specified'}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'balance' && balanceSummary && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-gray-500 uppercase">Annual Policy</span>
                        <p className="text-xl font-bold text-blue-700 mt-1">{balanceSummary.annualAllocation}d</p>
                      </div>
                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                        <span className="text-[10px] text-gray-500 uppercase">Carry-Forward</span>
                        <p className="text-xl font-bold text-amber-700 mt-1">{balanceSummary.carryForwardAllocation}d</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-[10px] text-gray-500 uppercase">Total Taken</span>
                        <p className="text-xl font-bold text-gray-800 mt-1">{balanceSummary.totalTaken}d</p>
                        <span className="text-[10px] text-gray-400">({balanceSummary.currentYearTaken} Curr / {balanceSummary.carryForwardTaken} C/F)</span>
                      </div>
                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-gray-500 uppercase">Total Remaining</span>
                        <p className="text-xl font-bold text-emerald-700 mt-1">{balanceSummary.totalRemaining}d</p>
                        <span className="text-[10px] text-emerald-600 font-medium">({balanceSummary.currentYearRemaining} Curr / {balanceSummary.carryForwardRemaining} C/F)</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
                      💡 <b>Consumption Rule Verified:</b> Employees consume their 14 annual days first. Carry-forward days are preserved and only deducted when current-year allocation reaches zero.
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="space-y-2">
                    <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">In</th>
                            <th className="p-2.5">Out</th>
                            <th className="p-2.5">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {employeeAttendance.map(a => (
                            <tr key={a.id}>
                              <td className="p-2.5 font-medium">{a.date}</td>
                              <td className="p-2.5"><StatusBadge status={a.status} /></td>
                              <td className="p-2.5">{a.checkIn || '—'}</td>
                              <td className="p-2.5">{a.checkOut || '—'}</td>
                              <td className="p-2.5">{a.workingHours || '—'}</td>
                            </tr>
                          ))}
                          {employeeAttendance.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-400">No attendance logs available.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-2">
                    <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Dates</th>
                            <th className="p-2.5">Deduction</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {employeeRequests.map(r => (
                            <tr key={r.id}>
                              <td className="p-2.5 font-semibold text-gray-900">{r.leaveType}</td>
                              <td className="p-2.5 text-gray-600">{r.startDate} to {r.endDate}</td>
                              <td className="p-2.5 font-bold text-blue-700">{r.deductibleDays}d</td>
                              <td className="p-2.5"><StatusBadge status={r.status} /></td>
                            </tr>
                          ))}
                          {employeeRequests.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-400">No leave requests submitted yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-2">
                    {employeeDocs.map(d => (
                      <div key={d.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{d.title}</p>
                            <span className="text-[10px] text-gray-400">{d.fileName} • {d.fileSize}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600">{d.documentType}</span>
                      </div>
                    ))}
                    {employeeDocs.length === 0 && (
                      <p className="p-6 text-center text-xs text-gray-400">No documents on record for this employee.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

