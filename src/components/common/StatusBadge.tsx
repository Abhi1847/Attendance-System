import React from 'react';
import { LeaveStatus } from '../../types';

interface StatusBadgeProps {
  status: LeaveStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Approved':
      case 'Present':
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rejected':
      case 'Absent':
      case 'Terminated':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Half Day':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Late':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'On Leave':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status}
    </span>
  );
};

