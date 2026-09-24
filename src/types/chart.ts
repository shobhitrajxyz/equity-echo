export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartType = 'candlestick' | 'line' | 'area' | 'heikinashi' | 'bar';

export type Timeframe = '1D' | '1W' | '1M' | '15m' | '5m';

export interface IndicatorConfig {
  ema20: boolean;
  sma50: boolean;
  rsi: boolean;
  volume: boolean;
  bollinger: boolean;
}

export type EventType = 'Dividend' | 'Split' | 'Bonus' | 'Results' | 'Buyback';

export interface CorporateEvent {
  date: string;
  type: EventType;
  label: string;
  color: string;
}

export type DrawingToolType =
  | 'none'
  | 'trendline'
  | 'horizontal'
  | 'rectangle'
  | 'channel'
  | 'ray'
  | 'brush'
  | 'text'
  | 'measure';

export interface Point {
  index: number;
  price: number;
  x?: number;
  y?: number;
}

export interface DrawingItem {
  id: string;
  type: DrawingToolType;
  p1: Point;
  p2?: Point;
  points?: Point[];
  text?: string;
  color?: string;
}

export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  prices: OHLCV[];
  events: CorporateEvent[];
}

export interface StockSuggestion {
  symbol: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}
