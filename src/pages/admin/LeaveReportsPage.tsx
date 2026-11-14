import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { exportToCSV } from '../../utils/storageUtils';
import {
  BarChart3,
  Download,
  Filter,
  PieChart as PieIcon,
  Calendar,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const LeaveReportsPage: React.FC = () => {
  const { employees, leaveRequests, leaveBalances } = useAppData();
  const { success } = useToast();

  const [activeReportTab, setActiveReportTab] = useState<
    'employee' | 'area' | 'monthly' | 'utilization' | 'carryForward'
  >('employee');

  // 1. Employee-wise report
  const employeeReportData = employees.map(emp => {
    const bal = leaveBalances[emp.id];
    return {
      name: emp.name,
      llcName: emp.llcName || 'Acme Solutions LLC',
      area: emp.area || 'West Coast',
      annualAllocation: bal ? bal.annualAllocation : 14,
      carryForward: bal ? bal.carryForwardAllocation : 0,
      taken: bal ? bal.currentYearTaken + bal.carryForwardTaken : 0,
      remaining: bal
        ? bal.annualAllocation - bal.currentYearTaken + (bal.carryForwardAllocation - bal.carryForwardTaken)
        : 14,
      utilizationRate: bal ? (((bal.currentYearTaken + bal.carryForwardTaken) / bal.annualAllocation) * 100).toFixed(1) : 0
    };
  });

  // 2. Area-wise report (replaced Department-wise)
  const areaMap: Record<string, { totalTaken: number; count: number; totalRemaining: number }> = {};
  employees.forEach(emp => {
    const bal = leaveBalances[emp.id];
    const areaName = emp.area || 'West Coast';
    if (!areaMap[areaName]) {
      areaMap[areaName] = { totalTaken: 0, count: 0, totalRemaining: 0 };
    }
    areaMap[areaName].count += 1;
    if (bal) {
      areaMap[areaName].totalTaken += bal.currentYearTaken + bal.carryForwardTaken;
      areaMap[areaName].totalRemaining +=
        bal.annualAllocation - bal.currentYearTaken + (bal.carryForwardAllocation - bal.carryForwardTaken);
    }
  });
  const areaReportData = Object.keys(areaMap).map(a => ({
    area: a,
    averageTaken: Number((areaMap[a].totalTaken / areaMap[a].count).toFixed(1)),
    totalTaken: areaMap[a].totalTaken,
    totalRemaining: areaMap[a].totalRemaining
  }));

  // Export handlers
  const handleExportCurrentReport = () => {
    if (activeReportTab === 'employee') {
      exportToCSV('Employee_Leave_Report', employeeReportData);
    } else if (activeReportTab === 'area') {
      exportToCSV('Area_wise_Leave_Report', areaReportData);
    } else if (activeReportTab === 'carryForward') {
      exportToCSV('Carry_Forward_Report', employees.map(e => {
        const bal = leaveBalances[e.id];
        return {
          Name: e.name,
          CarriedForward: bal ? bal.carryForwardAllocation : 0,
          Consumed: bal ? bal.carryForwardTaken : 0,
          Remaining: bal ? bal.carryForwardAllocation - bal.carryForwardTaken : 0
        };
      }));
    } else {
      exportToCSV('Leave_Utilization_Report', employeeReportData);
    }
    success('Report exported to CSV.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Leave Reports' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analytics & Leave Reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Aggregated workforce intelligence: employee balances, area-wise trends, and carry-forward utilization.
          </p>
        </div>

        <button
          onClick={handleExportCurrentReport}
          className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs"
        >
          <Download className="w-4 h-4 mr-1.5 text-gray-500" />
          Export Active Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto bg-gray-100 p-1.5 rounded-2xl text-xs font-semibold">
        {[
          { id: 'employee', label: 'Employee-wise Report' },
          { id: 'area', label: 'Area-wise Report' },
          { id: 'utilization', label: 'Leave Utilization Report' },
          { id: 'carryForward', label: 'Carry-Forward Report' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${activeReportTab === tab.id
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report 1: Employee-wise */}
      {activeReportTab === 'employee' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Leave Balance per Employee</h3>
            <p className="text-xs text-gray-400 mb-4">Total Leave Taken vs Remaining per Individual</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeReportData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} angle={-25} textAnchor="end" tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="taken" name="Days Taken" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="remaining" name="Days Remaining" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">LLC Name</th>
                    <th className="px-5 py-3.5 text-center">Annual Allocation</th>
                    <th className="px-5 py-3.5 text-center">Carry-Forward</th>
                    <th className="px-5 py-3.5 text-center">Taken</th>
                    <th className="px-5 py-3.5 text-center">Remaining</th>
                    <th className="px-5 py-3.5 text-center">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {employeeReportData.map(r => (
                    <tr key={r.name} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-bold text-gray-900">{r.name}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-600">{r.llcName}</td>
                      <td className="px-5 py-3.5 text-center font-medium">{r.annualAllocation}d</td>
                      <td className="px-5 py-3.5 text-center text-blue-700 font-semibold">{r.carryForward}d</td>
                      <td className="px-5 py-3.5 text-center font-bold text-blue-600">{r.taken}d</td>
                      <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{r.remaining}d</td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-gray-800">{r.utilizationRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Area-wise */}
      {activeReportTab === 'area' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Area-wise Leave Utilization</h3>
            <p className="text-xs text-gray-400 mb-4">Total Leave Days Taken by Geographic/Operational Area</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaReportData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="area" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="totalTaken" name="Total Days Taken" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="averageTaken" name="Average Days per Employee" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Carry Forward Report */}
      {activeReportTab === 'carryForward' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-1">Carry-Forward Leave Status</h3>
          <p className="text-xs text-gray-400 mb-4">Unused previous-year balances carried over into current cycle</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5 text-center">Carried Forward</th>
                  <th className="px-5 py-3.5 text-center">Carry-Forward Consumed</th>
                  <th className="px-5 py-3.5 text-center">Carry-Forward Remaining</th>
                  <th className="px-5 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {employees.map(e => {
                  const bal = leaveBalances[e.id];
                  const cfAlloc = bal ? bal.carryForwardAllocation : 0;
                  const cfTaken = bal ? bal.carryForwardTaken : 0;
                  const cfRem = cfAlloc - cfTaken;
                  return (
                    <tr key={e.id}>
                      <td className="px-5 py-3.5 font-bold text-gray-900">{e.name}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-blue-700">{cfAlloc} days</td>
                      <td className="px-5 py-3.5 text-center font-medium text-gray-600">{cfTaken} days</td>
                      <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{cfRem} days</td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {cfRem > 0 ? 'Available for emergency exhaustion' : 'Fully consumed or zero starting'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 5: Utilization */}
      {activeReportTab === 'utilization' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-1">Utilization Threshold Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Categorization by healthy (0-40%), normal (41-65%), high (66-85%), critical (&gt;85%)</p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase">0–40% (Low)</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {employeeReportData.filter(e => Number(e.utilizationRate) <= 40).length} Staff
              </p>
              <span className="text-[11px] text-emerald-600">Ample leave balance</span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-800 uppercase">41–65% (Normal)</span>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {employeeReportData.filter(e => Number(e.utilizationRate) > 40 && Number(e.utilizationRate) <= 65).length} Staff
              </p>
              <span className="text-[11px] text-blue-600">Healthy pacing</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-bold text-amber-800 uppercase">66–85% (High)</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {employeeReportData.filter(e => Number(e.utilizationRate) > 65 && Number(e.utilizationRate) <= 85).length} Staff
              </p>
              <span className="text-[11px] text-amber-600">Approaching cap</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs font-bold text-rose-800 uppercase">86–100% (Critical)</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">
                {employeeReportData.filter(e => Number(e.utilizationRate) > 85).length} Staff
              </p>
              <span className="text-[11px] text-rose-600">Near exhaustion</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

