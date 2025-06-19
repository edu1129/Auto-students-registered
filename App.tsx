
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import FileUpload from './components/ImageUpload';
import StudentForm from './components/StudentForm';
import DownloadManager from './components/DownloadButton';
import Spinner from './components/Spinner';
import ProcessingProgress from './components/ProcessingProgress';
import { StudentData } from './types';
import { extractStudentDataFromImage } from './services/geminiService';

const PROCESSING_DELAY_MS = 200; 

const AiThinkingIcon: React.FC<{className?: string}> = ({className = "w-6 h-6"}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15-3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 15v1.5M12 5.25v-1.5m0 15v1.5M12 12a2.25 2.25 0 00-2.25 2.25c0 1.21.758 2.34 2.25 2.25S14.25 15.46 14.25 14.25A2.25 2.25 0 0012 12zm0 0V6.75A2.25 2.25 0 009.75 9c-1.21 0-2.34.758-2.25 2.25S8.54 13.5 9.75 13.5H12z" />
  </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const PlayCircleIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A.75.75 0 008 7.69v4.62A.75.75 0 009.555 12.832l3.261-2.31a.75.75 0 000-1.348L9.555 7.168z" clipRule="evenodd" />
    </svg>
);


const App: React.FC = () => {
  const [allStudentsData, setAllStudentsData] = useState<StudentData[] | null>(null);
  const [displayedStudents, setDisplayedStudents] = useState<StudentData[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false); // General loading for processing steps
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false); // Specific for AI image analysis
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFileForProcessing, setSelectedFileForProcessing] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // For image previews from FileUpload
  const [selectedFileNameForDisplay, setSelectedFileNameForDisplay] = useState<string | null>(null); // Filename for progress display

  const [processingStudentIndex, setProcessingStudentIndex] = useState<number | null>(null);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [isFullyProcessed, setIsFullyProcessed] = useState<boolean>(false);

  const [customUserPrompt, setCustomUserPrompt] = useState<string>('');
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false);

  const timeoutRef = useRef<number | null>(null);

  const resetStateBeforeProcessing = () => {
    setAllStudentsData(null);
    setDisplayedStudents([]);
    // Don't reset imagePreviewUrl or selectedFileNameForDisplay here if they are set by FileUpload immediately
    setProcessingStudentIndex(null);
    setProcessedCount(0);
    setIsFullyProcessed(false);
    setError(null);
    setIsLoading(false); // Should be set true when processing starts
    setIsAiAnalyzing(false); // Should be set true when AI processing starts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Call this when a new file is chosen, to clear out old processing results.
  const resetForNewFileSelection = () => {
    resetStateBeforeProcessing(); // Clear all processing related states
    setSelectedFileForProcessing(null); // Clear the staged file
    setImagePreviewUrl(null); // Clear preview from previous file
    setSelectedFileNameForDisplay(null); // Clear display name
  };


  const handleFileSelectForStaging = useCallback((file: File) => {
    resetForNewFileSelection(); // Reset everything when a new file is selected
    setSelectedFileForProcessing(file);
    setSelectedFileNameForDisplay(file.name); // Keep this for display in progress
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setImagePreviewUrl(null); // No preview for non-image files
    }
  }, []);


  const triggerFileAnalysis = async () => {
    if (!selectedFileForProcessing) {
      setError("No file selected for processing.");
      return;
    }
    
    resetStateBeforeProcessing(); // Clear previous processing states, but keep selected file info
    setIsLoading(true); // Master loading indicator for the whole process

    const file = selectedFileForProcessing;

    try {
      let extractedData: StudentData[] = [];

      if (file.type.startsWith('image/')) {
        setIsAiAnalyzing(true); // Specific AI analysis phase
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Image = (reader.result as string).split(',')[1];
            // imagePreviewUrl is already set by handleFileSelectForStaging
            extractedData = await extractStudentDataFromImage(base64Image, customUserPrompt);
            setIsAiAnalyzing(false); // AI analysis part done
            if (extractedData.length === 0) {
              setError("AI could not find any student data in the image, or the format was not recognized. Please try a clearer image, a different register, or adjust your custom prompt if used.");
              setAllStudentsData([]); 
            } else {
              setAllStudentsData(extractedData);
            }
          } catch (err) {
            setIsAiAnalyzing(false); // AI analysis failed
            handleProcessingError(err);
          }
        };
        reader.onerror = () => {
          setIsAiAnalyzing(false);
          handleProcessingError(new Error("Failed to read image file."));
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const fileContent = reader.result as string;
            const jsonData = JSON.parse(fileContent);
            if (Array.isArray(jsonData) && jsonData.every(item => typeof item === 'object')) {
              extractedData = jsonData as StudentData[];
               if (extractedData.length === 0) {
                setError("JSON file is empty or contains no student data.");
                setAllStudentsData([]);
              } else {
                setAllStudentsData(extractedData);
              }
            } else {
              throw new Error("Invalid JSON format. Expected an array of student objects.");
            }
            // setIsLoading(false); // Iterative display will handle this in useEffect
          } catch (err) {
            handleProcessingError(err);
          }
        };
        reader.onerror = () => handleProcessingError(new Error("Failed to read JSON file."));
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const fileContent = reader.result as string; 
            setError("XLSX parsing is illustrative. This demo attempts text-based interpretation. For robust XLSX, ensure it's simple or use the 'xlsx' library with ArrayBuffer.");
            try {
                const jsonData = JSON.parse(fileContent); 
                 if (Array.isArray(jsonData)) {
                    extractedData = jsonData as StudentData[];
                    setAllStudentsData(extractedData);
                    setError(null); 
                 } else { throw new Error("Content not a JSON array.");}
            } catch (e) {
                console.warn("Could not parse XLSX as JSON directly. File might be binary.", e);
                setError("Failed to parse XLSX as simple JSON. For complex XLSX, a dedicated library and binary reading method is needed. Please use image or JSON for now, or ensure XLSX is a very simple, text-convertible format.");
                setAllStudentsData([]);
            }
            // setIsLoading(false); // Iterative display will handle this
          } catch (err) {
            handleProcessingError(err);
          }
        };
        reader.onerror = () => handleProcessingError(new Error("Failed to read XLSX file."));
        reader.readAsText(file); 
      } else {
        setError(`Unsupported file type: ${file.type || file.name}. Please upload an image, JSON, or XLSX file.`);
        setIsLoading(false); // Stop master loading if unsupported type before any async ops
      }
    } catch (err) {
      handleProcessingError(err);
    }
  };

  const handleProcessingError = (err: any) => {
    if (err instanceof Error) {
      setError(`Error: ${err.message}.`);
    } else {
      setError("An unknown error occurred during file processing.");
    }
    console.error(err);
    setAllStudentsData([]); 
    setIsLoading(false); // Stop master loading
    setIsAiAnalyzing(false); // Stop AI specific loading
    setIsFullyProcessed(true); 
  };

  useEffect(() => {
    if (isAiAnalyzing) return; // Don't start iterative display if AI is still working

    if (allStudentsData && !isFullyProcessed) {
      // setIsLoading(true); // This should already be true from triggerFileAnalysis
      if (allStudentsData.length === 0 && !error) { 
        setIsFullyProcessed(true);
        setIsLoading(false);
        return;
      }
      
      if (allStudentsData.length > 0 && processedCount < allStudentsData.length) {
        setProcessingStudentIndex(processedCount);
        timeoutRef.current = window.setTimeout(() => {
          setDisplayedStudents(prev => [...prev, allStudentsData[processedCount]]);
          setProcessedCount(prev => prev + 1);
        }, PROCESSING_DELAY_MS);
      } else if (processedCount === allStudentsData.length && allStudentsData.length > 0) {
        setIsFullyProcessed(true);
        setProcessingStudentIndex(null);
        setIsLoading(false);
      } else if (allStudentsData.length === 0) { // If it was an empty array from start
        setIsFullyProcessed(true);
        setIsLoading(false);
      }
    } else if (allStudentsData === null && !isLoading && !isAiAnalyzing) {
       // This case means nothing has started, or everything is reset.
      setIsLoading(false);
    }
     return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [allStudentsData, processedCount, isFullyProcessed, error, isAiAnalyzing, isLoading]);


  const handleUpdateStudent = useCallback((index: number, updatedData: StudentData) => {
    setDisplayedStudents(prevStudents =>
      prevStudents.map((student, i) => (i === index ? updatedData : student))
    );
    if (allStudentsData) { // allStudentsData should be source of truth for downloads
        setAllStudentsData(prevAll => 
            prevAll!.map((student, i) => {
                 // Match based on a more stable ID if possible, here using index from displayedStudents
                 // This assumes displayedStudents is a direct subset and in order of allStudentsData initially
                 if (prevAll && prevAll[index] && prevAll[index].RollNumber === displayedStudents[index].RollNumber) {
                    return i === index ? updatedData : student;
                 }
                 // If not a direct map (e.g. sorting/filtering later), a more robust find is needed.
                 // For now, this direct index map is okay for this app's flow.
                 return student; // Fallback, should ideally match robustly.
            })
        );
    }
  }, [allStudentsData, displayedStudents]); // Added displayedStudents dependency
  
  const clearImagePreviewOnly = useCallback(() => {
    // This is called by FileUpload, but we control preview via selectedFileForProcessing
    // So, this might not be strictly needed if FileUpload defers preview to App's state.
    // For now, keep it as it might be used internally by FileUpload for its own local preview state if any.
    // The main imagePreviewUrl is controlled by App.tsx via selectedFileForProcessing.
  }, []);

  const noDataFoundAfterProcessing = allStudentsData && allStudentsData.length === 0 && isFullyProcessed && !error;
  const isInteractionDisabled = isLoading || isAiAnalyzing; // Simplified general disabling condition

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="space-y-8">
          <FileUpload
            onFileSelect={handleFileSelectForStaging}
            isLoading={isInteractionDisabled} 
            currentImagePreviewUrl={imagePreviewUrl} // App controls this preview
            clearPreview={clearImagePreviewOnly}
          />

          <div className="max-w-2xl mx-auto space-y-3">
            <button
                onClick={() => setShowPromptInput(!showPromptInput)}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-left text-sky-300 bg-slate-800 hover:bg-slate-700 rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-sky-500 focus-visible:ring-opacity-75 transition-colors"
                aria-expanded={showPromptInput}
                aria-controls="custom-prompt-area"
                disabled={isInteractionDisabled}
            >
                <span>Custom AI Prompt (Optional - For Image Uploads)</span>
                <ChevronDownIcon className={`w-5 h-5 text-sky-400 transform transition-transform duration-200 ${showPromptInput ? 'rotate-180' : ''}`} />
            </button>
            {showPromptInput && (
                <div id="custom-prompt-area" className="p-4 bg-slate-800 rounded-b-lg shadow-inner">
                    <textarea
                        value={customUserPrompt}
                        onChange={(e) => setCustomUserPrompt(e.target.value)}
                        placeholder="Enter your custom instructions for the AI to extract data from the image. If empty, the default optimized prompt will be used."
                        rows={5}
                        className="w-full p-3 bg-slate-700/80 border border-slate-600 rounded-md text-gray-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                        disabled={isInteractionDisabled}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                        This prompt will only be used if you upload an image file. Leave empty to use the default.
                    </p>
                </div>
            )}
            <button
                onClick={triggerFileAnalysis}
                disabled={!selectedFileForProcessing || isInteractionDisabled}
                className="w-full flex items-center justify-center px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <PlayCircleIcon className="w-5 h-5 mr-2" />
                {isInteractionDisabled ? 'Processing...' : 'Generate Student Data'}
            </button>
          </div>


          {isAiAnalyzing && (
            <div className="flex flex-col items-center justify-center my-8 p-6 bg-slate-800 rounded-lg shadow-xl border border-sky-500/30">
              <AiThinkingIcon className="w-12 h-12 text-sky-400 animate-pulse mb-4" />
              <p className="text-xl font-semibold text-sky-300 mb-1">AI is analyzing the image</p>
              <p className="text-slate-400 thinking-dots">Please wait<span>.</span><span>.</span><span>.</span></p>
            </div>
          )}
          
          {/* General spinner for iterative display after AI/parsing if it's still loading and not AI specific */}
          {isLoading && !isAiAnalyzing && (!allStudentsData || (allStudentsData && !isFullyProcessed)) && <Spinner />}
          
          {error && (
            <div className="bg-red-800/60 border border-red-600 text-red-200 px-6 py-4 rounded-lg shadow-lg my-4 flex items-start space-x-3" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-300 flex-shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <strong className="font-bold block">Encountered an issue!</strong>
                <span className="block text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Show ProcessingProgress if data has been fetched (allStudentsData is not null) AND AI is not analyzing (meaning data is ready or being parsed/iterated) AND (there's data OR (it's not fully processed AND general loading is active)) */}
          {allStudentsData && selectedFileNameForDisplay && !isAiAnalyzing && ( (allStudentsData.length > 0) || (!isFullyProcessed && isLoading) ) && (
            <ProcessingProgress
              studentsData={allStudentsData}
              processedCount={processedCount}
              currentlyProcessingIndex={processingStudentIndex}
              isFullyProcessed={isFullyProcessed}
              fileName={selectedFileNameForDisplay}
            />
          )}
          
          {displayedStudents.length > 0 && (
            <div className={`mt-8 p-2 sm:p-6 bg-slate-800/50 rounded-xl shadow-2xl border border-slate-700/50 transition-opacity duration-500 ${isFullyProcessed ? 'opacity-100' : 'opacity-80'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
                <h2 className="text-2xl font-semibold text-sky-300 mb-3 sm:mb-0">Student Information Forms</h2>
                <DownloadManager data={allStudentsData || displayedStudents} disabled={isInteractionDisabled || displayedStudents.length === 0} filenamePrefix={selectedFileNameForDisplay ? selectedFileNameForDisplay.split('.')[0] : "student_records"}/>
              </div>
              <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 pb-2 custom-scrollbar">
                {displayedStudents.map((student, index) => (
                  <StudentForm
                    key={student.RollNumber ? `${student.RollNumber}-${index}` : `student-${index}-${new Date().getTime()}`} // Ensure more unique key
                    studentData={student}
                    index={index}
                    onUpdateStudent={handleUpdateStudent}
                    isInitiallyOpen={index === 0 && displayedStudents.length === 1}
                  />
                ))}
              </div>
            </div>
          )}
          
          {noDataFoundAfterProcessing && (
             <div className="mt-8 text-center text-gray-400 p-6 bg-slate-800 rounded-lg shadow-md border border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-slate-500 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.5 4.5 0 0018 14.5V11a6 6 0 00-12 0v3.5a4.5 4.5 0 002.818 4.218M15.182 16.318a4.5 4.5 0 11-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">Analysis of <span className="font-semibold text-slate-300">{selectedFileNameForDisplay}</span> complete.</p>
                <p>No student data was found or extracted from this file.</p>
             </div>
          )}

          {/* Initial state message - only show if no file selected AND not loading/error */}
          {!selectedFileForProcessing && !isInteractionDisabled && !error && (
            <div className="mt-12 text-center">
              <div className="bg-slate-800 p-8 sm:p-10 rounded-xl shadow-xl max-w-lg mx-auto border border-slate-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-sky-500 mb-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <h2 className="text-2xl font-semibold text-sky-300 mb-3">Welcome to the Platform!</h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  Upload an image, JSON, or XLSX file with student details.
                  Optionally provide custom instructions for image analysis. Then, click "Generate Student Data" to begin.
                </p>
                 <button 
                    onClick={() => document.getElementById('fileUpload')?.click()}
                    className="mt-6 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-all duration-150 ease-in-out"
                  >
                    Select File to Upload
                  </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-slate-500 border-t border-slate-700/50 mt-12">
        Intelligent Student Data Platform &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
