import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertTriangle, Eye, Download } from 'lucide-react';

interface FileUploadProps {
  onFileSelected?: (fileData: { name: string; size: string; type: string; dataUrl: string }) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'],
  maxSizeMB = 5,
  label = 'Upload File',
  helperText = 'PDF, PNG, JPG up to 5MB'
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit (${maxSizeMB}MB max).`);
      return;
    }

    // Progress simulation
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 30;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileObj = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type,
        dataUrl
      };
      setTimeout(() => {
        setUploadProgress(null);
        setSelectedFile(fileObj);
        if (onFileSelected) {
          onFileSelected(fileObj);
        }
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">{label}</label>
        <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
          Demo Upload (Browser Local)
        </span>
      </div>

      {!selectedFile && uploadProgress === null && (
        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50 bg-white'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              <span className="text-blue-600 font-semibold underline underline-offset-2">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">{helperText}</p>
          </div>
        </div>
      )}

      {/* Progress bar simulation */}
      {uploadProgress !== null && (
        <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-blue-900 mb-2">
            <span>Simulating secure blob storage upload...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected File Preview / Pill */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center flex-shrink-0">
              <File className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{selectedFile.size}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 inline" /> Ready
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 ml-2">
            {selectedFile.dataUrl.startsWith('data:image') && (
              <a
                href={selectedFile.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition"
                title="Preview Image"
              >
                <Eye className="w-4 h-4" />
              </a>
            )}
            <a
              href={selectedFile.dataUrl}
              download={selectedFile.name}
              className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
              title="Remove File"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

