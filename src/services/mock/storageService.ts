import {
  Employee,
  LeaveBalance,
  LeaveRequest,
  AttendanceRecord,
  DocumentItem,
  SystemSettings,
  ActivityLog,
  EmployeeInvitation,
  PasswordChangeRequest,
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
  ACTIVITY_LOGS: 'attendflow_activity_logs',
  INVITATIONS: 'attendflow_invitations',
  PASSWORD_REQUESTS: 'attendflow_password_requests',
  REGISTERED_CREDENTIALS: 'attendflow_registered_credentials'
};

// 1. AuthService
export const AuthService = {
  login: async (email: string, role: 'admin' | 'employee', customPassword?: string): Promise<User> => {
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
      // Check if user is an existing registered or demo employee
      const employees = EmployeeService.getEmployees();
      const matched = employees.find(e => e.email.toLowerCase() === email.toLowerCase());

      user = {
        id: matched?.id || 'EMP002',
        name: matched?.name || 'Sarah Johnson',
        email: email || 'employee@demo.com',
        role: 'employee',
        employeeId: matched?.id || 'EMP002',
        avatar: matched?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        department: matched?.department || 'Product Design',
        designation: matched?.designation || 'Lead UI/UX Designer'
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
  },

  getRegisteredCredentials: (): Record<string, string> => {
    return loadFromStorage<Record<string, string>>(KEYS.REGISTERED_CREDENTIALS, {
      'admin@demo.com': 'admin123',
      'employee@demo.com': 'employee123'
    });
  },

  setCredential: (email: string, pass: string): void => {
    const creds = AuthService.getRegisteredCredentials();
    creds[email.toLowerCase()] = pass;
    saveToStorage(KEYS.REGISTERED_CREDENTIALS, creds);
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
    const list = loadFromStorage<LeaveRequest[]>(KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    // Sanitize any legacy half-day requests in user's localStorage
    let modified = false;
    const sanitized = list.map(r => {
      if ((r as any).durationType === 'Half Day' || (r as any).halfDaySession) {
        modified = true;
        const copy: any = { ...r, durationType: 'Full Day' };
        if (copy.deductibleDays === 0.5) copy.deductibleDays = 1;
        delete copy.halfDaySession;
        return copy as LeaveRequest;
      }
      return r;
    });
    if (modified) {
      saveToStorage(KEYS.LEAVE_REQUESTS, sanitized);
    }
    return sanitized;
  },

  getAllBalances: (): Record<string, LeaveBalance> => {
    const balances = loadFromStorage<Record<string, LeaveBalance>>(KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    let modified = false;
    for (const k of Object.keys(balances)) {
      const b = balances[k];
      if (b.currentYearTaken % 1 !== 0) {
        b.currentYearTaken = Math.round(b.currentYearTaken);
        modified = true;
      }
      if (b.carryForwardTaken % 1 !== 0) {
        b.carryForwardTaken = Math.round(b.carryForwardTaken);
        modified = true;
      }
    }
    if (modified) {
      saveToStorage(KEYS.LEAVE_BALANCES, balances);
    }
    return balances;
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
    const list = loadFromStorage<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    let modified = false;
    const sanitized = list.map(a => {
      if ((a as any).status === 'Half Day') {
        modified = true;
        return {
          ...a,
          status: 'Present' as const,
          checkOut: a.checkOut || '05:30 PM',
          workingHours: '8h 30m',
          notes: a.notes?.includes('half day') ? undefined : a.notes
        };
      }
      return a;
    });
    if (modified) {
      saveToStorage(KEYS.ATTENDANCE, sanitized);
    }
    return sanitized;
  },

  markLeaveAttendance: (
    employeeId: string,
    employeeName: string,
    department: string,
    startDateStr: string,
    endDateStr: string,
    durationType?: 'Full Day'
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
          status: 'On Leave',
          checkIn: undefined,
          checkOut: undefined,
          workingHours: undefined,
          notes: 'Approved Leave'
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

// 8. InvitationService
export const InvitationService = {
  getInvitations: (): EmployeeInvitation[] => {
    return loadFromStorage<EmployeeInvitation[]>(KEYS.INVITATIONS, [
      {
        id: 'INV-1001',
        name: 'Alex Rivera',
        email: 'alex.rivera@demo.com',
        llcName: 'Acme West LLC',
        jobLocation: 'California, US',
        role: 'employee',
        token: 'invite_alex_demo_token',
        status: 'Pending',
        invitedAt: '2026-11-13'
      }
    ]);
  },

  createInvitation: (inv: Omit<EmployeeInvitation, 'id' | 'token' | 'status' | 'invitedAt'>): EmployeeInvitation => {
    const invitations = InvitationService.getInvitations();
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newInv: EmployeeInvitation = {
      ...inv,
      id: `INV-${Date.now().toString().slice(-4)}`,
      token,
      status: 'Pending',
      invitedAt: new Date().toISOString().split('T')[0]
    };
    invitations.unshift(newInv);
    saveToStorage(KEYS.INVITATIONS, invitations);

    ActivityService.logActivity({
      userName: 'Admin',
      userRole: 'admin',
      action: 'Invited Employee',
      details: `Sent invitation to ${inv.name} (${inv.email}) for ${inv.llcName}`,
      type: 'employee'
    });

    return newInv;
  },

  getInvitationByToken: (token: string): EmployeeInvitation | undefined => {
    const list = InvitationService.getInvitations();
    return list.find(i => i.token === token);
  },

  importInvitationIfMissing: (inv: EmployeeInvitation): void => {
    const list = InvitationService.getInvitations();
    if (!list.some(i => i.token === inv.token)) {
      list.unshift(inv);
      saveToStorage(KEYS.INVITATIONS, list);
    }
  },

  acceptInvitationAndRegister: (
    token: string,
    password: string,
    customData?: { phone?: string; area?: string; fallbackInvitation?: EmployeeInvitation }
  ): { success: boolean; employee?: Employee; message: string } => {
    let invitations = InvitationService.getInvitations();
    let invIndex = invitations.findIndex(i => i.token === token);

    // If invitation is missing in this browser's LocalStorage, restore it from fallbackInvitation
    if (invIndex === -1 && customData?.fallbackInvitation) {
      invitations.unshift(customData.fallbackInvitation);
      saveToStorage(KEYS.INVITATIONS, invitations);
      invIndex = 0;
    }

    if (invIndex === -1) {
      return { success: false, message: 'Invalid or expired invitation link.' };
    }
    const inv = invitations[invIndex];
    if (inv.status === 'Registered') {
      return { success: false, message: 'This invitation has already been registered.' };
    }

    // 1. Create employee
    const employees = EmployeeService.getEmployees();
    const empId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    const newEmployee: Employee = {
      id: empId,
      name: inv.name,
      email: inv.email,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      department: 'Engineering',
      designation: 'Associate Specialist',
      joiningDate: new Date().toISOString().split('T')[0],
      phone: customData?.phone || '+1 (555) 000-0000',
      status: 'Active',
      annualLeave: 14,
      carryForwardLeave: 0,
      leaveTaken: 0,
      leaveRemaining: 14,
      attendancePercentage: 100,
      llcName: inv.llcName,
      jobLocation: inv.jobLocation,
      area: customData?.area || 'Headquarters'
    };

    employees.push(newEmployee);
    saveToStorage(KEYS.EMPLOYEES, employees);

    // 2. Initialize leave balance
    const balances = LeaveService.getAllBalances();
    balances[empId] = {
      employeeId: empId,
      annualAllocation: 14,
      currentYearTaken: 0,
      carryForwardAllocation: 0,
      carryForwardTaken: 0
    };
    saveToStorage(KEYS.LEAVE_BALANCES, balances);

    // 3. Save credentials
    AuthService.setCredential(inv.email, password);

    // 4. Update invitation status
    invitations[invIndex] = {
      ...inv,
      status: 'Registered',
      registeredAt: new Date().toISOString().split('T')[0]
    };
    saveToStorage(KEYS.INVITATIONS, invitations);

    ActivityService.logActivity({
      userName: inv.name,
      userRole: 'employee',
      action: 'Account Registered',
      details: `${inv.name} registered account via invite link`,
      type: 'employee'
    });

    return { success: true, employee: newEmployee, message: 'Registration complete! You can now log in.' };
  }
};

// 9. PasswordRequestService
export const PasswordRequestService = {
  getRequests: (): PasswordChangeRequest[] => {
    return loadFromStorage<PasswordChangeRequest[]>(KEYS.PASSWORD_REQUESTS, []);
  },

  createRequest: (employeeId: string, employeeName: string, email: string, reason?: string): PasswordChangeRequest => {
    const list = PasswordRequestService.getRequests();
    const newReq: PasswordChangeRequest = {
      id: `PR-${Date.now().toString().slice(-4)}`,
      employeeId,
      employeeName,
      email,
      reason: reason || 'Requested by employee',
      status: 'Pending',
      requestedAt: new Date().toISOString().split('T')[0]
    };
    list.unshift(newReq);
    saveToStorage(KEYS.PASSWORD_REQUESTS, list);

    ActivityService.logActivity({
      userName: employeeName,
      userRole: 'employee',
      action: 'Requested Password Reset',
      details: `${employeeName} submitted a password reset request`,
      type: 'system'
    });

    return newReq;
  },

  approveRequest: (requestId: string, tempPassword: string = 'Welcome@123'): boolean => {
    const list = PasswordRequestService.getRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return false;

    const req = list[index];
    list[index] = {
      ...req,
      status: 'Approved',
      tempPassword,
      reviewedAt: new Date().toISOString().split('T')[0],
      reviewedBy: 'Admin'
    };
    saveToStorage(KEYS.PASSWORD_REQUESTS, list);

    // Update credential to temporary password
    AuthService.setCredential(req.email, tempPassword);

    ActivityService.logActivity({
      userName: 'Admin',
      userRole: 'admin',
      action: 'Approved Password Reset',
      details: `Generated temporary password for ${req.employeeName}`,
      type: 'system'
    });

    return true;
  },

  rejectRequest: (requestId: string): boolean => {
    const list = PasswordRequestService.getRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return false;

    list[index] = {
      ...list[index],
      status: 'Rejected',
      reviewedAt: new Date().toISOString().split('T')[0],
      reviewedBy: 'Admin'
    };
    saveToStorage(KEYS.PASSWORD_REQUESTS, list);
    return true;
  }
};

// 10. ActivityService
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



