import React, { useState, useEffect, useRef } from 'react';
import { StockSuggestion, Watchlist } from '../types/chart';
import { Search, Loader2, ArrowRight, Plus, Check } from 'lucide-react';

interface SearchAutocompleteProps {
  onSelectStock: (symbol: string) => void;
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onAddStockToWatchlist: (watchlistId: string, symbol: string) => void;
  isDarkMode: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  onSelectStock,
  watchlists,
  activeWatchlistId,
  onAddStockToWatchlist,
  isDarkMode,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.suggestions || []);
          setIsLoading(false);
          setSelectedIndex(-1);
        })
        .catch(err => {
          console.error('Search error:', err);
          setIsLoading(false);
        });
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex].symbol);
      } else if (query.trim()) {
        handleSelect(`NSE:${query.toUpperCase().trim()}`);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (symbol: string) => {
    onSelectStock(symbol);
    setQuery('');
    setIsOpen(false);
  };

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Search Bar */}
      <div
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
            : isDarkMode
            ? 'bg-[#12161f] border-[#2a3142] hover:border-slate-600'
            : 'bg-slate-100 border-slate-300 hover:border-slate-400'
        }`}
      >
        <Search className="w-4 h-4 text-emerald-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Indian stocks (NSE & BSE only)..."
          className={`w-64 md:w-80 bg-transparent border-none outline-none text-xs font-semibold placeholder:font-normal ${
            isDarkMode ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
          }`}
        />
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (query.trim().length > 0 || suggestions.length > 0) && (
        <div
          className={`absolute top-full left-0 mt-1 w-[380px] md:w-[450px] rounded-xl shadow-2xl border z-50 overflow-hidden py-1 ${
            isDarkMode ? 'bg-[#1a1f2c] border-[#2a3142] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/30 flex items-center justify-between">
            <span>Indian Equities (NSE / BSE)</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Fast Sub-50ms Search</span>
          </div>

          {suggestions.length === 0 && !isLoading ? (
            <div className="px-4 py-4 text-center text-xs text-slate-400">
              No matching Indian stock for "<strong className="text-slate-200">{query}</strong>".
              <button
                onClick={() => handleSelect(`NSE:${query.toUpperCase()}`)}
                className="mt-2 block w-full py-1.5 bg-emerald-600/20 text-emerald-400 rounded-md hover:bg-emerald-600/30 text-xs font-semibold"
              >
                Load symbol "NSE:{query.toUpperCase()}" directly
              </button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isInWatchlist = activeWatchlist?.symbols.includes(item.symbol);

                return (
                  <div
                    key={item.symbol + idx}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3.5 py-2 flex items-center justify-between transition-colors border-b last:border-none ${
                      isDarkMode ? 'border-slate-800/50' : 'border-slate-100'
                    } ${
                      isSelected
                        ? 'bg-emerald-600/15 text-emerald-400'
                        : isDarkMode
                        ? 'hover:bg-slate-800/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => handleSelect(item.symbol)}
                      className="flex-1 flex items-center space-x-3 text-left truncate mr-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
                        {item.symbol.split(':')[1]?.[0] || 'S'}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs">{item.symbol}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            item.exchange === 'NSE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {item.exchange}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          {item.name}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Add to Watchlist Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAddStockToWatchlist(activeWatchlistId, item.symbol);
                        }}
                        className={`p-1.5 rounded-md border text-xs flex items-center space-x-1 transition-colors ${
                          isInWatchlist
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : isDarkMode
                            ? 'bg-slate-800 border-slate-700 hover:border-emerald-500 text-slate-300'
                            : 'bg-slate-100 border-slate-300 hover:border-emerald-500 text-slate-700'
                        }`}
                        title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      >
                        {isInWatchlist ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleSelect(item.symbol)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
