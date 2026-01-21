import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { getBeneficiaries, Beneficiary } from './AddBeneficiaryModal';
import { Building, User } from 'lucide-react';

interface BeneficiaryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectBeneficiary?: (beneficiary: Beneficiary) => void;
  placeholder?: string;
  required?: boolean;
  filterType?: 'internal' | 'external' | 'all';
  className?: string;
}

export default function BeneficiaryAutocomplete({
  value,
  onChange,
  onSelectBeneficiary,
  placeholder = 'Enter account number',
  required = false,
  filterType = 'all',
  className = '',
}: BeneficiaryAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Beneficiary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 0) {
      const allBeneficiaries = getBeneficiaries();
      let filtered = allBeneficiaries.filter(b => {
        const matchesType = filterType === 'all' || b.type === filterType;
        const matchesSearch = 
          b.accountNumber.toLowerCase().includes(inputValue.toLowerCase()) ||
          b.name.toLowerCase().includes(inputValue.toLowerCase());
        return matchesType && matchesSearch;
      });

      // Limit to 5 suggestions
      filtered = filtered.slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectBeneficiary = (beneficiary: Beneficiary) => {
    onChange(beneficiary.accountNumber);
    setShowSuggestions(false);
    
    if (onSelectBeneficiary) {
      onSelectBeneficiary(beneficiary);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectBeneficiary(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    if (value.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((beneficiary, index) => (
            <div
              key={beneficiary.id}
              onClick={() => handleSelectBeneficiary(beneficiary)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-full ${
                    beneficiary.type === 'internal'
                      ? 'bg-blue-100 dark:bg-blue-950'
                      : 'bg-purple-100 dark:bg-purple-950'
                  }`}>
                    {beneficiary.type === 'internal' ? (
                      <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{beneficiary.name}</p>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {beneficiary.accountNumber}
                    </p>
                    {beneficiary.type === 'external' && beneficiary.bankName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {beneficiary.bankName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
