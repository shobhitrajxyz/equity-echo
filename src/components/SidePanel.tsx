import React, { useState } from 'react';
import { StockData, Watchlist } from '../types/chart';
import { Bookmark, Calendar, Plus, Trash2, ChevronDown, Check, X, Info } from 'lucide-react';

interface SidePanelProps {
  currentStock: StockData;
  allStocks: Record<string, StockData>;
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onSelectWatchlist: (id: string) => void;
  onCreateWatchlist: (name: string) => void;
  onDeleteWatchlist: (id: string) => void;
  onRemoveStockFromWatchlist: (watchlistId: string, symbol: string) => void;
  onSelectStock: (symbol: string) => void;
  isDarkMode: boolean;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  currentStock,
  allStocks,
  watchlists,
  activeWatchlistId,
  onSelectWatchlist,
  onCreateWatchlist,
  onDeleteWatchlist,
  onRemoveStockFromWatchlist,
  onSelectStock,
  isDarkMode,
}) => {
  const [isWatchlistDropdownOpen, setIsWatchlistDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlistName.trim()) {
      onCreateWatchlist(newWatchlistName.trim());
      setNewWatchlistName('');
      setIsCreating(false);
    }
  };

  return (
    <aside className={`w-72 border-l flex flex-col select-none ${
      isDarkMode ? 'bg-[#1a1f2c] border-[#2a3142] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Unlimited Watchlists Manager Section */}
      <div className="p-3 border-b border-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Watchlists</span>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-1 text-[10px] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 font-semibold px-2 py-0.5 rounded border border-emerald-500/30 transition-colors"
            title="Create New Watchlist"
          >
            <Plus className="w-3 h-3" />
            <span>New List</span>
          </button>
        </div>

        {/* Watchlist Dropdown Switcher */}
        <div className="relative mb-3">
          <button
            onClick={() => setIsWatchlistDropdownOpen(!isWatchlistDropdownOpen)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border text-xs font-bold transition-colors ${
              isDarkMode
                ? 'bg-[#12161f] border-[#2a3142] hover:border-emerald-500 text-slate-100'
                : 'bg-slate-100 border-slate-300 hover:border-emerald-500 text-slate-800'
            }`}
          >
            <span className="truncate">{activeWatchlist?.name || 'Default Watchlist'}</span>
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="text-[10px] font-normal">({activeWatchlist?.symbols.length || 0})</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </button>

          {isWatchlistDropdownOpen && (
            <div className={`absolute top-full left-0 mt-1 w-full rounded-lg shadow-xl border z-50 py-1 ${
              isDarkMode ? 'bg-[#1a1f2c] border-[#2a3142] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              {watchlists.map(w => (
                <div
                  key={w.id}
                  className={`flex items-center justify-between px-3 py-1.5 hover:bg-emerald-600/10 text-xs transition-colors ${
                    w.id === activeWatchlistId ? 'bg-emerald-600/15 font-bold text-emerald-400' : ''
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectWatchlist(w.id);
                      setIsWatchlistDropdownOpen(false);
                    }}
                    className="flex-1 text-left truncate mr-2"
                  >
                    {w.name} ({w.symbols.length})
                  </button>
                  {watchlists.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteWatchlist(w.id);
                      }}
                      className="text-slate-400 hover:text-rose-400 p-0.5"
                      title="Delete Watchlist"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inline Create Watchlist Modal */}
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-3 p-2 rounded-md bg-emerald-600/10 border border-emerald-500/30">
            <div className="text-[11px] font-bold text-emerald-400 mb-1">Create New Watchlist</div>
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={newWatchlistName}
                onChange={e => setNewWatchlistName(e.target.value)}
                placeholder="e.g. Breakout Stocks..."
                autoFocus
                className={`flex-1 text-xs px-2 py-1 rounded outline-none border ${
                  isDarkMode ? 'bg-[#12161f] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button type="submit" className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Active Watchlist Stock List */}
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {(!activeWatchlist || activeWatchlist.symbols.length === 0) ? (
            <div className="text-xs text-slate-500 py-3 text-center">
              No stocks in this list. Use the search bar to add stocks!
            </div>
          ) : (
            activeWatchlist.symbols.map(sym => {
              const stock = allStocks[sym] || {
                symbol: sym,
                name: sym,
                currentPrice: 100,
                change: 0,
                changePercent: 0
              };
              const isPos = stock.change >= 0;
              const isSelected = stock.symbol === currentStock.symbol;

              return (
                <div
                  key={sym}
                  className={`w-full flex items-center justify-between p-2 rounded-md transition-colors text-xs border ${
                    isSelected
                      ? 'bg-emerald-600/15 border-emerald-500/30 font-semibold text-emerald-400'
                      : isDarkMode ? 'border-transparent hover:bg-slate-800/60' : 'border-transparent hover:bg-slate-100'
                  }`}
                >
                  <button
                    onClick={() => onSelectStock(sym)}
                    className="flex-1 text-left truncate mr-2"
                  >
                    <div className="font-bold">{stock.symbol}</div>
                    <div className="text-[10px] text-slate-400 truncate w-24">{stock.name}</div>
                  </button>

                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-mono font-bold">₹{stock.currentPrice.toFixed(2)}</div>
                      <div className={`text-[10px] font-semibold ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveStockFromWatchlist(activeWatchlist.id, sym);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-60 hover:opacity-100 transition-opacity"
                      title="Remove from list"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Corporate Events Timeline */}
      <div className="p-3 border-b border-slate-700/30 flex-1 overflow-y-auto">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>Corporate Actions & Events</span>
        </div>

        {currentStock.events.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">No corporate events recorded</div>
        ) : (
          <div className="space-y-2.5 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-slate-700/40">
            {currentStock.events.map((ev, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs relative z-10 pl-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow"
                  style={{ backgroundColor: ev.color }}
                >
                  {ev.type[0]}
                </div>
                <div className={`p-2 rounded-md border flex-1 ${
                  isDarkMode ? 'bg-[#12161f] border-[#2a3142]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>{ev.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{ev.date}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">{ev.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equity Echo Summary Footer */}
      <div className="p-3 bg-emerald-600/10 border-t border-emerald-500/20">
        <div className="flex items-center space-x-1 text-xs font-bold text-emerald-400 mb-1">
          <Info className="w-3.5 h-3.5" />
          <span>Equity Echo Pro</span>
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed">
          High performance 3-tier Canvas charting engine for Indian Equities (NSE & BSE).
        </div>
      </div>
    </aside>
  );
};
