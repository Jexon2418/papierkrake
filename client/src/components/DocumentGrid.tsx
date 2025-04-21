import DocumentCard from "@/components/DocumentCard";
import { UIDocument } from "@shared/schema";
import { LANG } from "@/utils/constants";

interface DocumentGridProps {
  documents: UIDocument[];
  isLoading: boolean;
  viewMode: "grid" | "list";
  onCancelUpload?: (id: number) => void;
  onRefetch?: () => void;
}

export default function DocumentGrid({ 
  documents, 
  isLoading, 
  viewMode,
  onCancelUpload,
  onRefetch
}: DocumentGridProps) {
  // Loading state
  if (isLoading && documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 text-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-neutral-500">{LANG.LOADING}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-neutral-500 mb-2">{LANG.NO_DOCUMENTS}</p>
          <p className="text-sm text-neutral-400">
            Laden Sie Dokumente hoch, um sie hier zu sehen.
          </p>
        </div>
      </div>
    );
  }

  // List view
  if (viewMode === "list") {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Kategorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Anbieter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-neutral-100 rounded-md flex items-center justify-center">
                        {document.isUploading ? (
                          <div className="animate-spin h-5 w-5 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                          {document.originalFilename || document.filename}
                        </div>
                        {document.isUploading && (
                          <div className="mt-1 w-32">
                            <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full" 
                                style={{ width: `${document.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {document.category && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${document.category === 'INVOICE' ? 'yellow' : document.category === 'TAX' ? 'blue' : document.category === 'COMPLAINT' ? 'red' : 'green'}-100 text-${document.category === 'INVOICE' ? 'yellow' : document.category === 'TAX' ? 'blue' : document.category === 'COMPLAINT' ? 'red' : 'green'}-800`}>
                        {document.category === 'INVOICE' ? 'Rechnung' : document.category === 'TAX' ? 'Steuer' : document.category === 'COMPLAINT' ? 'Beschwerde' : 'Sonstiges'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">
                      {document.vendorName || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {document.createdAt 
                      ? new Date(document.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {document.isUploading ? (
                      <button
                        className="text-neutral-400 hover:text-neutral-600"
                        onClick={() => onCancelUpload && onCancelUpload(document.id)}
                      >
                        Abbrechen
                      </button>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          Bearbeiten
                        </button>
                        <button className="text-primary-600 hover:text-primary-900">
                          Herunterladen
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map((document) => (
          <DocumentCard 
            key={document.id} 
            document={document} 
            onCancelUpload={onCancelUpload}
            onRefetch={onRefetch}
          />
        ))}
      </div>
    </div>
  );
}
