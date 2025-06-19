
import React, { useState, useCallback, ChangeEvent } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean; // General loading/processing state from App
  currentImagePreviewUrl?: string | null; // Controlled by App
  clearPreview?: () => void; // App might use this to clear its preview state if needed
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, currentImagePreviewUrl, clearPreview }) => {
  // Local state for immediate feedback on selection, App's state is source of truth for processing
  const [localFileName, setLocalFileName] = useState<string>(''); 

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLocalFileName(file.name); // Show selected file name immediately
      if (clearPreview) clearPreview(); // If App wants to clear its preview, let it.
      onFileSelect(file); // Pass file to App for staging and its own preview handling
    }
  }, [onFileSelect, clearPreview]);

  // currentImagePreviewUrl is passed from App and is the source of truth for the preview after selection
  const displayPreview = currentImagePreviewUrl;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl shadow-2xl space-y-4 transition-all duration-300 ease-in-out hover:shadow-sky-500/20">
      <label
        htmlFor="fileUpload"
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ease-in-out group
                   ${isLoading ? 'border-slate-600 bg-slate-700/50 cursor-not-allowed' : 'border-sky-600 hover:border-sky-400 bg-slate-700/30 hover:bg-slate-700/60'}`}
      >
        {displayPreview ? (
          <img src={displayPreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg p-1" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <svg className="w-12 h-12 mb-4 text-sky-500 group-hover:text-sky-400 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.046 11.03A1.5 1.5 0 0118 19.5H6.75z" />
            </svg>
            <p className="mb-2 text-lg font-medium text-sky-300 group-hover:text-sky-200 transition-colors">
              <span className="font-semibold">Drop a file or click to upload</span>
            </p>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Supports Images (PNG, JPG), JSON, and XLSX files</p>
            <p className="text-xs text-slate-500 mt-1">(Max 5MB for images)</p>
             {!displayPreview && localFileName && (
                <p className="mt-3 text-sm text-slate-400">Selected: <span className="font-medium text-slate-300">{localFileName}</span></p>
            )}
          </div>
        )}
        <input 
            id="fileUpload" 
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/jpg, application/json, .json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx" 
            disabled={isLoading} 
        />
      </label>
      {/* Display filename selected in App (if different from local, e.g. after processing starts) or local if App's isn't set yet */}
      {/* This part might be redundant if App.tsx displays the staged filename clearly near the submit button */}
      {localFileName && !displayPreview && !isLoading && (
        <p className="text-sm text-slate-400 text-center truncate px-2">
          Ready to process: <span className="font-medium text-slate-300">{localFileName}</span>
          {!localFileName.match(/\.(png|jpe?g)$/i) && " (No preview available for this type)"}
        </p>
      )}
       {localFileName && displayPreview && !isLoading && (
         <p className="text-sm text-slate-400 text-center truncate px-2">
          Image selected: <span className="font-medium text-slate-300">{localFileName}</span>
        </p>
      )}
    </div>
  );
};

export default FileUpload;
