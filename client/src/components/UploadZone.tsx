import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { LANG, ACCEPTED_FILE_TYPES, FILE_TYPE_EXTENSIONS } from "@/utils/constants";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  onFileUpload: (files: File[]) => void;
}

export default function UploadZone({ onFileUpload }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFiles(files);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFiles = (files: File[]) => {
    // Validate file types
    const validFiles = files.filter(file => ACCEPTED_FILE_TYPES.includes(file.type));
    const invalidFiles = files.filter(file => !ACCEPTED_FILE_TYPES.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Ungültige Dateitypen",
        description: `Einige Dateien wurden nicht akzeptiert. Unterstützte Formate: PDF, JPEG, PNG.`,
        variant: "destructive",
      });
    }
    
    if (validFiles.length > 0) {
      onFileUpload(validFiles);
    }
  };

  const handleSelectFilesClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      id="upload-dropzone" 
      className={`upload-dropzone m-4 p-8 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center bg-white transition-all duration-200 ${isDragActive ? 'active bg-primary bg-opacity-5 border-primary' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="h-12 w-12 text-neutral-400 mb-3" />
      <h3 className="text-lg font-medium text-neutral-700 mb-1">{LANG.UPLOAD_ZONE_TITLE}</h3>
      <p className="text-neutral-500 text-sm mb-4 text-center">
        {LANG.UPLOAD_ZONE_OR}{" "}
        <span 
          className="text-primary cursor-pointer hover:underline"
          onClick={handleSelectFilesClick}
        >
          {LANG.UPLOAD_ZONE_SELECT_FILES}
        </span>
      </p>
      <p className="text-neutral-400 text-xs text-center">{LANG.UPLOAD_ZONE_FORMATS}</p>
      
      <input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept={ACCEPTED_FILE_TYPES.join(",")}
        onChange={handleFileInputChange}
      />
    </div>
  );
}
