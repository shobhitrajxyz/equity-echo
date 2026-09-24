import { OHLCV } from '../types/chart';

export interface IndicatorValues {
  ema20?: (number | null)[];
  sma50?: (number | null)[];
  rsi14?: (number | null)[];
  bbUpper?: (number | null)[];
  bbLower?: (number | null)[];
  bbMiddle?: (number | null)[];
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return result;

  // Simple SMA for initial EMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  const k = 2 / (period + 1);
  for (let i = period; i < data.length; i++) {
    const currentEMA = data[i] * k + prevEMA * (1 - k);
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }

  return result;
}

export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result[i] = sum / period;
  }

  return result;
}

export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgGain / (avgLoss || 1e-10);
  result[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgGain / (avgLoss || 1e-10);
    result[i] = 100 - 100 / (1 + rs);
  }

  return result;
}

export function calculateBollingerBands(closes: number[], period: number = 20, stdDevMultiplier: number = 2) {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const m = middle[i];
    if (m === null) continue;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(closes[j] - m, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper[i] = m + stdDev * stdDevMultiplier;
    lower[i] = m - stdDev * stdDevMultiplier;
  }

  return { upper, middle, lower };
}

export function convertToHeikinAshi(candles: OHLCV[]): OHLCV[] {
  if (!candles.length) return [];
  const haCandles: OHLCV[] = [];

  // First HA candle
  let prevOpen = (candles[0].open + candles[0].close) / 2;
  let prevClose = (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;

  haCandles.push({
    ...candles[0],
    open: prevOpen,
    close: prevClose,
    high: Math.max(candles[0].high, prevOpen, prevClose),
    low: Math.min(candles[0].low, prevOpen, prevClose),
  });

  for (let i = 1; i < candles.length; i++) {
    const orig = candles[i];
    const haClose = (orig.open + orig.high + orig.low + orig.close) / 4;
    const haOpen = (prevOpen + prevClose) / 2;
    const haHigh = Math.max(orig.high, haOpen, haClose);
    const haLow = Math.min(orig.low, haOpen, haClose);

    haCandles.push({
      ...orig,
      open: haOpen,
      close: haClose,
      high: haHigh,
      low: haLow,
    });

    prevOpen = haOpen;
    prevClose = haClose;
  }

  return haCandles;
}
