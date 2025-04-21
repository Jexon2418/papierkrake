import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { LANG } from "@/utils/constants";

interface UploadProgressProps {
  currentFile: string;
  progress: number;
  onCancel: () => void;
}

export default function UploadProgress({ currentFile, progress, onCancel }: UploadProgressProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show toast when progress changes
  useEffect(() => {
    if (progress > 0) {
      setIsVisible(true);
    }

    // Auto-hide after completion
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    if (progress < 100) {
      onCancel();
    }
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 bg-white border border-neutral-200 shadow-lg rounded-lg p-4 w-80 transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } flex items-start`}
    >
      <div className="flex-shrink-0 mr-3">
        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-neutral-800">{LANG.UPLOADING}</h3>
        <p className="text-sm text-neutral-600 mt-1 truncate" title={currentFile}>
          {currentFile}
        </p>
        <div className="mt-2 w-full">
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      <button 
        className="ml-4 text-neutral-400 hover:text-neutral-600"
        onClick={handleClose}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
