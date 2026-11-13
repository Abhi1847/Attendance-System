import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { formatDate } from '../../utils/dateUtils';
import {
  ClipboardList,
  Check,
  X,
  Eye,
  FileText,
  Search,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { LeaveRequest } from '../../types';

export const LeaveManagementPage: React.FC = () => {
  const { leaveRequests, approveLeave, rejectLeave } = useAppData();
  const { success, error } = useToast();

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'view' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRequests = leaveRequests.filter(req => {
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = () => {
    if (!selectedRequest) return;
    const res = approveLeave(selectedRequest.id, 'System Admin');
    if (res.success) {
      success(res.message);
    } else {
      error(res.message);
    }
    setModalAction(null);
    setSelectedRequest(null);
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    const ok = rejectLeave(selectedRequest.id, rejectionReason, 'System Admin');
    if (ok) {
      success(`Leave request ${selectedRequest.id} has been rejected.`);
    } else {
      error('Failed to reject leave request.');
    }
    setModalAction(null);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Leave Requests' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Leave Approvals & Requests</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluate, approve, or reject team leave applications. Approved leaves automatically deduct balances with priority ordering.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee, department, ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-blue-600 bg-gray-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Status Filter:</span>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterStatus === st
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5 text-center">Calendar Days</th>
                <th className="px-5 py-3.5 text-center">Deductible Days</th>
                <th className="px-5 py-3.5">Dates</th>
                <th className="px-5 py-3.5">Attachment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-4 font-mono font-bold text-gray-900">{req.id}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    <div>
                      <span>{req.employeeName}</span>
                      <span className="block text-[10px] text-gray-400 font-normal">{req.department}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">{req.leaveType}</span>
                    {req.halfDaySession && (
                      <span className="text-[10px] text-indigo-600 block">
                        ({req.halfDaySession} Half-Day)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-medium">{req.durationType}</td>
                  <td className="px-5 py-4 text-center font-semibold text-gray-700">{req.calendarDays}d</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-blue-700 text-sm">{req.deductibleDays}d</span>
                    {req.weeklyOffDaysExcluded > 0 && (
                      <span className="text-[10px] text-gray-400 block font-normal">
                        ({req.weeklyOffDaysExcluded} off day excluded)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatDate(req.startDate)}
                    {req.startDate !== req.endDate && ` to ${formatDate(req.endDate)}`}
                  </td>
                  <td className="px-5 py-4">
                    {req.attachmentName ? (
                      <span className="inline-flex items-center text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        {req.attachmentName.slice(0, 12)}...
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
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
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setModalAction('approve');
                          }}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setModalAction('reject');
                          }}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition"
                          title="Reject"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    No leave requests match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {modalAction === 'view' && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setModalAction(null)}
            />
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100 p-6 z-10">
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-mono text-gray-400">ID: {selectedRequest.id}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5">Leave Application Details</h3>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 uppercase text-[10px] font-semibold block">Employee</span>
                    <span className="font-bold text-gray-900">{selectedRequest.employeeName}</span>
                    <span className="block text-[10px] text-gray-400">{selectedRequest.department}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 uppercase text-[10px] font-semibold block">Leave Type</span>
                    <span className="font-bold text-blue-700">{selectedRequest.leaveType}</span>
                    <span className="block text-[10px] text-gray-400">{selectedRequest.durationType}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 uppercase text-[10px] font-semibold block">Date Duration</span>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {selectedRequest.startDate} to {selectedRequest.endDate}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Calendar Days: <b>{selectedRequest.calendarDays}</b> | Weekly Off Excluded: <b>{selectedRequest.weeklyOffDaysExcluded}</b> | Deductible: <b>{selectedRequest.deductibleDays} day(s)</b>
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 uppercase text-[10px] font-semibold block">Reason</span>
                  <p className="text-gray-700 mt-1 leading-relaxed">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                    <span className="text-rose-600 uppercase text-[10px] font-semibold block">Rejection Reason</span>
                    <p className="mt-1">{selectedRequest.rejectionReason}</p>
                  </div>
                )}

                {selectedRequest.attachmentName && (
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">{selectedRequest.attachmentName}</span>
                    </div>
                    <span className="text-[11px] text-blue-600 font-semibold">{selectedRequest.attachmentSize || 'Document'}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setModalAction(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={modalAction === 'approve'}
        title="Approve Leave Application"
        message={`Confirm approval for ${selectedRequest?.employeeName} (${selectedRequest?.deductibleDays} deductible days)? This will immediately deduct leave balance using Current-Year balance first, then Carry-Forward.`}
        confirmLabel="Approve Leave"
        variant="success"
        onConfirm={handleApprove}
        onCancel={() => setModalAction(null)}
      />

      <ConfirmationModal
        isOpen={modalAction === 'reject'}
        title="Reject Leave Application"
        message={`Are you sure you want to reject the leave request for ${selectedRequest?.employeeName}? No leave balance will be deducted.`}
        confirmLabel="Reject"
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => {
          setModalAction(null);
          setRejectionReason('');
        }}
      >
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-700 block mb-1">Rejection Reason</label>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="Provide constructive reason for employee notification..."
            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

