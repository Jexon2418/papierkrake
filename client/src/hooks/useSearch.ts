import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UIDocument } from "@shared/schema";
import { db } from "@/lib/db";

export function useSearch() {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UIDocument[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Load recent searches from IndexedDB on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const searches = await db.searchHistory
          .orderBy('timestamp')
          .reverse()
          .limit(5)
          .toArray();
        
        setRecentSearches(searches.map(s => s.query));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    };
    
    loadRecentSearches();
  }, []);

  // Perform search
  const searchDocuments = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }
    
    setIsSearching(true);
    setSearchQuery(query);
    
    try {
      const response = await apiRequest('GET', `/api/documents/search?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      
      setSearchResults(data.documents || []);
      
      // Save search to history
      try {
        await db.searchHistory.add({
          query: query.trim(),
          timestamp: new Date(),
          resultCount: data.documents?.length || 0
        });
        
        // Update recent searches
        const searches = await db.searchHistory
          .orderBy('timestamp')
          .reverse()
          .limit(5)
          .toArray();
        
        setRecentSearches(searches.map(s => s.query));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
      
      return data.documents || [];
    } catch (error) {
      toast({
        title: "Suchfehler",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // Use a recent search
  const useRecentSearch = useCallback((query: string) => {
    searchDocuments(query);
  }, [searchDocuments]);

  // Clear search history
  const clearSearchHistory = useCallback(async () => {
    try {
      await db.searchHistory.clear();
      setRecentSearches([]);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    recentSearches,
    searchDocuments,
    clearSearch,
    useRecentSearch,
    clearSearchHistory
  };
}
