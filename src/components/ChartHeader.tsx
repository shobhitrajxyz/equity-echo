import React, { useState } from 'react';
import { ChartType, Timeframe, IndicatorConfig, DrawingToolType, StockData, Watchlist } from '../types/chart';
import { SearchAutocomplete } from './SearchAutocomplete';
import {
  Activity,
  BarChart2,
  Sun,
  Moon
} from 'lucide-react';

interface ChartHeaderProps {
  currentStock: StockData;
  allStocks: Record<string, StockData>;
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onAddStockToWatchlist: (watchlistId: string, symbol: string) => void;
  onSelectStock: (symbol: string) => void;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  timeframe: Timeframe;
  onChangeTimeframe: (tf: Timeframe) => void;
  indicators: IndicatorConfig;
  onToggleIndicator: (key: keyof IndicatorConfig) => void;
  isLogScale: boolean;
  onToggleLogScale: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeDrawingTool: DrawingToolType;
  onChangeDrawingTool: (tool: DrawingToolType) => void;
  hoverData: { candle: any; ema20: number | null; sma50: number | null; rsi: number | null } | null;
  isLoading: boolean;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  currentStock,
  allStocks,
  watchlists,
  activeWatchlistId,
  onAddStockToWatchlist,
  onSelectStock,
  chartType,
  onChangeChartType,
  timeframe,
  onChangeTimeframe,
  indicators,
  onToggleIndicator,
  isLogScale,
  onToggleLogScale,
  isDarkMode,
  onToggleDarkMode,
  hoverData,
  isLoading,
}) => {
  const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);

  const isPositive = currentStock.change >= 0;
  const candleToShow = hoverData?.candle || (currentStock.prices.length ? currentStock.prices[currentStock.prices.length - 1] : null);

  return (
    <header className={`w-full flex flex-col border-b select-none z-30 ${
      isDarkMode ? 'bg-[#1a1f2c] border-[#2a3142] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-sm flex-wrap gap-2">
        {/* Equity Echo Brand & Stock Autocomplete */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold text-base md:text-lg tracking-tight shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold tracking-tight text-slate-100">Equity Echo</span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">INDIA EQUITIES</span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-700/50 hidden sm:block" />

          {/* Autocomplete Search Component */}
          <SearchAutocomplete
            onSelectStock={onSelectStock}
            watchlists={watchlists}
            activeWatchlistId={activeWatchlistId}
            onAddStockToWatchlist={onAddStockToWatchlist}
            isDarkMode={isDarkMode}
          />

          {/* Ticker Badge */}
          <div className="flex items-center space-x-1.5 font-bold text-xs bg-emerald-600/15 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/30">
            <span>{currentStock.symbol}</span>
            {isLoading && <span className="text-[10px] animate-pulse text-amber-400">(Loading...)</span>}
          </div>
        </div>

        {/* Stock Ticker Summary */}
        <div className="hidden lg:flex items-center space-x-4 text-xs">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-base font-bold font-mono">₹{currentStock.currentPrice.toFixed(2)}</span>
            <span className={`font-semibold font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}{currentStock.change.toFixed(2)} ({isPositive ? '+' : ''}{currentStock.changePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="text-slate-400 space-x-2">
            <span>H: <strong className="text-slate-200 font-mono">₹{currentStock.high.toFixed(2)}</strong></span>
            <span>L: <strong className="text-slate-200 font-mono">₹{currentStock.low.toFixed(2)}</strong></span>
            <span>Vol: <strong className="text-slate-200 font-mono">{(currentStock.volume / 1000).toFixed(1)}K</strong></span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`p-1.5 rounded-md border transition-colors ${
              isDarkMode ? 'bg-[#12161f] border-[#2a3142] text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Log Scale Toggle */}
          <button
            onClick={onToggleLogScale}
            className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
              isLogScale
                ? 'bg-blue-600 border-blue-500 text-white'
                : isDarkMode ? 'bg-[#12161f] border-[#2a3142] text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}
          >
            LOG
          </button>
        </div>
      </div>

      {/* Control Bar: Timeframes, Chart Type, Indicators */}
      <div className={`flex items-center justify-between px-4 py-1.5 border-t text-xs ${
        isDarkMode ? 'border-[#2a3142] bg-[#12161f]/50' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none py-0.5">
          {/* Timeframes */}
          <div className="flex items-center space-x-1 bg-slate-800/40 p-0.5 rounded border border-slate-700/40">
            {(['5m', '15m', '1D', '1W', '1M'] as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => onChangeTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  timeframe === tf
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-700/50" />

          {/* Chart Type */}
          <div className="relative">
            <button
              onClick={() => setIsChartTypeOpen(!isChartTypeOpen)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-medium ${
                isDarkMode ? 'border-[#2a3142] bg-[#1a1f2c] text-slate-200' : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="capitalize">{chartType}</span>
            </button>

            {isChartTypeOpen && (
              <div className={`absolute top-full left-0 mt-1 w-36 rounded-md shadow-lg border z-50 py-1 ${
                isDarkMode ? 'bg-[#1a1f2c] border-[#2a3142] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                {(['candlestick', 'line', 'area', 'heikinashi', 'bar'] as ChartType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      onChangeChartType(t);
                      setIsChartTypeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-emerald-600/10 ${
                      chartType === t ? 'text-emerald-400 font-bold bg-emerald-600/10' : ''
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-700/50" />

          {/* Indicators Toggle Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onToggleIndicator('ema20')}
              className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                indicators.ema20
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : isDarkMode ? 'border-[#2a3142] text-slate-400' : 'border-slate-300 text-slate-600'
              }`}
            >
              EMA 20
            </button>
            <button
              onClick={() => onToggleIndicator('sma50')}
              className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                indicators.sma50
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : isDarkMode ? 'border-[#2a3142] text-slate-400' : 'border-slate-300 text-slate-600'
              }`}
            >
              SMA 50
            </button>
            <button
              onClick={() => onToggleIndicator('rsi')}
              className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                indicators.rsi
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                  : isDarkMode ? 'border-[#2a3142] text-slate-400' : 'border-slate-300 text-slate-600'
              }`}
            >
              RSI 14
            </button>
            <button
              onClick={() => onToggleIndicator('volume')}
              className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                indicators.volume
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : isDarkMode ? 'border-[#2a3142] text-slate-400' : 'border-slate-300 text-slate-600'
              }`}
            >
              VOL
            </button>
          </div>
        </div>

        {/* OHLC Legend Info Badge */}
        {candleToShow && (
          <div className="hidden xl:flex items-center space-x-3 text-[11px] font-mono font-medium text-slate-400">
            <span>O: <strong className="text-slate-200">{candleToShow.open?.toFixed(2)}</strong></span>
            <span>H: <strong className="text-slate-200">{candleToShow.high?.toFixed(2)}</strong></span>
            <span>L: <strong className="text-slate-200">{candleToShow.low?.toFixed(2)}</strong></span>
            <span>C: <strong className="text-slate-200">{candleToShow.close?.toFixed(2)}</strong></span>
            {hoverData?.ema20 && <span className="text-blue-400">EMA20: {hoverData.ema20.toFixed(2)}</span>}
            {hoverData?.rsi && <span className="text-purple-400">RSI: {hoverData.rsi.toFixed(1)}</span>}
          </div>
        )}
      </div>
    </header>
  );
};
