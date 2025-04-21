import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";

export function useOfflineSync() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState<number>(0);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineDocuments();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check for pending documents
    countPendingDocuments();
    
    // If online at start, try syncing
    if (navigator.onLine) {
      syncOfflineDocuments();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save document to IndexedDB for offline use
  const saveOfflineDocument = useCallback(async (file: File) => {
    try {
      // Read file as array buffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      
      // Save to IndexedDB
      await db.offlineDocuments.add({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        data: arrayBuffer,
        timestamp: new Date(),
        syncStatus: 'pending'
      });
      
      // Update pending count
      countPendingDocuments();
      
      return true;
    } catch (error) {
      console.error('Failed to save offline document:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Das Dokument konnte nicht für die spätere Synchronisierung gespeichert werden.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Count pending documents
  const countPendingDocuments = useCallback(async () => {
    try {
      const count = await db.offlineDocuments
        .where('syncStatus')
        .equals('pending')
        .count();
      
      setPendingUploads(count);
      return count;
    } catch (error) {
      console.error('Failed to count pending documents:', error);
      return 0;
    }
  }, []);

  // Sync offline documents when online
  const syncOfflineDocuments = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      // Get all pending documents
      const pendingDocs = await db.offlineDocuments
        .where('syncStatus')
        .equals('pending')
        .toArray();
      
      if (pendingDocs.length === 0) return;
      
      // Notify user
      toast({
        title: "Synchronisierung läuft",
        description: `${pendingDocs.length} Dokumente werden hochgeladen...`,
      });
      
      // Process each document
      let successCount = 0;
      
      for (const doc of pendingDocs) {
        try {
          // Create file from array buffer
          const file = new File([doc.data], doc.fileName, { type: doc.fileType });
          
          // Create FormData
          const formData = new FormData();
          formData.append('file', file);
          
          // Send request
          const token = localStorage.getItem('token');
          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }
          
          // Mark as synced
          await db.offlineDocuments.update(doc.id!, { syncStatus: 'synced' });
          successCount++;
        } catch (error) {
          console.error(`Failed to sync document ${doc.fileName}:`, error);
          // Mark as failed - we'll retry on next sync
          await db.offlineDocuments.update(doc.id!, { 
            syncStatus: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Update pending count
      await countPendingDocuments();
      
      // Notify user of results
      if (successCount > 0) {
        toast({
          title: "Synchronisierung abgeschlossen",
          description: `${successCount} von ${pendingDocs.length} Dokumente erfolgreich hochgeladen.`,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Synchronisierungsfehler",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  }, [toast, countPendingDocuments]);

  // Clean up synced documents (older than 7 days)
  const cleanupSyncedDocuments = useCallback(async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      await db.offlineDocuments
        .where('syncStatus')
        .equals('synced')
        .and(item => item.timestamp < oneWeekAgo)
        .delete();
    } catch (error) {
      console.error('Failed to cleanup synced documents:', error);
    }
  }, []);

  return {
    isOnline,
    pendingUploads,
    saveOfflineDocument,
    syncOfflineDocuments,
    cleanupSyncedDocuments
  };
}
