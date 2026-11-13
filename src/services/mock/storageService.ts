import {
  Employee,
  LeaveBalance,
  LeaveRequest,
  AttendanceRecord,
  DocumentItem,
  SystemSettings,
  ActivityLog,
  User
} from '../../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_ATTENDANCE,
  INITIAL_DOCUMENTS,
  INITIAL_SETTINGS,
  INITIAL_ACTIVITY_LOGS
} from '../../data/initialData';
import { loadFromStorage, saveToStorage } from '../../utils/storageUtils';
import { calculateDeductionConsumption } from '../../utils/leaveCalculations';

const KEYS = {
  CURRENT_USER: 'attendflow_current_user',
  EMPLOYEES: 'attendflow_employees',
  LEAVE_BALANCES: 'attendflow_leave_balances',
  LEAVE_REQUESTS: 'attendflow_leave_requests',
  ATTENDANCE: 'attendflow_attendance',
  DOCUMENTS: 'attendflow_documents',
  SETTINGS: 'attendflow_settings',
  ACTIVITY_LOGS: 'attendflow_activity_logs'
};

// 1. AuthService
export const AuthService = {
  login: async (email: string, role: 'admin' | 'employee'): Promise<User> => {
    let user: User;
    if (role === 'admin') {
      user = {
        id: 'ADMIN001',
        name: 'System Admin',
        email: email || 'admin@demo.com',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        designation: 'Operations Director'
      };
    } else {
      user = {
        id: 'EMP002',
        name: 'Sarah Johnson',
        email: email || 'employee@demo.com',
        role: 'employee',
        employeeId: 'EMP002',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        department: 'Product Design',
        designation: 'Lead UI/UX Designer'
      };
    }
    saveToStorage(KEYS.CURRENT_USER, user);
    return user;
  },

  getCurrentUser: (): User | null => {
    return loadFromStorage<User | null>(KEYS.CURRENT_USER, null);
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

// 2. SettingsService
export const SettingsService = {
  getSettings: (): SystemSettings => {
    return loadFromStorage<SystemSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  updateSettings: (newSettings: SystemSettings): SystemSettings => {
    saveToStorage(KEYS.SETTINGS, newSettings);
    ActivityService.logActivity({
      userName: 'Admin',
      userRole: 'admin',
      action: 'Updated Settings',
      details: `Annual allocation: ${newSettings.annualLeaveAllocation} days, Weekly off: ${newSettings.weeklyOffDays.join(',')}`,
      type: 'system'
    });
    return newSettings;
  },

  resetDemoData: (): void => {
    saveToStorage(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    saveToStorage(KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    saveToStorage(KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    saveToStorage(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    saveToStorage(KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    saveToStorage(KEYS.SETTINGS, INITIAL_SETTINGS);
    saveToStorage(KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  }
};

// 3. EmployeeService
export const EmployeeService = {
  getEmployees: (): Employee[] => {
    const list = loadFromStorage<Employee[]>(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const balances = LeaveService.getAllBalances();

    // Dynamically sync leave taken/remaining
    return list.map(emp => {
      const bal = balances[emp.id];
      if (bal) {
        const totalTaken = bal.currentYearTaken + bal.carryForwardTaken;
        const totalRemaining = (bal.annualAllocation - bal.currentYearTaken) + (bal.carryForwardAllocation - bal.carryForwardTaken);
        return {
          ...emp,
          annualLeave: bal.annualAllocation,
          carryForwardLeave: bal.carryForwardAllocation,
          leaveTaken: totalTaken,
          leaveRemaining: totalRemaining
        };
      }
      return emp;
    });
  },

  getEmployeeById: (id: string): Employee | undefined => {
    const employees = EmployeeService.getEmployees();
    return employees.find(e => e.id === id);
  },

  updateEmployee: (updated: Employee): void => {
    const employees = EmployeeService.getEmployees();
    const index = employees.findIndex(e => e.id === updated.id);
    if (index !== -1) {
      employees[index] = updated;
      saveToStorage(KEYS.EMPLOYEES, employees);
    }
  }
};

// 4. LeaveService
export const LeaveService = {
  getLeaveRequests: (): LeaveRequest[] => {
    return loadFromStorage<LeaveRequest[]>(KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
  },

  getAllBalances: (): Record<string, LeaveBalance> => {
    return loadFromStorage<Record<string, LeaveBalance>>(KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
  },

  getBalanceByEmployeeId: (employeeId: string): LeaveBalance => {
    const balances = LeaveService.getAllBalances();
    const settings = SettingsService.getSettings();

    if (balances[employeeId]) {
      return balances[employeeId];
    }

    // Default initialization if not found
    const newBalance: LeaveBalance = {
      employeeId,
      annualAllocation: settings.annualLeaveAllocation || 14,
      currentYearTaken: 0,
      carryForwardAllocation: 0,
      carryForwardTaken: 0
    };
    balances[employeeId] = newBalance;
    saveToStorage(KEYS.LEAVE_BALANCES, balances);
    return newBalance;
  },

  createLeaveRequest: (newRequest: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>): LeaveRequest => {
    const requests = LeaveService.getLeaveRequests();
    const now = new Date();
    const id = `LR-${Date.now().toString().slice(-4)}`;
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const requestDate = `${y}-${m}-${d}`;

    const created: LeaveRequest = {
      ...newRequest,
      id,
      status: 'Pending',
      requestDate
    };

    requests.unshift(created);
    saveToStorage(KEYS.LEAVE_REQUESTS, requests);

    ActivityService.logActivity({
      userName: created.employeeName,
      userRole: 'employee',
      action: 'Applied for Leave',
      details: `${created.leaveType} (${created.deductibleDays} days) from ${created.startDate} to ${created.endDate}`,
      type: 'leave'
    });

    return created;
  },

  approveLeaveRequest: (requestId: string, reviewerName: string = 'Admin'): { success: boolean; message: string } => {
    const requests = LeaveService.getLeaveRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return { success: false, message: 'Leave request not found' };

    const req = requests[reqIndex];
    if (req.status !== 'Pending') {
      return { success: false, message: `Request is already ${req.status}` };
    }

    // Unpaid leave doesn't consume balance
    if (req.leaveType === 'Unpaid Leave') {
      req.status = 'Approved';
      req.reviewedBy = reviewerName;
      req.reviewDate = new Date().toISOString().split('T')[0];
      requests[reqIndex] = req;
      saveToStorage(KEYS.LEAVE_REQUESTS, requests);
      AttendanceService.markLeaveAttendance(req.employeeId, req.employeeName, req.department, req.startDate, req.endDate, req.durationType);
      return { success: true, message: 'Unpaid leave approved successfully (no balance deduction).' };
    }

    // Deduct balance
    const balances = LeaveService.getAllBalances();
    const balance = LeaveService.getBalanceByEmployeeId(req.employeeId);

    const consumption = calculateDeductionConsumption(balance, req.deductibleDays);
    if (!consumption.isPossible) {
      return {
        success: false,
        message: 'Cannot approve: employee does not have sufficient total leave balance remaining.'
      };
    }

    // Apply deduction
    balance.currentYearTaken = consumption.newCurrentYearTaken;
    balance.carryForwardTaken = consumption.newCarryForwardTaken;
    balances[req.employeeId] = balance;
    saveToStorage(KEYS.LEAVE_BALANCES, balances);

    // Update request
    req.status = 'Approved';
    req.reviewedBy = reviewerName;
    req.reviewDate = new Date().toISOString().split('T')[0];
    requests[reqIndex] = req;
    saveToStorage(KEYS.LEAVE_REQUESTS, requests);

    // Update attendance table automatically
    AttendanceService.markLeaveAttendance(req.employeeId, req.employeeName, req.department, req.startDate, req.endDate, req.durationType);

    // Activity log
    ActivityService.logActivity({
      userName: reviewerName,
      userRole: 'admin',
      action: 'Approved Leave Request',
      details: `Approved ${req.deductibleDays} days for ${req.employeeName} (${consumption.fromCurrentYear} from Current Year, ${consumption.fromCarryForward} from Carry-Forward)`,
      type: 'leave'
    });

    return {
      success: true,
      message: `Leave approved: Deducted ${consumption.fromCurrentYear} day(s) from Current-Year and ${consumption.fromCarryForward} day(s) from Carry-Forward.`
    };
  },

  rejectLeaveRequest: (requestId: string, rejectionReason: string, reviewerName: string = 'Admin'): boolean => {
    const requests = LeaveService.getLeaveRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return false;

    const req = requests[reqIndex];
    req.status = 'Rejected';
    req.rejectionReason = rejectionReason || 'Request not approved by administrator.';
    req.reviewedBy = reviewerName;
    req.reviewDate = new Date().toISOString().split('T')[0];
    requests[reqIndex] = req;
    saveToStorage(KEYS.LEAVE_REQUESTS, requests);

    ActivityService.logActivity({
      userName: reviewerName,
      userRole: 'admin',
      action: 'Rejected Leave Request',
      details: `Rejected leave for ${req.employeeName}. Reason: ${req.rejectionReason}`,
      type: 'leave'
    });

    return true;
  },

  cancelLeaveRequest: (requestId: string): boolean => {
    const requests = LeaveService.getLeaveRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return false;

    const req = requests[reqIndex];
    if (req.status !== 'Pending') return false;

    req.status = 'Cancelled';
    requests[reqIndex] = req;
    saveToStorage(KEYS.LEAVE_REQUESTS, requests);

    ActivityService.logActivity({
      userName: req.employeeName,
      userRole: 'employee',
      action: 'Cancelled Leave Request',
      details: `Cancelled pending leave ${req.id}`,
      type: 'leave'
    });

    return true;
  }
};

// 5. AttendanceService
export const AttendanceService = {
  getAttendance: (): AttendanceRecord[] => {
    return loadFromStorage<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },

  markLeaveAttendance: (
    employeeId: string,
    employeeName: string,
    department: string,
    startDateStr: string,
    endDateStr: string,
    durationType: 'Full Day' | 'Half Day'
  ): void => {
    const attendance = AttendanceService.getAttendance();
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const settings = SettingsService.getSettings();

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Skip weekly off days
      if (!settings.weeklyOffDays.includes(dayOfWeek)) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const existingIdx = attendance.findIndex(a => a.employeeId === employeeId && a.date === dateStr);
        const record: AttendanceRecord = {
          id: existingIdx !== -1 ? attendance[existingIdx].id : `ATT-${Date.now().toString().slice(-5)}`,
          employeeId,
          employeeName,
          department,
          date: dateStr,
          status: durationType === 'Half Day' ? 'Half Day' : 'On Leave',
          checkIn: durationType === 'Half Day' ? '09:00 AM' : undefined,
          checkOut: durationType === 'Half Day' ? '01:30 PM' : undefined,
          workingHours: durationType === 'Half Day' ? '4h 30m' : undefined,
          notes: durationType === 'Half Day' ? 'Approved Half-Day Leave' : 'Approved Leave'
        };

        if (existingIdx !== -1) {
          attendance[existingIdx] = record;
        } else {
          attendance.unshift(record);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    saveToStorage(KEYS.ATTENDANCE, attendance);
  }
};

// 6. DocumentService
export const DocumentService = {
  getDocuments: (): DocumentItem[] => {
    return loadFromStorage<DocumentItem[]>(KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  },

  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate'>): DocumentItem => {
    const docs = DocumentService.getDocuments();
    const created: DocumentItem = {
      ...doc,
      id: `DOC-${Date.now().toString().slice(-4)}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    docs.unshift(created);
    saveToStorage(KEYS.DOCUMENTS, docs);

    ActivityService.logActivity({
      userName: doc.employeeName,
      userRole: 'employee',
      action: 'Uploaded Document',
      details: `${doc.title} (${doc.fileName})`,
      type: 'document'
    });

    return created;
  },

  deleteDocument: (id: string): boolean => {
    const docs = DocumentService.getDocuments();
    const filtered = docs.filter(d => d.id !== id);
    if (filtered.length !== docs.length) {
      saveToStorage(KEYS.DOCUMENTS, filtered);
      return true;
    }
    return false;
  }
};

// 7. ActivityService
export const ActivityService = {
  getActivityLogs: (): ActivityLog[] => {
    return loadFromStorage<ActivityLog[]>(KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  },

  logActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>): void => {
    const logs = ActivityService.getActivityLogs();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry: ActivityLog = {
      ...log,
      id: `ACT-${Date.now().toString().slice(-4)}`,
      timestamp
    };
    logs.unshift(newEntry);
    if (logs.length > 50) logs.pop(); // keep last 50
    saveToStorage(KEYS.ACTIVITY_LOGS, logs);
  }
};

