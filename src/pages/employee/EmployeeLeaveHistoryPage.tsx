import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { formatDate } from '../../utils/dateUtils';
import { getLeaveSummary } from '../../utils/leaveCalculations';
import {
  History,
  Eye,
  XCircle,
  FileText,
  Calendar,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { LeaveRequest } from '../../types';

export const EmployeeLeaveHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests, getEmployeeBalance, cancelLeave } = useAppData();
  const { success, error } = useToast();

  const employeeId = user?.employeeId || 'EMP002';
  const balance = getEmployeeBalance(employeeId);
  const summary = getLeaveSummary(balance);

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [modalAction, setModalAction] = useState<'view' | 'cancel' | null>(null);

  const myRequests = leaveRequests.filter(r => r.employeeId === employeeId);

  const handleCancelConfirmed = () => {
    if (!selectedRequest) return;
    const ok = cancelLeave(selectedRequest.id);
    if (ok) {
      success(`Leave request ${selectedRequest.id} has been cancelled.`);
    } else {
      error('Failed to cancel request.');
    }
    setModalAction(null);
    setSelectedRequest(null);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-fade-in min-h-0">
      <Breadcrumbs items={[{ label: 'Employee' }, { label: 'Leave History' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Leave Applications</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review status updates, rejection notes, attachments, or cancel pending requests before administrative review.
          </p>
        </div>
      </div>

      {/* Leave Summary Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Total Leave Taken</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{summary.totalTaken}d</span>
          <span className="text-[10px] text-gray-400">Used from total quota</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Current-Year Taken</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold text-blue-600">{summary.currentYearTaken}d</span>
            <span className="text-xs text-gray-400 font-medium">/ {summary.annualAllocation}d</span>
          </div>
          <span className="text-[10px] text-blue-600 font-medium">
            {summary.currentYearTaken}d used of {summary.annualAllocation}d allocated
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Carry-Forward Used</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold text-indigo-600">{summary.carryForwardTaken}d</span>
            <span className="text-xs text-gray-400 font-medium">/ {summary.carryForwardAllocation}d</span>
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">
            {summary.carryForwardTaken}d used of {summary.carryForwardAllocation}d available
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] text-gray-400 uppercase font-semibold block">Remaining Balance</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{summary.totalRemaining}d</span>
          <span className="text-[10px] text-emerald-600 font-medium">Available balance</span>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex-1 flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1 flex flex-col">
          <table className="w-full text-left text-xs flex-1">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100 sticky top-0">
              <tr>
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Dates</th>
                <th className="px-5 py-3.5 text-center">Calendar Days</th>
                <th className="px-5 py-3.5 text-center">Deductible Days</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Requested On</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {myRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-4 font-mono font-bold text-gray-900">{req.id}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{req.leaveType}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatDate(req.startDate)}
                    {req.startDate !== req.endDate && ` to ${formatDate(req.endDate)}`}
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-gray-700">{req.calendarDays}d</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-blue-700">{req.deductibleDays}d</span>
                    {req.weeklyOffDaysExcluded > 0 && (
                      <span className="text-[10px] text-gray-400 block font-normal">
                        ({req.weeklyOffDaysExcluded} Sun excluded)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {req.durationType || 'Full Day'}
                  </td>
                  <td className="px-5 py-4 max-w-xs truncate text-gray-500" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="px-5 py-4 text-gray-400">{req.requestDate}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setModalAction('view');
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {req.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setModalAction('cancel');
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition"
                        title="Cancel Request"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {myRequests.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    No leave applications recorded. Use the "Apply for Leave" page to submit one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {modalAction === 'view' && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setModalAction(null)}
            />
            <div className="relative w-full max-w-lg rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100 p-6 z-10 animate-fade-in">
              <div className="flex items-start justify-between pb-3.5 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-mono text-gray-400">Application #{selectedRequest.id}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5">{selectedRequest.leaveType}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={selectedRequest.status} />
                  <button
                    onClick={() => setModalAction(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="py-4 space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 uppercase text-[10px] font-semibold block">Requested Range</span>
                    <p className="font-bold text-gray-900 text-xs mt-0.5">
                      {formatDate(selectedRequest.startDate)} {selectedRequest.startDate !== selectedRequest.endDate ? `to ${formatDate(selectedRequest.endDate)}` : ''}
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                      {selectedRequest.startDate} {selectedRequest.startDate !== selectedRequest.endDate ? `— ${selectedRequest.endDate}` : ''}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-blue-900 uppercase text-[10px] font-semibold block">Leave Deduction</span>
                    <p className="font-extrabold text-blue-700 text-sm mt-0.5">
                      {selectedRequest.deductibleDays} day(s)
                    </p>
                    <span className="text-[10px] text-blue-600 block">
                      {selectedRequest.calendarDays} Calendar days
                    </span>
                  </div>
                </div>

                {selectedRequest.weeklyOffDaysExcluded > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px]">
                    ✓ <b>{selectedRequest.weeklyOffDaysExcluded} Weekly off day(s) (Sunday)</b> excluded from deduction.
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 uppercase text-[10px] font-semibold block">Reason for Leave</span>
                  <p className="text-gray-800 mt-1 leading-relaxed text-xs font-medium">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                    <span className="text-rose-600 uppercase text-[10px] font-semibold block">Administrator Rejection Reason</span>
                    <p className="mt-1 font-semibold text-xs">{selectedRequest.rejectionReason}</p>
                  </div>
                )}

                {selectedRequest.attachmentName && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-bold text-xs text-blue-950 block">{selectedRequest.attachmentName}</span>
                        <span className="text-[10px] text-blue-600">{selectedRequest.attachmentSize || 'Attached Document'}</span>
                      </div>
                    </div>
                    {selectedRequest.attachmentUrl ? (
                      <a
                        href={selectedRequest.attachmentUrl}
                        download={selectedRequest.attachmentName}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Download
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-400">Attached file</span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setModalAction(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalAction === 'cancel'}
        title="Cancel Leave Application"
        message={`Are you sure you want to cancel your leave application #${selectedRequest?.id}? The request will be withdrawn and no leave balance will be consumed.`}
        confirmLabel="Cancel Request"
        variant="danger"
        onConfirm={handleCancelConfirmed}
        onCancel={() => setModalAction(null)}
      />
    </div>
  );
};

