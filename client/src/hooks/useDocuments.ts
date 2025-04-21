import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, UIDocument } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useDocuments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<UIDocument[]>([]);
  
  // Fetch all documents
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/documents'],
    onSuccess: (data) => {
      if (data?.documents) {
        setDocuments(data.documents);
      }
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Laden der Dokumente",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  });
  
  // Fetch documents by category
  const fetchDocumentsByCategory = useCallback(async (category: string) => {
    try {
      const response = await apiRequest('GET', `/api/documents?category=${category}`);
      const data = await response.json();
      setDocuments(data.documents || []);
      return data.documents;
    } catch (error) {
      toast({
        title: "Fehler beim Laden der Dokumente",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Fetch documents by status
  const fetchDocumentsByStatus = useCallback(async (status: string) => {
    try {
      const response = await apiRequest('GET', `/api/documents/status?type=${status}`);
      const data = await response.json();
      setDocuments(data.documents || []);
      return data.documents;
    } catch (error) {
      toast({
        title: "Fehler beim Laden der Dokumente",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Search documents
  const searchDocuments = useCallback(async (query: string) => {
    try {
      const response = await apiRequest('GET', `/api/documents/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setDocuments(data.documents || []);
      return data.documents;
    } catch (error) {
      toast({
        title: "Fehler bei der Suche",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Dokument gelöscht",
        description: "Das Dokument wurde erfolgreich gelöscht.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Löschen",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  });

  return {
    documents,
    isLoading,
    fetchDocuments: refetch,
    fetchDocumentsByCategory,
    fetchDocumentsByStatus,
    searchDocuments,
    deleteDocument: deleteDocumentMutation.mutate,
    refetch,
  };
}
