import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  MapPin,
  Shield,
  Save,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Clock
} from 'lucide-react';
import { getLeaveSummary } from '../../utils/leaveCalculations';

export const EmployeeProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { employees, getEmployeeBalance, passwordRequests, requestPasswordChange } = useAppData();
  const { success, error } = useToast();

  const employeeId = user?.employeeId || 'EMP002';
  const employeeData = employees.find(e => e.id === employeeId);
  const balance = getEmployeeBalance(employeeId);
  const summary = getLeaveSummary(balance);

  const [phone, setPhone] = useState(employeeData?.phone || '+1 (555) 345-6789');
  const [llcName, setLlcName] = useState(employeeData?.llcName || 'Acme Solutions LLC');
  const [jobLocation, setJobLocation] = useState(employeeData?.jobLocation || 'California, US');
  const [emergency, setEmergency] = useState(employeeData?.emergencyContact || 'David Johnson (+1 555-876-5432)');

  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdReason, setPwdReason] = useState('');

  const myPendingPwdReq = passwordRequests.find(
    p => p.employeeId === employeeId && p.status === 'Pending'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Profile updated successfully.');
  };

  const handlePasswordRequest = (e: React.FormEvent) => {
    e.preventDefault();
    requestPasswordChange(
      employeeId,
      user?.name || employeeData?.name || 'Employee',
      user?.email || 'employee@demo.com',
      pwdReason
    );
    success('Password change request submitted! Admin will review and provide updated credentials.');
    setPwdModalOpen(false);
    setPwdReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'Employee' }, { label: 'My Profile' }]} />

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
        <img
          src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
          alt="Avatar"
          className="w-24 h-24 rounded-2xl object-cover border-4 border-blue-500 shadow-lg flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500 font-medium">
                {llcName} • {jobLocation}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Duty
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Employee ID</span>
              <span className="font-mono font-bold text-gray-900">{employeeId}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Annual Quota</span>
              <span className="font-bold text-blue-700">{summary.annualAllocation} Days</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Available Balance</span>
              <span className="font-bold text-emerald-600">{summary.totalRemaining} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-gray-900">Personal & Employment Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              disabled
              value={user?.email || 'employee@demo.com'}
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 text-gray-500 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">LLC Name</label>
            <input
              type="text"
              value={llcName}
              onChange={e => setLlcName(e.target.value)}
              placeholder="e.g. Acme Solutions LLC"
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">Job Location</label>
              <span className="text-[10px] text-gray-400 font-mono">
                {jobLocation.length}/15 chars
              </span>
            </div>
            <input
              type="text"
              maxLength={15}
              value={jobLocation}
              onChange={e => setJobLocation(e.target.value.slice(0, 15))}
              placeholder="Max 15 letters"
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Accepts up to 15 characters only.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">Emergency Contact Person & Phone</label>
            <input
              type="text"
              value={emergency}
              onChange={e => setEmergency(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="submit"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Profile Updates
          </button>
        </div>
      </form>

      {/* Account Security & Password Change Request Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center">
              <KeyRound className="w-4 h-4 text-blue-600 mr-2" />
              Account Security & Password
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              To maintain company compliance, direct password modifications are restricted. You can request a password change from your administrator.
            </p>
          </div>

          {myPendingPwdReq ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600 animate-pulse" />
              Pending Admin Review
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPwdModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
              Request Password Change
            </button>
          )}
        </div>

        {myPendingPwdReq && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Password Request #{myPendingPwdReq.id} Under Review</span>
              <span className="text-[11px] text-amber-700 block mt-0.5">
                Submitted on {myPendingPwdReq.requestedAt}. Reason: "{myPendingPwdReq.reason || 'None provided'}". Once approved by the administrator, your new temporary password will be available.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Password Request Modal */}
      {pwdModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setPwdModalOpen(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100 p-6 z-10 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Request Password Reset</h3>
                  <p className="text-xs text-gray-500">
                    Administrator authorization required for password changes.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordRequest} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Employee Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${user?.name} (${user?.email})`}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 text-gray-500 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Reason for Change (Optional)</label>
                  <textarea
                    rows={3}
                    value={pwdReason}
                    onChange={e => setPwdReason(e.target.value)}
                    placeholder="e.g. Periodic password update, suspected credential leak, new device..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-[11px] flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Upon review, the system administrator will issue a temporary password or approval notification.
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setPwdModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Send Request to Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

