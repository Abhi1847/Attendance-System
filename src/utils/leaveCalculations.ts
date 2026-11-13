import { LeaveBalance, SystemSettings } from '../types';

/**
 * Returns true if the given day (0=Sunday, 1=Monday, ..., 6=Saturday) is a weekly off day.
 * Default weekly off is Sunday (0).
 */
export function isWeeklyOff(date: Date, weeklyOffDays: number[] = [0]): boolean {
  return weeklyOffDays.includes(date.getDay());
}

/**
 * Parses a YYYY-MM-DD string into a local Date object without UTC timezone shifting.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates leave days, excluding configured weekly off days.
 * For half-day leave on a single valid working day, deducts 0.5 days.
 */
export function calculateLeaveDays(
  startDateStr: string,
  endDateStr: string,
  isHalfDay: boolean = false,
  weeklyOffDays: number[] = [0]
): {
  calendarDays: number;
  deductibleDays: number;
  weeklyOffDaysCount: number;
  isValid: boolean;
  errorMessage?: string;
} {
  if (!startDateStr || !endDateStr) {
    return { calendarDays: 0, deductibleDays: 0, weeklyOffDaysCount: 0, isValid: false };
  }

  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);

  if (end < start) {
    return {
      calendarDays: 0,
      deductibleDays: 0,
      weeklyOffDaysCount: 0,
      isValid: false,
      errorMessage: 'End date cannot be earlier than start date.'
    };
  }

  // If half day, start and end must be same day
  if (isHalfDay && startDateStr !== endDateStr) {
    return {
      calendarDays: 1,
      deductibleDays: 0,
      weeklyOffDaysCount: 0,
      isValid: false,
      errorMessage: 'Half-day leave must be on a single day.'
    };
  }

  // Count days
  let calendarDays = 0;
  let workingDays = 0;
  let weeklyOffDaysCount = 0;

  const current = new Date(start);
  while (current <= end) {
    calendarDays++;
    if (isWeeklyOff(current, weeklyOffDays)) {
      weeklyOffDaysCount++;
    } else {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  // Check half day on a weekly off
  if (isHalfDay) {
    if (isWeeklyOff(start, weeklyOffDays)) {
      return {
        calendarDays: 1,
        deductibleDays: 0,
        weeklyOffDaysCount: 1,
        isValid: false,
        errorMessage: 'Half-day leave cannot be requested on a weekly off day.'
      };
    }
    return {
      calendarDays: 1,
      deductibleDays: 0.5,
      weeklyOffDaysCount: 0,
      isValid: true
    };
  }

  return {
    calendarDays,
    deductibleDays: workingDays, // Each working day deducts 1 day
    weeklyOffDaysCount,
    isValid: true
  };
}

/**
 * Calculates leave balance deduction following the strict rule:
 * Employees consume current-year leave FIRST.
 * Carry-forward leave is consumed ONLY after current-year leave is exhausted (reaches 0).
 */
export function calculateDeductionConsumption(
  currentBalance: LeaveBalance,
  deductDays: number
): {
  newCurrentYearTaken: number;
  newCarryForwardTaken: number;
  fromCurrentYear: number;
  fromCarryForward: number;
  isPossible: boolean;
} {
  const currentYearRemaining = Math.max(0, currentBalance.annualAllocation - currentBalance.currentYearTaken);
  const carryForwardRemaining = Math.max(0, currentBalance.carryForwardAllocation - currentBalance.carryForwardTaken);
  const totalRemaining = currentYearRemaining + carryForwardRemaining;

  if (deductDays > totalRemaining) {
    return {
      newCurrentYearTaken: currentBalance.currentYearTaken,
      newCarryForwardTaken: currentBalance.carryForwardTaken,
      fromCurrentYear: 0,
      fromCarryForward: 0,
      isPossible: false
    };
  }

  let fromCurrentYear = 0;
  let fromCarryForward = 0;

  if (deductDays <= currentYearRemaining) {
    fromCurrentYear = deductDays;
  } else {
    fromCurrentYear = currentYearRemaining;
    fromCarryForward = deductDays - currentYearRemaining;
  }

  return {
    newCurrentYearTaken: currentBalance.currentYearTaken + fromCurrentYear,
    newCarryForwardTaken: currentBalance.carryForwardTaken + fromCarryForward,
    fromCurrentYear,
    fromCarryForward,
    isPossible: true
  };
}

/**
 * Returns leave balance totals
 */
export function getLeaveSummary(balance: LeaveBalance) {
  const currentYearRemaining = Math.max(0, balance.annualAllocation - balance.currentYearTaken);
  const carryForwardRemaining = Math.max(0, balance.carryForwardAllocation - balance.carryForwardTaken);
  const totalTaken = balance.currentYearTaken + balance.carryForwardTaken;
  const totalRemaining = currentYearRemaining + carryForwardRemaining;
  const totalAllocation = balance.annualAllocation + balance.carryForwardAllocation;

  return {
    annualAllocation: balance.annualAllocation,
    carryForwardAllocation: balance.carryForwardAllocation,
    totalAllocation,
    currentYearTaken: balance.currentYearTaken,
    carryForwardTaken: balance.carryForwardTaken,
    totalTaken,
    currentYearRemaining,
    carryForwardRemaining,
    totalRemaining
  };
}

/**
 * Leave utilization percentage based on annual leave allocation:
 * utilization = (totalTaken / annualAllocation) * 100
 */
export function calculateLeaveUtilization(balance: LeaveBalance): number {
  if (balance.annualAllocation <= 0) return 0;
  const totalTaken = balance.currentYearTaken + balance.carryForwardTaken;
  const percentage = (totalTaken / balance.annualAllocation) * 100;
  return Number(Math.min(100, Math.max(0, percentage)).toFixed(2));
}

/**
 * Gradient colors & styling based on utilization thresholds:
 * 0-40%: Green (Low leave utilization)
 * 41-65%: Blue (Normal leave utilization)
 * 66-85%: Orange (High leave utilization)
 * 86-100%: Red (Critical leave utilization)
 */
export function getUtilizationColor(percentage: number): {
  colorName: 'green' | 'blue' | 'orange' | 'red';
  gradientClass: string;
  badgeBg: string;
  badgeText: string;
  barColor: string;
  statusLabel: string;
} {
  if (percentage <= 40) {
    return {
      colorName: 'green',
      gradientClass: 'from-emerald-500 to-green-600',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-700',
      barColor: 'bg-emerald-500',
      statusLabel: 'Low Utilization (Healthy)'
    };
  } else if (percentage <= 65) {
    return {
      colorName: 'blue',
      gradientClass: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-50 border-blue-200',
      badgeText: 'text-blue-700',
      barColor: 'bg-blue-500',
      statusLabel: 'Normal Utilization'
    };
  } else if (percentage <= 85) {
    return {
      colorName: 'orange',
      gradientClass: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 border-amber-200',
      badgeText: 'text-amber-800',
      barColor: 'bg-amber-500',
      statusLabel: 'High Utilization'
    };
  } else {
    return {
      colorName: 'red',
      gradientClass: 'from-red-500 to-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200',
      badgeText: 'text-rose-700',
      barColor: 'bg-rose-500',
      statusLabel: 'Critical Utilization'
    };
  }
}

/**
 * Checks if a requested date range overlaps with any existing non-rejected / non-cancelled request
 */
export function checkOverlappingLeave(
  newStart: string,
  newEnd: string,
  existingRequests: { startDate: string; endDate: string; status: string; id?: string }[],
  ignoreRequestId?: string
): boolean {
  const start = parseLocalDate(newStart).getTime();
  const end = parseLocalDate(newEnd).getTime();

  for (const req of existingRequests) {
    if (ignoreRequestId && req.id === ignoreRequestId) continue;
    if (req.status === 'Rejected' || req.status === 'Cancelled') continue;

    const reqStart = parseLocalDate(req.startDate).getTime();
    const reqEnd = parseLocalDate(req.endDate).getTime();

    // Overlap condition: start <= reqEnd && end >= reqStart
    if (start <= reqEnd && end >= reqStart) {
      return true;
    }
  }

  return false;
}

