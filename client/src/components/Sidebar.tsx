import { FOLDERS, STATUS_ITEMS, LANG } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Cog, FileText, Clock, AlertTriangle, Cloud, LogOut } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string;
  currentStatusFilter: string | null;
  onFolderChange: (folderId: string) => void;
  onStatusChange: (statusId: string) => void;
  onUploadClick: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  currentFolder,
  currentStatusFilter,
  onFolderChange,
  onStatusChange,
  onUploadClick,
}: SidebarProps) {
  const { user, logout } = useAuth();
  
  const folderItems = [
    { id: FOLDERS.ALL.id, name: FOLDERS.ALL.name, icon: <FileText className="h-5 w-5 mr-2" />, color: "text-primary", count: 42 },
    { id: FOLDERS.INVOICES.id, name: FOLDERS.INVOICES.name, icon: <FileText className="h-5 w-5 mr-2 text-yellow-500" />, color: "", count: 16 },
    { id: FOLDERS.TAX.id, name: FOLDERS.TAX.name, icon: <FileText className="h-5 w-5 mr-2 text-blue-500" />, color: "", count: 8 },
    { id: FOLDERS.COMPLAINTS.id, name: FOLDERS.COMPLAINTS.name, icon: <FileText className="h-5 w-5 mr-2 text-red-500" />, color: "", count: 3 },
    { id: FOLDERS.OTHER.id, name: FOLDERS.OTHER.name, icon: <FileText className="h-5 w-5 mr-2 text-green-500" />, color: "", count: 15 },
  ];

  const statusItems = [
    { id: STATUS_ITEMS.PENDING.id, name: STATUS_ITEMS.PENDING.name, icon: <Clock className="h-5 w-5 mr-2 text-orange-500" />, bgColor: "bg-status-warning", count: 2 },
    { id: STATUS_ITEMS.DUE.id, name: STATUS_ITEMS.DUE.name, icon: <AlertTriangle className="h-5 w-5 mr-2 text-status-error" />, bgColor: "bg-status-error", count: 3 },
    { id: STATUS_ITEMS.OFFLINE.id, name: STATUS_ITEMS.OFFLINE.name, icon: <Cloud className="h-5 w-5 mr-2 text-neutral-500" />, bgColor: "bg-neutral-600", count: 0 },
  ];

  return (
    <>
      <aside 
        className={`w-64 bg-white border-r border-neutral-200 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:static top-0 left-0 z-30 h-full`}
      >
        <div className="p-4 md:pt-6">
          <Button 
            className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-colors duration-300"
            onClick={onUploadClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>{LANG.UPLOAD_BUTTON}</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-2">{LANG.FOLDERS_TITLE}</h2>
          <ul>
            {folderItems.map((folder) => (
              <li 
                key={folder.id} 
                className={`folder-item mb-1 ${currentFolder === folder.id && !currentStatusFilter ? 'active' : ''}`}
              >
                <a 
                  href="#" 
                  className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-neutral-100 ${
                    currentFolder === folder.id && !currentStatusFilter
                      ? 'bg-neutral-100 text-primary font-medium'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    onFolderChange(folder.id);
                  }}
                >
                  {folder.icon}
                  <span>{folder.name}</span>
                  <span className="ml-auto bg-neutral-200 text-neutral-600 text-xs rounded-full px-2 py-0.5 font-medium">{folder.count}</span>
                </a>
              </li>
            ))}
          </ul>

          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-6 px-2">{LANG.STATUS_TITLE}</h2>
          <ul>
            {statusItems.map((status) => (
              <li key={status.id} className={`folder-item mb-1 ${currentStatusFilter === status.id ? 'active' : ''}`}>
                <a 
                  href="#" 
                  className={`flex items-center px-2 py-2 text-sm rounded-lg hover:bg-neutral-100 ${
                    currentStatusFilter === status.id
                      ? 'bg-neutral-100 text-primary font-medium'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    onStatusChange(status.id);
                  }}
                >
                  {status.icon}
                  <span>{status.name}</span>
                  <span className={`ml-auto ${status.bgColor} text-white text-xs rounded-full px-2 py-0.5 font-medium`}>{status.count}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center text-sm text-neutral-600 hover:text-primary">
              <Cog className="h-5 w-5 mr-2" />
              <span>{LANG.SETTINGS}</span>
            </a>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-neutral-600 hover:text-status-error"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
