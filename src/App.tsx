import React, { useState, useEffect } from 'react';
import { ChartHeader } from './components/ChartHeader';
import { DrawingSidebar } from './components/DrawingSidebar';
import { StockCanvasChart } from './components/StockCanvasChart';
import { SidePanel } from './components/SidePanel';
import { MOCK_STOCKS } from './data/mockData';
import { ChartType, Timeframe, IndicatorConfig, DrawingToolType, StockData, DrawingItem, Watchlist } from './types/chart';

const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'w1',
    name: 'Nifty 50 Top Stocks',
    symbols: ['NSE:RELIANCE', 'NSE:TCS', 'NSE:INFY', 'NSE:HDFCBANK', 'NSE:ICICIBANK', 'NSE:SBIN', 'NSE:TATAMOTORS']
  },
  {
    id: 'w2',
    name: 'IT & Tech Leaders',
    symbols: ['NSE:TCS', 'NSE:INFY', 'NSE:WIPRO']
  },
  {
    id: 'w3',
    name: 'Custom Indices',
    symbols: ['PCI:AGROCHEMDOM']
  }
];

export function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('PCI:AGROCHEMDOM');
  const [currentStock, setCurrentStock] = useState<StockData>(MOCK_STOCKS['PCI:AGROCHEMDOM']);
  const [allFetchedStocks, setAllFetchedStocks] = useState<Record<string, StockData>>(MOCK_STOCKS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Unlimited Watchlists persistent state
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const saved = localStorage.getItem('equity_echo_watchlists');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_WATCHLISTS;
  });

  const [activeWatchlistId, setActiveWatchlistId] = useState<string>(() => watchlists[0]?.id || 'w1');

  // Save watchlists to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('equity_echo_watchlists', JSON.stringify(watchlists));
    } catch (e) {}
  }, [watchlists]);

  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    ema20: true,
    sma50: false,
    rsi: true,
    volume: true,
    bollinger: false,
  });

  const [isLogScale, setIsLogScale] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('none');
  const [isMagnetActive, setIsMagnetActive] = useState<boolean>(false);
  const [areDrawingsVisible, setAreDrawingsVisible] = useState<boolean>(true);
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [hoverData, setHoverData] = useState<{ candle: any; ema20: number | null; sma50: number | null; rsi: number | null } | null>(null);

  // Fetch real-time OHLCV data from FastAPI Backend
  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:8000/api/charts/ohlcv/${encodeURIComponent(selectedSymbol)}?tf=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        if (data.prices && data.prices.length > 0) {
          const stockObj: StockData = {
            symbol: data.symbol || selectedSymbol,
            name: data.name || selectedSymbol,
            currentPrice: data.currentPrice || data.prices[data.prices.length - 1].close,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            high: data.high || data.prices[data.prices.length - 1].high,
            low: data.low || data.prices[data.prices.length - 1].low,
            volume: data.volume || data.prices[data.prices.length - 1].volume,
            prices: data.prices,
            events: data.events || []
          };

          setCurrentStock(stockObj);
          setAllFetchedStocks(prev => ({ ...prev, [selectedSymbol]: stockObj }));
        } else if (MOCK_STOCKS[selectedSymbol]) {
          setCurrentStock(MOCK_STOCKS[selectedSymbol]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Backend offline, using fallback data:', err);
        if (MOCK_STOCKS[selectedSymbol]) {
          setCurrentStock(MOCK_STOCKS[selectedSymbol]);
        }
        setIsLoading(false);
      });
  }, [selectedSymbol, timeframe]);

  // Unlimited Watchlist Handlers
  const handleCreateWatchlist = (name: string) => {
    const newList: Watchlist = {
      id: 'w_' + Math.random().toString(36).substring(7),
      name,
      symbols: []
    };
    setWatchlists(prev => [...prev, newList]);
    setActiveWatchlistId(newList.id);
  };

  const handleDeleteWatchlist = (id: string) => {
    if (watchlists.length <= 1) return;
    setWatchlists(prev => prev.filter(w => w.id !== id));
    if (activeWatchlistId === id) {
      const remaining = watchlists.filter(w => w.id !== id);
      setActiveWatchlistId(remaining[0].id);
    }
  };

  const handleAddStockToWatchlist = (watchlistId: string, symbol: string) => {
    setWatchlists(prev =>
      prev.map(w => {
        if (w.id === watchlistId && !w.symbols.includes(symbol)) {
          return { ...w, symbols: [...w.symbols, symbol] };
        }
        return w;
      })
    );
  };

  const handleRemoveStockFromWatchlist = (watchlistId: string, symbol: string) => {
    setWatchlists(prev =>
      prev.map(w => {
        if (w.id === watchlistId) {
          return { ...w, symbols: w.symbols.filter(s => s !== symbol) };
        }
        return w;
      })
    );
  };

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`w-screen h-screen flex flex-col ${isDarkMode ? 'dark bg-[#12161f]' : 'bg-slate-100'}`}>
      {/* Top Header */}
      <ChartHeader
        currentStock={currentStock}
        allStocks={allFetchedStocks}
        watchlists={watchlists}
        activeWatchlistId={activeWatchlistId}
        onAddStockToWatchlist={handleAddStockToWatchlist}
        onSelectStock={setSelectedSymbol}
        chartType={chartType}
        onChangeChartType={setChartType}
        timeframe={timeframe}
        onChangeTimeframe={setTimeframe}
        indicators={indicators}
        onToggleIndicator={toggleIndicator}
        isLogScale={isLogScale}
        onToggleLogScale={() => setIsLogScale(!isLogScale)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        activeDrawingTool={activeDrawingTool}
        onChangeDrawingTool={setActiveDrawingTool}
        hoverData={hoverData}
        isLoading={isLoading}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawing Sidebar */}
        <DrawingSidebar
          activeTool={activeDrawingTool}
          onSelectTool={setActiveDrawingTool}
          isMagnetActive={isMagnetActive}
          onToggleMagnet={() => setIsMagnetActive(!isMagnetActive)}
          areDrawingsVisible={areDrawingsVisible}
          onToggleDrawingsVisibility={() => setAreDrawingsVisible(!areDrawingsVisible)}
          onClearAllDrawings={() => setDrawings([])}
          isDarkMode={isDarkMode}
        />

        {/* Central Canvas Chart */}
        <main className="flex-1 h-full relative">
          <StockCanvasChart
            symbol={currentStock.symbol}
            name={currentStock.name}
            data={currentStock.prices}
            events={currentStock.events}
            chartType={chartType}
            indicators={indicators}
            isLogScale={isLogScale}
            isDarkMode={isDarkMode}
            activeDrawingTool={activeDrawingTool}
            isMagnetActive={isMagnetActive}
            areDrawingsVisible={areDrawingsVisible}
            drawings={drawings}
            setDrawings={setDrawings}
            onHoverData={setHoverData}
          />
        </main>

        {/* Right Unlimited Watchlists & Events Panel */}
        <SidePanel
          currentStock={currentStock}
          allStocks={allFetchedStocks}
          watchlists={watchlists}
          activeWatchlistId={activeWatchlistId}
          onSelectWatchlist={setActiveWatchlistId}
          onCreateWatchlist={handleCreateWatchlist}
          onDeleteWatchlist={handleDeleteWatchlist}
          onRemoveStockFromWatchlist={handleRemoveStockFromWatchlist}
          onSelectStock={setSelectedSymbol}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}

export default App;
