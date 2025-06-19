
import React, { useEffect, useRef } from 'react';
import { StudentData } from '../types';

// Enhanced Heroicons (outline style for consistency, some solid for emphasis if needed)
const CheckCircleIconSolid: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const ArrowPathIconOutline: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const EllipsisHorizontalCircleIconOutline: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
);

const DocumentCheckIconOutline: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
</svg>
);


interface ProcessingProgressProps {
  studentsData: StudentData[] | null;
  processedCount: number;
  currentlyProcessingIndex: number | null;
  isFullyProcessed: boolean;
  fileName: string | null;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  studentsData,
  processedCount,
  currentlyProcessingIndex,
  isFullyProcessed,
  fileName,
}) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (studentsData) {
      itemRefs.current = itemRefs.current.slice(0, studentsData.length);
    }
  }, [studentsData]);

  useEffect(() => {
    if (currentlyProcessingIndex !== null && itemRefs.current[currentlyProcessingIndex]) {
      itemRefs.current[currentlyProcessingIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', 
        inline: 'nearest'
      });
    }
  }, [currentlyProcessingIndex]);


  if (!studentsData || !fileName) {
    return null;
  }
  
  // Don't show if file was selected, processed, and found to be empty, unless there's an error (which App.tsx handles)
  if (studentsData.length === 0 && isFullyProcessed) { 
      return null;
  }


  const totalStudents = studentsData.length;
  const progressPercentage = totalStudents > 0 ? (processedCount / totalStudents) * 100 : 0;

  return (
    <div className="p-5 bg-slate-800/70 backdrop-blur-md rounded-xl shadow-2xl my-6 border border-slate-700/50">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
        <h3 className="text-lg font-semibold text-sky-300 mb-2 sm:mb-0">
          Processing: <span className="font-normal text-sky-400 truncate max-w-xs inline-block align-bottom">{fileName}</span>
        </h3>
        <p className="text-sm text-slate-400">
          {isFullyProcessed && totalStudents > 0 ? `Completed: ${processedCount}/${totalStudents}` : isFullyProcessed && totalStudents === 0 ? `No data found` : `Progress: ${processedCount}/${totalStudents}`}
        </p>
      </div>

      { totalStudents > 0 && (
        <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4 shadow-inner">
            <div 
            className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            ></div>
        </div>
      )}
      
      {!isFullyProcessed && currentlyProcessingIndex !== null && studentsData[currentlyProcessingIndex] && totalStudents > 0 && (
        <div className="flex items-center text-yellow-300 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg shadow">
          <ArrowPathIconOutline className="w-5 h-5 animate-spin mr-3 text-yellow-400" />
          <span className="font-medium">Adding: {studentsData[currentlyProcessingIndex].Name || `Student Record ${currentlyProcessingIndex + 1}`} (Roll: {studentsData[currentlyProcessingIndex].RollNumber || 'N/A'})</span>
        </div>
      )}
      
      {isFullyProcessed && totalStudents > 0 && (
         <div className="flex items-center text-green-300 mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg shadow">
            <DocumentCheckIconOutline className="w-6 h-6 mr-3 text-green-400" />
            <span className="font-medium">All student forms have been generated and are ready.</span>
        </div>
      )}

      {totalStudents > 0 && (
        <div ref={scrollContainerRef} className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {studentsData.map((student, index) => {
            const isProcessed = index < processedCount;
            const isProcessing = index === currentlyProcessingIndex && !isFullyProcessed;

            let icon;
            let itemClasses = "bg-slate-700/50 hover:bg-slate-700/80";
            let textClasses = "text-slate-300";
            let nameTextClasses = "font-medium";

            if (isProcessed) {
              icon = <CheckCircleIconSolid className="w-5 h-5 text-green-400 flex-shrink-0" />;
              itemClasses = "bg-slate-700/30 opacity-70";
              textClasses = "text-slate-400 line-through";
              nameTextClasses = "font-normal";
            } else if (isProcessing) {
              icon = <ArrowPathIconOutline className="w-5 h-5 text-sky-400 animate-spin flex-shrink-0" />;
              itemClasses = "bg-sky-700/40 ring-1 ring-sky-500 shadow-lg"; 
              textClasses = "text-sky-300";
            } else {
              icon = <EllipsisHorizontalCircleIconOutline className="w-5 h-5 text-slate-500 flex-shrink-0" />;
              textClasses = "text-slate-400";
            }
            
            // Using a combination of RollNumber (if available and unique enough) and index for key.
            // If RollNumber can be non-unique before full processing, index is critical.
            const key = student.RollNumber ? `progress-${student.RollNumber}-${index}` : `progress-item-${index}`;

            return (
              <div 
                key={key} 
                ref={(el: HTMLDivElement | null) => { itemRefs.current[index] = el; }}
                className={`flex items-center p-3 rounded-lg shadow transition-all duration-300 ease-in-out ${itemClasses}`}
              >
                <div className="mr-3">{icon}</div>
                <div className="flex-grow overflow-hidden">
                    <p className={`truncate text-sm ${nameTextClasses} ${textClasses}`}>
                    {student.Name || `Unnamed Student`}
                    </p>
                    <p className={`truncate text-xs ${textClasses} ${isProcessed ? 'text-slate-500' : 'text-slate-400'}`}>
                    Roll: {student.RollNumber || 'N/A'}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProcessingProgress;
