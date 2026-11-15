import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import {
  Settings,
  RotateCcw,
  Save,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Server
} from 'lucide-react';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const AdminSettingsPage: React.FC = () => {
  const { settings, updateSettings, resetDemoData } = useAppData();
  const { success } = useToast();

  const [annualAllocation, setAnnualAllocation] = useState(settings.annualLeaveAllocation);
  const [carryForwardEnabled, setCarryForwardEnabled] = useState(settings.carryForwardEnabled);
  const [carryForwardExpiry, setCarryForwardExpiry] = useState(settings.carryForwardExpiry);
  const [requireLeaveReason, setRequireLeaveReason] = useState(settings.requireLeaveReason);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      annualLeaveAllocation: Number(annualAllocation),
      carryForwardEnabled,
      carryForwardExpiry,
      requireLeaveReason
    });
    success('System configuration saved and persisted to LocalStorage.');
  };

  const handleResetConfirmed = () => {
    resetDemoData();
    setConfirmResetOpen(false);
    success('Demo dataset successfully restored to original mock baseline.');
    setAnnualAllocation(14);
    setCarryForwardEnabled(true);
    setCarryForwardExpiry('None');
    setRequireLeaveReason(true);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Settings' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">System & Leave Policies</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure global annual leave allocations, carry-forward behavior, and demo reset.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reset Demo Data
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Policy Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Annual Leave Policy</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Default Annual Leave Allocation (Days / Year)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={annualAllocation}
                onChange={e => setAnnualAllocation(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 font-bold"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Standard baseline policy is set to 14 days per employee per year.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Carry-Forward Expiry Policy
              </label>
              <select
                value={carryForwardExpiry}
                onChange={e => setCarryForwardExpiry(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 bg-gray-50"
              >
                <option value="None">None (Does not expire automatically in demo)</option>
                <option value="3 Months">Expire after Q1 (3 Months)</option>
                <option value="6 Months">Expire mid-year (6 Months)</option>
                <option value="Year End">Expire at year end</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Carry-forward remains protected and consumed only after current-year reaches 0.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Leave Policies & Features</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Carry-Forward Mechanism</span>
                <span className="text-[11px] text-gray-500">Allow unused leave from prior year to roll forward</span>
              </div>
              <input
                type="checkbox"
                checked={carryForwardEnabled}
                onChange={e => setCarryForwardEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Mandatory Reason for Leave</span>
                <span className="text-[11px] text-gray-500">Require employees to specify context in the request</span>
              </div>
              <input
                type="checkbox"
                checked={requireLeaveReason}
                onChange={e => setRequireLeaveReason(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Future Azure Integration Readiness Card */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-2">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-bold">Microsoft Azure Backend Readiness Architecture</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The frontend has been built with an abstracted modular service layer (AuthService, EmployeeService, LeaveService, AttendanceService, DocumentService). When ready for Azure deployment, switch mock services to REST/GraphQL endpoints connecting to Azure Static Web Apps, Azure Functions, Azure SQL, and Azure Blob Storage seamlessly.
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
          >
            <Save className="w-4 h-4 mr-2" />
            Save System Policies
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmResetOpen}
        title="Reset Demo Dataset"
        message="This will reset all employees, leave balances, leave requests, attendance history, documents, and settings to the initial clean mock dataset. All local testing changes will be refreshed."
        confirmLabel="Reset Everything"
        variant="danger"
        onConfirm={handleResetConfirmed}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};

