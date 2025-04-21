import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UIDocument } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function useUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { saveOfflineDocument } = useOfflineSync();
  const [uploadingDocuments, setUploadingDocuments] = useState<UIDocument[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file: File) => {
    // Generate unique ID for tracking this upload
    const uploadId = Date.now();
    
    // Create a temporary document to show in UI
    const tempDocument: UIDocument = {
      id: uploadId,
      userId: 0, // Will be set by server
      filename: file.name,
      originalFilename: file.name,
      fileType: file.type.split('/')[1].toUpperCase(),
      fileSize: file.size,
      status: 'PROCESSING',
      isOffline: false,
      createdAt: new Date(),
      isUploading: true,
      progress: 0,
    };
    
    // Add to uploading documents
    setUploadingDocuments(prev => [...prev, tempDocument]);
    
    // Check if online
    if (!navigator.onLine) {
      // Store for offline sync
      await saveOfflineDocument(file);
      
      // Update temp document to show offline status
      setUploadingDocuments(prev => 
        prev.map(doc => 
          doc.id === uploadId 
            ? { ...doc, isOffline: true, progress: 100 } 
            : doc
        )
      );
      
      // Show toast
      toast({
        title: "Offline-Modus",
        description: "Das Dokument wird synchronisiert, sobald wieder eine Verbindung besteht.",
      });
      
      // Remove from uploading list after a delay
      setTimeout(() => {
        setUploadingDocuments(prev => prev.filter(doc => doc.id !== uploadId));
      }, 2000);
      
      return;
    }
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Set up upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          
          // Update progress in uploading documents
          setUploadingDocuments(prev => 
            prev.map(doc => 
              doc.id === uploadId ? { ...doc, progress } : doc
            )
          );
        }
      });
      
      // Create a promise to track completion
      const uploadPromise = new Promise<UIDocument>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.document);
            } catch (error) {
              reject(new Error("Invalid response format"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error("Network error during upload"));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error("Upload was aborted"));
        });
      });
      
      // Send the request
      xhr.open('POST', '/api/documents/upload');
      
      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
      
      // Wait for upload to complete
      const document = await uploadPromise;
      
      // Remove from uploading documents and invalidate queries
      setTimeout(() => {
        setUploadingDocuments(prev => prev.filter(doc => doc.id !== uploadId));
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      }, 1000);
      
      // Return the uploaded document
      return document;
    } catch (error) {
      // Update temp document to show error
      setUploadingDocuments(prev => 
        prev.map(doc => 
          doc.id === uploadId 
            ? { ...doc, status: 'ERROR', error: error instanceof Error ? error.message : String(error) } 
            : doc
        )
      );
      
      // Show error toast
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      
      // Remove from uploading list after a delay
      setTimeout(() => {
        setUploadingDocuments(prev => prev.filter(doc => doc.id !== uploadId));
      }, 3000);
    }
  }, [queryClient, toast, saveOfflineDocument]);

  const cancelUpload = useCallback((id: number) => {
    // Remove from uploading documents
    setUploadingDocuments(prev => prev.filter(doc => doc.id !== id));
    
    // Reset progress
    setUploadProgress(0);
    
    // Show toast
    toast({
      title: "Upload abgebrochen",
      description: "Der Datei-Upload wurde abgebrochen.",
    });
  }, [toast]);

  return {
    uploadFile,
    cancelUpload,
    uploadingDocuments,
    uploadProgress,
    hasUploads: uploadingDocuments.length > 0,
  };
}
