import { OHLCV, StockData } from '../types/chart';

// Helper to generate realistic random walk stock data with seasonality and trends
function generateStockPrices(basePrice: number, count: number = 300, volatility: number = 0.02): OHLCV[] {
  const prices: OHLCV[] = [];
  let currentClose = basePrice;
  const now = new Date(2026, 8, 24); // Sept 24, 2026

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = d.toISOString().split('T')[0];
    const change = (Math.random() - 0.48) * volatility * currentClose;
    const open = currentClose;
    currentClose = Math.max(10, currentClose + change);
    const high = Math.max(open, currentClose) + Math.random() * volatility * currentClose * 0.5;
    const low = Math.min(open, currentClose) - Math.random() * volatility * currentClose * 0.5;
    const volume = Math.floor(100000 + Math.random() * 900000);

    prices.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(currentClose.toFixed(2)),
      volume,
    });
  }

  return prices;
}

const pciPrices = generateStockPrices(420.5, 350, 0.025);
const reliancePrices = generateStockPrices(2980.0, 350, 0.015);
const tcsPrices = generateStockPrices(4150.0, 350, 0.018);
const infyPrices = generateStockPrices(1890.0, 350, 0.02);

export const MOCK_STOCKS: Record<string, StockData> = {
  'PCI:AGROCHEMDOM': {
    symbol: 'PCI:AGROCHEMDOM',
    name: 'Agro Chem Domestic Custom Index',
    currentPrice: pciPrices[pciPrices.length - 1].close,
    change: Number((pciPrices[pciPrices.length - 1].close - pciPrices[pciPrices.length - 2].close).toFixed(2)),
    changePercent: Number((((pciPrices[pciPrices.length - 1].close - pciPrices[pciPrices.length - 2].close) / pciPrices[pciPrices.length - 2].close) * 100).toFixed(2)),
    high: Math.max(...pciPrices.slice(-20).map(p => p.high)),
    low: Math.min(...pciPrices.slice(-20).map(p => p.low)),
    volume: pciPrices[pciPrices.length - 1].volume,
    prices: pciPrices,
    events: [
      { date: pciPrices[pciPrices.length - 40]?.date || '2026-07-10', type: 'Dividend', label: 'D: ₹5.50', color: '#16a34a' },
      { date: pciPrices[pciPrices.length - 90]?.date || '2026-05-15', type: 'Results', label: 'Q1 Net +18%', color: '#475569' },
      { date: pciPrices[pciPrices.length - 160]?.date || '2026-02-01', type: 'Split', label: 'S: 1:5', color: '#2563eb' }
    ]
  },
  'RELIANCE': {
    symbol: 'NSE:RELIANCE',
    name: 'Reliance Industries Ltd.',
    currentPrice: reliancePrices[reliancePrices.length - 1].close,
    change: Number((reliancePrices[reliancePrices.length - 1].close - reliancePrices[reliancePrices.length - 2].close).toFixed(2)),
    changePercent: Number((((reliancePrices[reliancePrices.length - 1].close - reliancePrices[reliancePrices.length - 2].close) / reliancePrices[reliancePrices.length - 2].close) * 100).toFixed(2)),
    high: Math.max(...reliancePrices.slice(-20).map(p => p.high)),
    low: Math.min(...reliancePrices.slice(-20).map(p => p.low)),
    volume: reliancePrices[reliancePrices.length - 1].volume,
    prices: reliancePrices,
    events: [
      { date: reliancePrices[reliancePrices.length - 30]?.date || '2026-08-01', type: 'Bonus', label: 'BI: 1:1', color: '#7c3aed' },
      { date: reliancePrices[reliancePrices.length - 80]?.date || '2026-06-01', type: 'Results', label: 'Q1 Net +12%', color: '#475569' }
    ]
  },
  'TCS': {
    symbol: 'NSE:TCS',
    name: 'Tata Consultancy Services',
    currentPrice: tcsPrices[tcsPrices.length - 1].close,
    change: Number((tcsPrices[tcsPrices.length - 1].close - tcsPrices[tcsPrices.length - 2].close).toFixed(2)),
    changePercent: Number((((tcsPrices[tcsPrices.length - 1].close - tcsPrices[tcsPrices.length - 2].close) / tcsPrices[tcsPrices.length - 2].close) * 100).toFixed(2)),
    high: Math.max(...tcsPrices.slice(-20).map(p => p.high)),
    low: Math.min(...tcsPrices.slice(-20).map(p => p.low)),
    volume: tcsPrices[tcsPrices.length - 1].volume,
    prices: tcsPrices,
    events: [
      { date: tcsPrices[tcsPrices.length - 50]?.date || '2026-07-01', type: 'Dividend', label: 'D: ₹10.0', color: '#16a34a' }
    ]
  },
  'INFY': {
    symbol: 'NSE:INFY',
    name: 'Infosys Limited',
    currentPrice: infyPrices[infyPrices.length - 1].close,
    change: Number((infyPrices[infyPrices.length - 1].close - infyPrices[infyPrices.length - 2].close).toFixed(2)),
    changePercent: Number((((infyPrices[infyPrices.length - 1].close - infyPrices[infyPrices.length - 2].close) / infyPrices[infyPrices.length - 2].close) * 100).toFixed(2)),
    high: Math.max(...infyPrices.slice(-20).map(p => p.high)),
    low: Math.min(...infyPrices.slice(-20).map(p => p.low)),
    volume: infyPrices[infyPrices.length - 1].volume,
    prices: infyPrices,
    events: [
      { date: infyPrices[infyPrices.length - 45]?.date || '2026-07-12', type: 'Buyback', label: 'B: ₹1850', color: '#ea580c' }
    ]
  }
};
