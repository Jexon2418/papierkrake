import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LANG } from "@/utils/constants";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = LANG.SEARCH_PLACEHOLDER,
  autoFocus = false
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  
  // Update local state when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Debounce search
  const debouncedSearch = useCallback(
    (function() {
      let timeout: NodeJS.Timeout | null = null;
      
      return (searchTerm: string) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        
        timeout = setTimeout(() => {
          onChange(searchTerm);
        }, 300);
      };
    })(),
    [onChange]
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    debouncedSearch(newValue);
  };

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full py-2 px-4 pl-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        autoFocus={autoFocus}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-neutral-400" />
      </div>
    </div>
  );
}
