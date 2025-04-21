import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UploadZone from "@/components/UploadZone";
import DocumentGrid from "@/components/DocumentGrid";
import UploadProgress from "@/components/UploadProgress";
import { useDocuments } from "@/hooks/useDocuments";
import { useUpload } from "@/hooks/useUpload";
import { LANG } from "@/utils/constants";
import { Document } from "@shared/schema";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState("all");
  const [currentStatusFilter, setCurrentStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { 
    documents, 
    isLoading, 
    fetchDocuments, 
    fetchDocumentsByCategory,
    fetchDocumentsByStatus,
    searchDocuments,
    refetch
  } = useDocuments();
  
  const { 
    uploadingDocuments,
    uploadProgress,
    hasUploads,
    uploadFile,
    cancelUpload
  } = useUpload();

  // Function to toggle sidebar (primarily for mobile)
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle folder changes
  const handleFolderChange = (folderId: string) => {
    setCurrentFolder(folderId);
    setCurrentStatusFilter(null);
    setSearchQuery("");
    
    if (folderId === "all") {
      fetchDocuments();
    } else {
      // Map folder IDs to categories
      const categoryMap: Record<string, string> = {
        "invoices": "INVOICE",
        "tax": "TAX",
        "complaints": "COMPLAINT",
        "other": "OTHER"
      };
      
      if (categoryMap[folderId]) {
        fetchDocumentsByCategory(categoryMap[folderId]);
      }
    }
  };

  // Handle status filter changes
  const handleStatusChange = (statusId: string) => {
    setCurrentStatusFilter(statusId);
    setCurrentFolder("");
    setSearchQuery("");
    
    fetchDocumentsByStatus(statusId);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      searchDocuments(query);
    } else {
      if (currentFolder === "all") {
        fetchDocuments();
      } else if (currentStatusFilter) {
        fetchDocumentsByStatus(currentStatusFilter);
      } else {
        // Restore previous folder view
        handleFolderChange(currentFolder);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        uploadFile(file);
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Combine backend documents with uploading documents for display
  const allDocuments = [...uploadingDocuments, ...documents];

  return (
    <div className="bg-neutral-50 text-neutral-700 h-screen flex flex-col overflow-hidden">
      <Header 
        toggleSidebar={toggleSidebar}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          currentFolder={currentFolder}
          currentStatusFilter={currentStatusFilter}
          onFolderChange={handleFolderChange}
          onStatusChange={handleStatusChange}
          onUploadClick={() => document.getElementById('file-upload')?.click()}
        />

        <div className="fixed inset-0 bg-neutral-900 bg-opacity-50 z-20 md:hidden transition-opacity duration-300"
            style={{ display: isSidebarOpen ? 'block' : 'none' }}
            onClick={() => setIsSidebarOpen(false)}>
        </div>

        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
          <UploadZone onFileUpload={handleFileUpload} />

          {/* Mobile Search - moved to Header component */}

          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-800">
                {currentStatusFilter 
                  ? currentStatusFilter === 'due' 
                    ? 'Zahlung fällig' 
                    : currentStatusFilter === 'pending' 
                      ? 'Ausstehend' 
                      : 'Nicht synchronisiert'
                  : currentFolder === 'all' 
                    ? 'Alle Dokumente' 
                    : currentFolder === 'invoices' 
                      ? 'Rechnungen' 
                      : currentFolder === 'tax' 
                        ? 'Steuer' 
                        : currentFolder === 'complaints' 
                          ? 'Beschwerden' 
                          : 'Sonstiges'}
              </h1>
              <p className="text-sm text-neutral-500">
                {allDocuments.length} {LANG.DOCUMENT_COUNT}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-neutral-200 text-neutral-800' : 'hover:bg-neutral-200 text-neutral-600'}`}
                aria-label={LANG.VIEW_LIST}
                onClick={() => setViewMode('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button 
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-neutral-200 text-neutral-800' : 'hover:bg-neutral-200 text-neutral-600'}`}
                aria-label={LANG.VIEW_GRID}
                onClick={() => setViewMode('grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <div className="relative">
                <button id="filter-btn" className="flex items-center space-x-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>{LANG.FILTER}</span>
                </button>
              </div>
            </div>
          </div>

          <DocumentGrid 
            documents={allDocuments} 
            isLoading={isLoading} 
            viewMode={viewMode}
            onCancelUpload={cancelUpload}
            onRefetch={refetch}
          />
        </main>
      </div>

      {hasUploads && (
        <UploadProgress 
          currentFile={uploadingDocuments[0]?.originalFilename || ""} 
          progress={uploadProgress}
          onCancel={() => cancelUpload(uploadingDocuments[0]?.id || 0)}
        />
      )}
    </div>
  );
}
