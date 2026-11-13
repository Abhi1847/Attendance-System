import React from 'react';
import { LeaveBalance } from '../../types';
import { calculateLeaveUtilization, getUtilizationColor, getLeaveSummary } from '../../utils/leaveCalculations';

interface LeaveProgressBarProps {
  balance: LeaveBalance;
  className?: string;
  showDetails?: boolean;
}

export const LeaveProgressBar: React.FC<LeaveProgressBarProps> = ({
  balance,
  className = '',
  showDetails = true
}) => {
  const summary = getLeaveSummary(balance);
  const utilization = calculateLeaveUtilization(balance);
  const colorInfo = getUtilizationColor(utilization);

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-gray-900">Leave Utilization Progress</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorInfo.badgeBg} ${colorInfo.badgeText}`}
            >
              {colorInfo.statusLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Annual Leave Allocation: <span className="font-semibold text-gray-700">{summary.annualAllocation} days</span>
            {summary.carryForwardAllocation > 0 && (
              <span className="ml-1 text-blue-600 font-medium">
                (+{summary.carryForwardAllocation} days Carry-Forward)
              </span>
            )}
          </p>
        </div>

        <div className="text-right">
          <span className="text-3xl font-bold tracking-tight text-gray-900">{utilization}%</span>
          <span className="text-xs text-gray-400 block font-medium">utilization rate</span>
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${colorInfo.gradientClass}`}
          style={{ width: `${Math.min(100, Math.max(0, utilization))}%` }}
        />
      </div>

      {/* Threshold indicator guides */}
      <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 px-1 font-medium">
        <span className="text-emerald-600">0% Low</span>
        <span className="text-blue-600">41% Normal</span>
        <span className="text-amber-600">66% High</span>
        <span className="text-rose-600">86-100% Critical</span>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
            <span className="text-xs text-gray-500 block">Total Annual Leave</span>
            <span className="text-lg font-bold text-gray-800">{summary.annualAllocation} <span className="text-xs font-normal text-gray-500">days</span></span>
          </div>

          <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
            <span className="text-xs text-gray-500 block">Leave Taken</span>
            <span className="text-lg font-bold text-blue-700">
              {summary.totalTaken} <span className="text-xs font-normal text-gray-500">days</span>
            </span>
            <span className="text-[10px] text-gray-400 block">
              Curr: {summary.currentYearTaken} | C/F: {summary.carryForwardTaken}
            </span>
          </div>

          <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
            <span className="text-xs text-gray-500 block">Remaining Leave</span>
            <span className="text-lg font-bold text-emerald-600">
              {summary.totalRemaining} <span className="text-xs font-normal text-gray-500">days</span>
            </span>
            <span className="text-[10px] text-gray-400 block">
              Curr: {summary.currentYearRemaining} | C/F: {summary.carryForwardRemaining}
            </span>
          </div>

          <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
            <span className="text-xs text-gray-500 block">Utilization</span>
            <span className="text-lg font-bold text-gray-800">{utilization}%</span>
            <span className="text-[10px] text-gray-400 block">Of {summary.annualAllocation} annual days</span>
          </div>
        </div>
      )}
    </div>
  );
};

