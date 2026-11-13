export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
}

export type LeaveType = 'Annual Leave' | 'Casual Leave' | 'Sick Leave' | 'Personal Leave' | 'Vacation' | 'Unpaid Leave';

export type LeaveDurationType = 'Full Day' | 'Half Day';

export type HalfDaySession = 'Morning' | 'Afternoon' | null;

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationType: LeaveDurationType;
  halfDaySession?: HalfDaySession;
  calendarDays: number;
  deductibleDays: number;
  weeklyOffDaysExcluded: number;
  reason: string;
  status: LeaveStatus;
  requestDate: string; // YYYY-MM-DD
  reviewedBy?: string;
  reviewDate?: string;
  rejectionReason?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentSize?: string;
  attachmentType?: string;
}

export interface LeaveBalance {
  employeeId: string;
  annualAllocation: number;        // Default 14
  currentYearTaken: number;        // Leaves deducted from current year
  carryForwardAllocation: number;  // Previous year unused leave
  carryForwardTaken: number;       // Leaves deducted from carry forward
  // Derived/computed:
  // currentYearRemaining = annualAllocation - currentYearTaken
  // carryForwardRemaining = carryForwardAllocation - carryForwardTaken
  // totalTaken = currentYearTaken + carryForwardTaken
  // totalRemaining = currentYearRemaining + carryForwardRemaining
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkOut?: string;
  workingHours?: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface Employee {
  id: string; // matches employeeId e.g. "EMP001"
  name: string;
  email: string;
  avatar: string;
  department: string;
  designation: string;
  joiningDate: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  annualLeave: number;
  carryForwardLeave: number;
  leaveTaken: number;
  leaveRemaining: number;
  attendancePercentage: number;
  address?: string;
  emergencyContact?: string;
  llcName?: string;
  jobLocation?: string;
  area?: string;
}

export interface DocumentItem {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  documentType: 'ID Proof' | 'Contract' | 'Medical Certificate' | 'Leave Attachment' | 'Tax Document' | 'Other';
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
  fileDataUrl?: string; // Base64 or object URL for demo preview
}

export interface SystemSettings {
  annualLeaveAllocation: number; // default 14
  weeklyOffDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (Default [0])
  carryForwardEnabled: boolean;
  carryForwardExpiry: string; // 'None' or '3 Months' or '6 Months' or 'Year End'
  halfDayEnabled: boolean;
  requireLeaveReason: boolean;
  autoApproveSickLeaveUnder2Days: boolean;
  allowPastDateRequests: boolean;
  workingDays: number[]; // e.g. [1, 2, 3, 4, 5, 6] (Mon-Sat default)
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  type: 'leave' | 'attendance' | 'employee' | 'document' | 'system';
}

