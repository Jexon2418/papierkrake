import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { File, Edit, Download, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENT_CATEGORIES, LANG } from "@/utils/constants";
import { UIDocument } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DocumentCardProps {
  document: UIDocument;
  onCancelUpload?: (id: number) => void;
  onRefetch?: () => void;
}

export default function DocumentCard({ document, onCancelUpload, onRefetch }: DocumentCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Format date to German locale
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    return format(new Date(date), 'd. MMM yyyy', { locale: de });
  };

  const handleDownload = async () => {
    if (document.isUploading) return;
    
    if (document.downloadUrl) {
      window.open(document.downloadUrl, '_blank');
    } else {
      try {
        const response = await apiRequest('GET', `/api/documents/${document.id}`);
        const data = await response.json();
        if (data.document.downloadUrl) {
          window.open(data.document.downloadUrl, '_blank');
        }
      } catch (error) {
        toast({
          title: "Download fehlgeschlagen",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async () => {
    if (document.isUploading || isDeleting) return;
    
    if (confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      setIsDeleting(true);
      try {
        await apiRequest('DELETE', `/api/documents/${document.id}`);
        toast({
          title: "Dokument gelöscht",
          description: "Das Dokument wurde erfolgreich gelöscht.",
        });
        if (onRefetch) onRefetch();
      } catch (error) {
        toast({
          title: "Löschen fehlgeschlagen",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Get category details
  const category = document.category 
    ? DOCUMENT_CATEGORIES[document.category as keyof typeof DOCUMENT_CATEGORIES]
    : null;

  // Check if document is uploading or in an error state
  const isUploading = document.isUploading || document.status === 'PROCESSING';
  const hasError = document.status === 'ERROR';
  const isPending = document.dueDate && new Date(document.dueDate) > new Date() && !document.isPaid;
  const isDue = document.dueDate && new Date(document.dueDate) < new Date() && !document.isPaid;

  return (
    <div className="document-card relative bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Document Preview Area */}
      <div className="h-32 bg-neutral-100 relative">
        {isUploading ? (
          // Uploading state
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="mt-2 w-full px-4">
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full" 
                  style={{ width: `${document.progress || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-neutral-500 text-center mt-1">
                {document.progress === 100 ? LANG.PROCESSING : LANG.UPLOADING}
              </p>
            </div>
          </div>
        ) : document.thumbnailUrl ? (
          // Document has thumbnail
          <img 
            src={document.thumbnailUrl}
            alt={document.originalFilename}
            className="w-full h-full object-cover"
          />
        ) : (
          // Generic document icon
          <div className="w-full h-full flex items-center justify-center">
            <File className="h-10 w-10 text-neutral-400" />
          </div>
        )}
        
        {/* Category badge */}
        {category && !isUploading && (
          <div className="absolute top-2 right-2">
            <span className={`bg-${category.color}-100 text-${category.color}-800 text-xs font-medium px-2 py-0.5 rounded-full`}>
              {category.label}
            </span>
          </div>
        )}
        
        {/* Offline indicator */}
        {document.isOffline && !isUploading && (
          <div className="absolute top-0 left-0 p-1 bg-neutral-600 text-white text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
        )}
        
        {/* Due date banner */}
        {isPending && !isUploading && (
          <div className="absolute bottom-0 left-0 right-0 bg-status-warning bg-opacity-90 py-1 px-2 text-white text-xs font-medium text-center">
            Ausstehend: Aktion erforderlich
          </div>
        )}
        
        {isDue && !isUploading && (
          <div className="absolute bottom-0 left-0 right-0 bg-status-error bg-opacity-90 py-1 px-2 text-white text-xs font-medium text-center">
            Zahlung fällig: {formatDate(document.dueDate)}
          </div>
        )}
        
        {hasError && !isUploading && (
          <div className="absolute bottom-0 left-0 right-0 bg-status-error bg-opacity-90 py-1 px-2 text-white text-xs font-medium text-center">
            Fehler bei der Verarbeitung
          </div>
        )}
      </div>
      
      {/* Document Info Area */}
      <div className="p-3">
        <p className="font-medium text-neutral-800 truncate" title={document.originalFilename}>
          {document.originalFilename || document.filename}
        </p>
        <p className="text-sm text-neutral-500 mt-1">
          {isUploading 
            ? LANG.PROCESSING 
            : document.vendorName || document.filename}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            {formatDate(document.createdAt)}
          </span>
          
          {isUploading ? (
            <div className="flex items-center space-x-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="p-1 rounded-full hover:bg-neutral-100 h-auto w-auto" 
                onClick={() => onCancelUpload && onCancelUpload(document.id)}
                aria-label="Abbrechen"
              >
                <X className="h-5 w-5 text-neutral-400" />
              </Button>
            </div>
          ) : (
            <div className="document-actions flex items-center space-x-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="p-1 rounded-full hover:bg-neutral-100 h-auto w-auto" 
                aria-label={LANG.DOCUMENT_ACTIONS.EDIT}
              >
                <Edit className="h-5 w-5 text-neutral-400" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="p-1 rounded-full hover:bg-neutral-100 h-auto w-auto" 
                onClick={handleDownload}
                aria-label={LANG.DOCUMENT_ACTIONS.DOWNLOAD}
              >
                <Download className="h-5 w-5 text-neutral-400" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="p-1 rounded-full hover:bg-neutral-100 h-auto w-auto" 
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label={LANG.DOCUMENT_ACTIONS.MORE}
              >
                <MoreHorizontal className="h-5 w-5 text-neutral-400" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
