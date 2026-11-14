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
  FileText,
  UserPlus,
  Mail,
  Copy,
  Check,
  Send,
  Building2,
  MapPin,
  KeyRound,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { Employee, EmployeeInvitation } from '../../types';
import { getLeaveSummary } from '../../utils/leaveCalculations';

export const EmployeeManagementPage: React.FC = () => {
  const {
    employees,
    leaveBalances,
    attendance,
    leaveRequests,
    documents,
    invitations,
    inviteEmployee,
    passwordRequests,
    approvePasswordChange,
    rejectPasswordChange
  } = useAppData();
  const { success, error } = useToast();

  const [topTab, setTopTab] = useState<'employees' | 'invitations' | 'passwords'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'balance' | 'history' | 'documents'>('overview');

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLlcName, setInviteLlcName] = useState('Acme Solutions LLC');
  const [inviteJobLocation, setInviteJobLocation] = useState('California, US');
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Password Approval Modal state
  const [tempPwdModalOpen, setTempPwdModalOpen] = useState(false);
  const [selectedPwdReqId, setSelectedPwdReqId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('Welcome@123');

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
      LLCName: e.llcName || 'Acme Solutions LLC',
      JobLocation: e.jobLocation || 'California, US',
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

  const generateInviteUrl = (inv: EmployeeInvitation) => {
    try {
      const payload = btoa(JSON.stringify({
        id: inv.id,
        name: inv.name,
        email: inv.email,
        llcName: inv.llcName,
        jobLocation: inv.jobLocation,
        role: inv.role,
        invitedAt: inv.invitedAt
      }));
      return `${window.location.origin}/register?token=${encodeURIComponent(inv.token)}&data=${encodeURIComponent(payload)}`;
    } catch {
      return `${window.location.origin}/register?token=${encodeURIComponent(inv.token)}`;
    }
  };

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      error('Name and email are required.');
      return;
    }
    const newInv = inviteEmployee({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      llcName: inviteLlcName.trim() || 'Acme Solutions LLC',
      jobLocation: inviteJobLocation.trim() || 'California, US',
      role: 'employee'
    });

    const fullUrl = generateInviteUrl(newInv);
    setCreatedInviteLink(fullUrl);
    success(`Invitation generated for ${newInv.name}! Share the link with them to register.`);
  };

  const handleCopyLink = (linkToCopy?: string) => {
    const text = linkToCopy || createdInviteLink;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    success('Invitation registration link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApprovePasswordConfirmed = () => {
    if (!selectedPwdReqId) return;
    const ok = approvePasswordChange(selectedPwdReqId, tempPassword);
    if (ok) {
      success(`Password change request approved! Temporary password is: ${tempPassword}`);
    } else {
      error('Failed to approve password request.');
    }
    setTempPwdModalOpen(false);
    setSelectedPwdReqId(null);
  };

  const handleRejectPassword = (reqId: string) => {
    rejectPasswordChange(reqId);
    success('Password request rejected.');
  };

  const pendingPwdCount = passwordRequests.filter(p => p.status === 'Pending').length;
  const pendingInvCount = invitations.filter(i => i.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Employees' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Staff & Access Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage employee directories, send self-registration invitations, and review authorized password change requests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setCreatedInviteLink('');
              setInviteModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/30 transition"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Invite Employee
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs"
          >
            <Download className="w-4 h-4 mr-1.5 text-gray-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200">
        <button
          onClick={() => setTopTab('employees')}
          className={`pb-3 px-3 text-xs font-bold transition-all relative ${
            topTab === 'employees'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Active Directory ({employees.length})
        </button>
        <button
          onClick={() => setTopTab('invitations')}
          className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center space-x-1.5 ${
            topTab === 'invitations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Invitations & Onboarding</span>
          {pendingInvCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px]">
              {pendingInvCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTopTab('passwords')}
          className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center space-x-1.5 ${
            topTab === 'passwords'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Password Change Requests</span>
          {pendingPwdCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] animate-pulse">
              {pendingPwdCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Active Directory Table */}
      {topTab === 'employees' && (
        <>
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
                    <th className="px-5 py-3.5">LLC Name</th>
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
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900 block">{emp.llcName || 'Acme Solutions LLC'}</span>
                        <span className="text-[10px] text-gray-400 block">{emp.jobLocation || 'HQ'}</span>
                      </td>
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
        </>
      )}

      {/* Tab 2: Invitations & Onboarding Table */}
      {topTab === 'invitations' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sent Invitations</h3>
              <p className="text-xs text-gray-500">Employees accept invitation links to set their own passwords and activate accounts.</p>
            </div>
            <button
              onClick={() => {
                setCreatedInviteLink('');
                setInviteModalOpen(true);
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              New Invitation
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Candidate Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Assigned LLC</th>
                  <th className="px-5 py-3.5">Job Location</th>
                  <th className="px-5 py-3.5">Invited On</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Registration Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {invitations.map(inv => {
                  const link = generateInviteUrl(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-4 font-bold text-gray-900">{inv.name}</td>
                      <td className="px-5 py-4 text-gray-600 font-mono">{inv.email}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{inv.llcName}</td>
                      <td className="px-5 py-4 text-gray-600">{inv.jobLocation}</td>
                      <td className="px-5 py-4 text-gray-500">{inv.invitedAt}</td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Registered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inv.status === 'Registered' ? 'Registered' : 'Invite Sent (Pending)'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {inv.status === 'Pending' ? (
                          <button
                            onClick={() => handleCopyLink(link)}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy Link
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Active Member</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {invitations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No invitations generated yet. Click "Invite Employee" to invite a team member.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Password Change Requests Table */}
      {topTab === 'passwords' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Password Change Requests</h3>
            <p className="text-xs text-gray-500">
              Employees submit requests to update passwords. Administrators must authorize requests and issue temporary passwords.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Request ID</th>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Requested At</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {passwordRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{req.id}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{req.employeeName}</td>
                    <td className="px-5 py-4 text-gray-600 font-mono">{req.email}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate" title={req.reason}>
                      {req.reason || 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{req.requestedAt}</td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {req.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedPwdReqId(req.id);
                              setTempPassword('Welcome@123');
                              setTempPwdModalOpen(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve & Reset
                          </button>
                          <button
                            onClick={() => handleRejectPassword(req.id)}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          {req.tempPassword ? `Issued: ${req.tempPassword}` : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {passwordRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No password reset requests pending.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Invite Employee Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setInviteModalOpen(false)}
            />
            <div className="relative w-full max-w-lg rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100 p-6 z-10 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Invite Employee to Portal</h3>
                  <p className="text-xs text-gray-500">
                    Generate an onboarding link. The employee will register their account and set their own password.
                  </p>
                </div>
              </div>

              {!createdInviteLink ? (
                <form onSubmit={handleCreateInvite} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Employee Full Name</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      placeholder="e.g. Michael Chen"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Official / Corporate Email</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="mchen@company.com"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">LLC Name</label>
                      <input
                        type="text"
                        value={inviteLlcName}
                        onChange={e => setInviteLlcName(e.target.value)}
                        placeholder="Acme Solutions LLC"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Job Location (Max 15)</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={inviteJobLocation}
                        onChange={e => setInviteJobLocation(e.target.value.slice(0, 15))}
                        placeholder="California, US"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setInviteModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      Generate Invitation Link
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs">
                    <p className="font-bold">✓ Invitation created for {inviteName}!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Share this personalized registration link with {inviteEmail}. They can set up their password and log in immediately.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Registration Link</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={createdInviteLink}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 text-gray-700 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink()}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center flex-shrink-0"
                      >
                        {copiedLink ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copiedLink ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setInviteModalOpen(false);
                        setCreatedInviteLink('');
                        setInviteName('');
                        setInviteEmail('');
                      }}
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Approval Modal */}
      {tempPwdModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setTempPwdModalOpen(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100 p-6 z-10 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Authorize Password Reset</h3>
                  <p className="text-xs text-gray-500">
                    Issue a temporary password for this employee request ({selectedPwdReqId}).
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-blue-600"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    The employee will use this temporary password to sign in.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setTempPwdModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApprovePasswordConfirmed}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                  >
                    Approve & Issue Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

