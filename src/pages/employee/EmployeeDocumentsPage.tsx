import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { FileUpload } from '../../components/common/FileUpload';
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  FileCheck,
  Search,
  X
} from 'lucide-react';
import { DocumentItem } from '../../types';

export const EmployeeDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { documents, addDocument, deleteDocument } = useAppData();
  const { success, error } = useToast();

  const employeeId = user?.employeeId || 'EMP002';
  const myDocs = documents.filter(d => d.employeeId === employeeId);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DocumentItem['documentType']>('Medical Certificate');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      error('Please provide a document title.');
      return;
    }
    if (!uploadedFile) {
      error('Please upload a file.');
      return;
    }

    addDocument({
      employeeId,
      employeeName: user?.name || 'Sarah Johnson',
      title: docTitle,
      documentType: docType,
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.type,
      fileDataUrl: uploadedFile.dataUrl
    });

    success('Document uploaded to your employee vault.');
    setUploadModalOpen(false);
    setDocTitle('');
    setUploadedFile(null);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete document "${title}"?`)) {
      deleteDocument(id);
      success('Document removed.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Employee' }, { label: 'My Documents' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Document Vault</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Store and access your identity proofs, tax declarations, medical prescriptions, and contracts.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
        >
          <UploadCloud className="w-4 h-4 mr-1.5" />
          Upload Document
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myDocs.map(doc => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200">
                  {doc.documentType}
                </span>
              </div>

              <h4 className="text-sm font-bold text-gray-900 mt-3 truncate">{doc.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.fileName}</p>

              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                <span>Uploaded: {doc.uploadDate}</span>
                <span>{doc.fileSize}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
              {doc.fileDataUrl ? (
                <a
                  href={doc.fileDataUrl}
                  download={doc.fileName}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={() => success(`Simulated download for ${doc.fileName}`)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Download Mock"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(doc.id, doc.title)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {myDocs.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">No documents found in your vault.</p>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setUploadModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100 p-6 z-10">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Upload to Document Vault</h3>
                <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Health Insurance Certificate"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-600 bg-gray-50"
                  >
                    <option value="ID Proof">ID Proof</option>
                    <option value="Contract">Contract</option>
                    <option value="Medical Certificate">Medical Certificate</option>
                    <option value="Leave Attachment">Leave Attachment</option>
                    <option value="Tax Document">Tax Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <FileUpload onFileSelected={setUploadedFile} label="File" />
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

