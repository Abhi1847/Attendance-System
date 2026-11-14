import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { FileUpload } from '../../components/common/FileUpload';
import {
  calculateLeaveDays,
  calculateDeductionConsumption,
  getLeaveSummary,
  checkOverlappingLeave
} from '../../utils/leaveCalculations';
import { LeaveType, LeaveDurationType } from '../../types';
import {
  CalendarPlus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Send,
  Info
} from 'lucide-react';

export const ApplyLeavePage: React.FC = () => {
  const { user } = useAuth();
  const { settings, leaveRequests, getEmployeeBalance, createLeaveRequest } = useAppData();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const employeeId = user?.employeeId || 'EMP002';
  const balance = getEmployeeBalance(employeeId);
  const balanceSummary = getLeaveSummary(balance);

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);

  // Calculations Memo
  const calculation = useMemo(() => {
    return calculateLeaveDays(startDate, endDate, settings.weeklyOffDays);
  }, [startDate, endDate, settings.weeklyOffDays]);

  // Projected Balance & Deductions Memo
  const projected = useMemo(() => {
    if (!calculation.isValid || calculation.deductibleDays <= 0) {
      return {
        isPossible: true,
        projectedRemaining: balanceSummary.totalRemaining,
        fromCurrent: 0,
        fromCarryForward: 0
      };
    }

    if (leaveType === 'Unpaid Leave') {
      return {
        isPossible: true,
        projectedRemaining: balanceSummary.totalRemaining,
        fromCurrent: 0,
        fromCarryForward: 0
      };
    }

    const consumption = calculateDeductionConsumption(balance, calculation.deductibleDays);
    return {
      isPossible: consumption.isPossible,
      projectedRemaining: (balanceSummary.annualAllocation - consumption.newCurrentYearTaken) +
        (balanceSummary.carryForwardAllocation - consumption.newCarryForwardTaken),
      fromCurrent: consumption.fromCurrentYear,
      fromCarryForward: consumption.fromCarryForward
    };
  }, [calculation, balance, balanceSummary, leaveType]);

  // Overlapping Validation Memo
  const hasOverlap = useMemo(() => {
    if (!startDate || !endDate) return false;
    const myExisting = leaveRequests.filter(r => r.employeeId === employeeId);
    return checkOverlappingLeave(startDate, endDate, myExisting);
  }, [startDate, endDate, leaveRequests, employeeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      error('Please select both start and end dates.');
      return;
    }

    if (!calculation.isValid) {
      error(calculation.errorMessage || 'Invalid date range.');
      return;
    }

    if (hasOverlap) {
      error('You already have an existing leave request that overlaps with these dates.');
      return;
    }

    if (calculation.deductibleDays <= 0) {
      error('The selected date range consists only of weekly off days.');
      return;
    }

    if (leaveType !== 'Unpaid Leave' && !projected.isPossible) {
      error(`Insufficient leave balance! You have ${balanceSummary.totalRemaining} days remaining, but requested ${calculation.deductibleDays} days.`);
      return;
    }

    if (settings.requireLeaveReason && !reason.trim()) {
      error('Please provide a reason for your leave.');
      return;
    }

    createLeaveRequest({
      employeeId,
      employeeName: user?.name || 'Sarah Johnson',
      department: user?.department || 'Product Design',
      leaveType,
      startDate,
      endDate,
      durationType: 'Full Day',
      calendarDays: calculation.calendarDays,
      deductibleDays: calculation.deductibleDays,
      weeklyOffDaysExcluded: calculation.weeklyOffDaysCount,
      reason,
      attachmentName: uploadedFile?.name,
      attachmentUrl: uploadedFile?.dataUrl,
      attachmentSize: uploadedFile?.size,
      attachmentType: uploadedFile?.type
    });

    success('Leave request submitted successfully! Pending administrator review.');
    navigate('/employee/leave-history');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'Employee' }, { label: 'Apply for Leave' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Apply for Leave</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Submit a new leave application. Deductions automatically exclude configured weekly off days (Sundays).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Application Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Leave Type */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Leave Type</label>
              <select
                value={leaveType}
                onChange={e => setLeaveType(e.target.value as LeaveType)}
                className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-600 bg-gray-50/50"
              >
                <option value="Annual Leave">Annual Leave</option>
                <option value="Vacation">Vacation</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Personal Leave">Personal Leave</option>
                <option value="Unpaid Leave">Unpaid Leave (No balance deducted)</option>
              </select>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">End Date</label>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Dynamic Calculation Feedback Pill */}
            {startDate && endDate && (
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  !calculation.isValid || hasOverlap || (leaveType !== 'Unpaid Leave' && !projected.isPossible)
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-blue-50/60 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>Calculation Summary</span>
                </div>

                {hasOverlap && (
                  <p className="font-semibold text-rose-700">
                    ⚠️ Date Conflict: You have an existing request during this period.
                  </p>
                )}

                {!calculation.isValid && calculation.errorMessage && (
                  <p className="font-semibold text-rose-700">⚠️ {calculation.errorMessage}</p>
                )}

                {calculation.isValid && !hasOverlap && (
                  <div className="space-y-1">
                    <p>
                      Total Calendar Days: <b>{calculation.calendarDays} day(s)</b>
                    </p>
                    {calculation.weeklyOffDaysCount > 0 && (
                      <p className="text-emerald-700 font-medium">
                        ✓ Excluded Weekly Off Days (Sunday): <b>{calculation.weeklyOffDaysCount} day(s)</b>
                      </p>
                    )}
                    <p className="text-sm font-extrabold text-blue-700">
                      Actual Leave Deduction: {calculation.deductibleDays} day(s)
                    </p>
                    {leaveType !== 'Unpaid Leave' && !projected.isPossible && (
                      <p className="font-bold text-rose-700 mt-1">
                        ❌ Insufficient balance! You only have {balanceSummary.totalRemaining} days remaining.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reason Text */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Reason for Leave {settings.requireLeaveReason && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                required={settings.requireLeaveReason}
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="State the purpose of your leave request..."
                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600 bg-gray-50/50"
              />
            </div>

            {/* Document Upload */}
            <div>
              <FileUpload
                onFileSelected={setUploadedFile}
                label="Optional Supporting Document (e.g. Medical Certificate, Flight Ticket)"
                helperText="Upload PDF or Image (max 5MB)"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!calculation.isValid || hasOverlap || (leaveType !== 'Unpaid Leave' && !projected.isPossible)}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Submit Leave Application</span>
            </button>
          </form>
        </div>

        {/* Live Balance Summary Side Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Leave Balance Status</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                <span className="text-gray-500">Current-Year Remaining</span>
                <span className="font-bold text-gray-900">{balanceSummary.currentYearRemaining} days</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-blue-900 font-medium">Carry-Forward Remaining</span>
                <span className="font-bold text-blue-700">+{balanceSummary.carryForwardRemaining} days</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-900 font-bold">Total Available Balance</span>
                <span className="font-extrabold text-emerald-700 text-base">{balanceSummary.totalRemaining} days</span>
              </div>
            </div>

            {calculation.isValid && calculation.deductibleDays > 0 && leaveType !== 'Unpaid Leave' && (
              <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                <h4 className="font-bold text-gray-800">Projected Consumption</h4>
                <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-[11px] text-gray-600">
                  <div className="flex justify-between">
                    <span>From Current-Year:</span>
                    <span className="font-semibold text-gray-900">{projected.fromCurrent} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>From Carry-Forward:</span>
                    <span className="font-semibold text-gray-900">{projected.fromCarryForward} days</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-gray-900">
                    <span>Balance Remaining After Leave:</span>
                    <span className={projected.projectedRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {projected.projectedRemaining} days
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Policy Hints Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-3 text-xs leading-relaxed">
            <div className="flex items-center space-x-2 text-blue-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Leave Rules & Priority</span>
            </div>
            <ul className="space-y-2 text-slate-300 list-disc list-inside text-[11px]">
              <li>Every employee receives 14 annual leave days.</li>
              <li>Current-year quota is consumed before carry-forward balance.</li>
              <li>Sundays and configured weekly off days are excluded automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
