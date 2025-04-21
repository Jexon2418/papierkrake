import { useState, useEffect, useRef } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { LANG } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";
import SearchBar from "@/components/SearchBar";

interface HeaderProps {
  toggleSidebar: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function Header({ toggleSidebar, onSearch, searchQuery }: HeaderProps) {
  const { user } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close mobile search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileSearch(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-neutral-200 py-2 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          id="menu-toggle" 
          className="md:hidden mr-2 p-2 rounded hover:bg-neutral-100" 
          aria-label="Toggle menu"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </button>
        <a href="#" className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="ml-2 text-xl font-semibold text-primary">{LANG.APP_TITLE}</span>
        </a>
      </div>
      
      {/* Desktop Search */}
      <div className="hidden md:flex relative flex-1 max-w-2xl mx-4">
        <SearchBar 
          value={searchQuery} 
          onChange={(value) => onSearch(value)} 
          placeholder={LANG.SEARCH_PLACEHOLDER}
        />
      </div>
      
      <div className="flex items-center">
        {/* Mobile Search Toggle */}
        <button 
          className="md:hidden p-2 rounded-full hover:bg-neutral-100 relative mr-2" 
          aria-label="Suche"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
        >
          <Search className="h-6 w-6 text-neutral-500" />
        </button>
        
        <button className="p-2 rounded-full hover:bg-neutral-100 relative" aria-label="Benachrichtigungen">
          <Bell className="h-6 w-6 text-neutral-500" />
          <span className="absolute top-1 right-1 bg-status-error h-2 w-2 rounded-full"></span>
        </button>
        
        <div className="ml-4 flex items-center">
          <div className="h-8 w-8 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-primary font-medium">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <span className="ml-2 font-medium text-sm hidden md:block">
            {user?.fullName || user?.username || 'Benutzer'}
          </span>
        </div>
      </div>
      
      {/* Mobile Search Dropdown */}
      {showMobileSearch && (
        <div 
          ref={mobileSearchRef}
          className="absolute top-14 left-0 right-0 bg-white p-4 shadow-md z-50 border-b border-neutral-200 md:hidden"
        >
          <SearchBar 
            value={searchQuery} 
            onChange={(value) => {
              onSearch(value);
              if (!value) setShowMobileSearch(false);
            }} 
            placeholder={LANG.SEARCH_PLACEHOLDER}
            autoFocus
          />
        </div>
      )}
    </header>
  );
}
