import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  LeaveBalance,
  LeaveRequest,
  AttendanceRecord,
  DocumentItem,
  SystemSettings,
  ActivityLog
} from '../types';
import {
  EmployeeService,
  LeaveService,
  AttendanceService,
  DocumentService,
  SettingsService,
  ActivityService
} from '../services/mock/storageService';

interface AppDataContextType {
  employees: Employee[];
  leaveBalances: Record<string, LeaveBalance>;
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  documents: DocumentItem[];
  settings: SystemSettings;
  activityLogs: ActivityLog[];
  refreshData: () => void;
  updateSettings: (newSettings: SystemSettings) => void;
  resetDemoData: () => void;
  approveLeave: (requestId: string, reviewerName?: string) => { success: boolean; message: string };
  rejectLeave: (requestId: string, reason: string, reviewerName?: string) => boolean;
  cancelLeave: (requestId: string) => boolean;
  createLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => LeaveRequest;
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate'>) => DocumentItem;
  deleteDocument: (id: string) => boolean;
  getEmployeeBalance: (empId: string) => LeaveBalance;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(SettingsService.getSettings());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const loadAll = () => {
    setEmployees(EmployeeService.getEmployees());
    setLeaveBalances(LeaveService.getAllBalances());
    setLeaveRequests(LeaveService.getLeaveRequests());
    setAttendance(AttendanceService.getAttendance());
    setDocuments(DocumentService.getDocuments());
    setSettings(SettingsService.getSettings());
    setActivityLogs(ActivityService.getActivityLogs());
  };

  useEffect(() => {
    loadAll();
  }, []);

  const refreshData = () => {
    loadAll();
  };

  const updateSettings = (newSettings: SystemSettings) => {
    SettingsService.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const resetDemoData = () => {
    SettingsService.resetDemoData();
    loadAll();
  };

  const approveLeave = (requestId: string, reviewerName: string = 'Admin') => {
    const res = LeaveService.approveLeaveRequest(requestId, reviewerName);
    loadAll();
    return res;
  };

  const rejectLeave = (requestId: string, reason: string, reviewerName: string = 'Admin') => {
    const res = LeaveService.rejectLeaveRequest(requestId, reason, reviewerName);
    loadAll();
    return res;
  };

  const cancelLeave = (requestId: string) => {
    const res = LeaveService.cancelLeaveRequest(requestId);
    loadAll();
    return res;
  };

  const createLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => {
    const created = LeaveService.createLeaveRequest(req);
    loadAll();
    return created;
  };

  const addDocument = (doc: Omit<DocumentItem, 'id' | 'uploadDate'>) => {
    const created = DocumentService.addDocument(doc);
    loadAll();
    return created;
  };

  const deleteDocument = (id: string) => {
    const ok = DocumentService.deleteDocument(id);
    loadAll();
    return ok;
  };

  const getEmployeeBalance = (empId: string): LeaveBalance => {
    return LeaveService.getBalanceByEmployeeId(empId);
  };

  return (
    <AppDataContext.Provider
      value={{
        employees,
        leaveBalances,
        leaveRequests,
        attendance,
        documents,
        settings,
        activityLogs,
        refreshData,
        updateSettings,
        resetDemoData,
        approveLeave,
        rejectLeave,
        cancelLeave,
        createLeaveRequest,
        addDocument,
        deleteDocument,
        getEmployeeBalance
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

