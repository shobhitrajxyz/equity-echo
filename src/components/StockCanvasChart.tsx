import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { OHLCV, ChartType, IndicatorConfig, DrawingToolType, DrawingItem, Point, CorporateEvent } from '../types/chart';
import { calculateEMA, calculateSMA, calculateRSI, calculateBollingerBands, convertToHeikinAshi } from '../engine/indicators';

interface StockCanvasChartProps {
  symbol: string;
  name: string;
  data: OHLCV[];
  events?: CorporateEvent[];
  chartType: ChartType;
  indicators: IndicatorConfig;
  isLogScale: boolean;
  isDarkMode: boolean;
  activeDrawingTool: DrawingToolType;
  isMagnetActive: boolean;
  areDrawingsVisible: boolean;
  drawings: DrawingItem[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingItem[]>>;
  onHoverData?: (hoverData: { candle: OHLCV | null; ema20: number | null; sma50: number | null; rsi: number | null }) => void;
}

export const StockCanvasChart: React.FC<StockCanvasChartProps> = ({
  symbol,
  name,
  data,
  events = [],
  chartType,
  indicators,
  isLogScale,
  isDarkMode,
  activeDrawingTool,
  isMagnetActive,
  areDrawingsVisible,
  drawings,
  setDrawings,
  onHoverData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const seriesCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport zoom & pan range [startIndex, endIndex]
  const [range, setRange] = useState<[number, number]>([Math.max(0, data.length - 80), Math.max(0, data.length - 1)]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; startIndex: number; endIndex: number } | null>(null);

  // Mouse position
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  
  // Drawing creation state
  const [currentDrawing, setCurrentDrawing] = useState<Partial<DrawingItem> | null>(null);
  const [brushPoints, setBrushPoints] = useState<Point[]>([]);

  // Prepare display data
  const displayData = useMemo(() => {
    if (chartType === 'heikinashi') return convertToHeikinAshi(data);
    return data;
  }, [data, chartType]);

  const closes = useMemo(() => displayData.map(d => d.close), [displayData]);
  const ema20 = useMemo(() => calculateEMA(closes, 20), [closes]);
  const sma50 = useMemo(() => calculateSMA(closes, 50), [closes]);
  const rsi14 = useMemo(() => calculateRSI(closes, 14), [closes]);
  const bb = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);

  useEffect(() => {
    setRange([Math.max(0, displayData.length - 80), Math.max(0, displayData.length - 1)]);
  }, [displayData.length]);

  const colors = useMemo(() => {
    return isDarkMode ? {
      bg: '#12161f',
      grid: 'rgba(255, 255, 255, 0.05)',
      axisText: '#94a3b8',
      bullish: '#26a69a',
      bearish: '#ef5350',
      volumeBullish: 'rgba(38, 166, 154, 0.4)',
      volumeBearish: 'rgba(239, 83, 80, 0.4)',
      crosshair: 'rgba(255, 255, 255, 0.4)',
      badgeBg: '#1e293b',
      badgeText: '#f8fafc',
      ema: '#2196F3',
      sma: '#FF9800',
      rsi: '#9C27B0'
    } : {
      bg: '#ffffff',
      grid: 'rgba(0, 0, 0, 0.05)',
      axisText: '#64748b',
      bullish: '#10b981',
      bearish: '#f43f5e',
      volumeBullish: 'rgba(16, 185, 129, 0.4)',
      volumeBearish: 'rgba(244, 63, 94, 0.4)',
      crosshair: 'rgba(0, 0, 0, 0.4)',
      badgeBg: '#0f172a',
      badgeText: '#ffffff',
      ema: '#1d4ed8',
      sma: '#d97706',
      rsi: '#7c3aed'
    };
  }, [isDarkMode]);

  // Main Render Loop
  const renderAll = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const seriesCanvas = seriesCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!bgCanvas || !seriesCanvas || !overlayCanvas || !container || !displayData.length) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    [bgCanvas, seriesCanvas, overlayCanvas].forEach(c => {
      if (c.width !== width * dpr || c.height !== height * dpr) {
        c.width = width * dpr;
        c.height = height * dpr;
      }
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
    });

    const bgCtx = bgCanvas.getContext('2d')!;
    const seriesCtx = seriesCanvas.getContext('2d')!;
    const overlayCtx = overlayCanvas.getContext('2d')!;

    bgCtx.resetTransform();
    seriesCtx.resetTransform();
    overlayCtx.resetTransform();

    bgCtx.scale(dpr, dpr);
    seriesCtx.scale(dpr, dpr);
    overlayCtx.scale(dpr, dpr);

    const yAxisWidth = 65;
    const xAxisHeight = 28;
    const rsiPaneHeight = indicators.rsi ? 110 : 0;
    const chartWidth = width - yAxisWidth;
    const chartHeight = height - xAxisHeight - rsiPaneHeight;
    const volumePaneHeight = chartHeight * 0.22;
    const pricePaneHeight = chartHeight - volumePaneHeight;

    const [startIdx, endIdx] = range;
    const visibleCount = Math.max(1, endIdx - startIdx + 1);
    const candleWidth = chartWidth / visibleCount;
    const barSpacing = Math.max(1, candleWidth * 0.15);

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0 || i >= displayData.length) continue;
      const d = displayData[i];
      minPrice = Math.min(minPrice, d.low);
      maxPrice = Math.max(maxPrice, d.high);
      maxVolume = Math.max(maxVolume, d.volume);

      if (indicators.ema20 && ema20[i] !== null) {
        minPrice = Math.min(minPrice, ema20[i]!);
        maxPrice = Math.max(maxPrice, ema20[i]!);
      }
      if (indicators.sma50 && sma50[i] !== null) {
        minPrice = Math.min(minPrice, sma50[i]!);
        maxPrice = Math.max(maxPrice, sma50[i]!);
      }
    }

    if (!isFinite(minPrice) || !isFinite(maxPrice)) {
      minPrice = 100; maxPrice = 200;
    }

    const pricePadding = (maxPrice - minPrice) * 0.08;
    minPrice = Math.max(0.01, minPrice - pricePadding);
    maxPrice = maxPrice + pricePadding;

    const getX = (index: number) => (index - startIdx) * candleWidth + candleWidth / 2;
    const getY = (price: number) => {
      if (isLogScale && price > 0 && minPrice > 0) {
        const logMin = Math.log10(minPrice);
        const logMax = Math.log10(maxPrice);
        const ratio = (Math.log10(price) - logMin) / (logMax - logMin);
        return pricePaneHeight - ratio * pricePaneHeight;
      }
      return pricePaneHeight - ((price - minPrice) / (maxPrice - minPrice)) * pricePaneHeight;
    };

    const getVolumeY = (vol: number) => chartHeight - (vol / (maxVolume || 1)) * volumePaneHeight;
    const getRsiY = (rsiVal: number) => chartHeight + (rsiPaneHeight - 15) - (rsiVal / 100) * (rsiPaneHeight - 15);

    // 1. BG & GRID
    bgCtx.clearRect(0, 0, width, height);
    bgCtx.fillStyle = colors.bg;
    bgCtx.fillRect(0, 0, width, height);

    bgCtx.strokeStyle = colors.grid;
    bgCtx.lineWidth = 1;
    bgCtx.font = '11px Inter, sans-serif';
    bgCtx.fillStyle = colors.axisText;
    bgCtx.textAlign = 'left';
    bgCtx.textBaseline = 'middle';

    for (let i = 0; i <= 6; i++) {
      const ratio = i / 6;
      let price = minPrice + ratio * (maxPrice - minPrice);
      if (isLogScale && minPrice > 0) {
        const logMin = Math.log10(minPrice);
        const logMax = Math.log10(maxPrice);
        price = Math.pow(10, logMin + ratio * (logMax - logMin));
      }
      const y = getY(price);
      bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(chartWidth, y); bgCtx.stroke();
      bgCtx.fillText(price.toFixed(2), chartWidth + 6, y);
    }

    const step = Math.max(1, Math.floor(visibleCount / 7));
    for (let i = startIdx; i <= endIdx; i += step) {
      if (!displayData[i]) continue;
      const x = getX(i);
      bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, height - xAxisHeight); bgCtx.stroke();
      bgCtx.textAlign = 'center';
      bgCtx.fillText(displayData[i].date.slice(5), x, height - xAxisHeight / 2);
    }

    bgCtx.beginPath();
    bgCtx.moveTo(chartWidth, 0); bgCtx.lineTo(chartWidth, height);
    bgCtx.moveTo(0, chartHeight); bgCtx.lineTo(width, chartHeight);
    bgCtx.stroke();

    if (indicators.rsi) {
      bgCtx.beginPath(); bgCtx.moveTo(0, chartHeight); bgCtx.lineTo(width, chartHeight); bgCtx.stroke();
      const y70 = getRsiY(70); const y30 = getRsiY(30);
      bgCtx.strokeStyle = 'rgba(156, 39, 176, 0.2)';
      bgCtx.setLineDash([4, 4]);
      bgCtx.beginPath();
      bgCtx.moveTo(0, y70); bgCtx.lineTo(chartWidth, y70);
      bgCtx.moveTo(0, y30); bgCtx.lineTo(chartWidth, y30);
      bgCtx.stroke(); bgCtx.setLineDash([]);
      bgCtx.fillStyle = colors.rsi;
      bgCtx.fillText('70', chartWidth + 6, y70);
      bgCtx.fillText('30', chartWidth + 6, y30);
    }

    // 2. CANDLES & INDICATORS (seriesCanvas)
    seriesCtx.clearRect(0, 0, width, height);

    if (indicators.volume) {
      for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= displayData.length) continue;
        const d = displayData[i];
        const x = getX(i);
        const yVol = getVolumeY(d.volume);
        const isBull = d.close >= d.open;
        const w = Math.max(1, candleWidth - barSpacing);
        seriesCtx.fillStyle = isBull ? colors.volumeBullish : colors.volumeBearish;
        seriesCtx.fillRect(x - w / 2, yVol, w, chartHeight - yVol);
      }
    }

    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0 || i >= displayData.length) continue;
      const d = displayData[i];
      const x = getX(i);
      const openY = getY(d.open);
      const closeY = getY(d.close);
      const highY = getY(d.high);
      const lowY = getY(d.low);
      const isBull = d.close >= d.open;
      const candleColor = isBull ? colors.bullish : colors.bearish;
      const w = Math.max(1, candleWidth - barSpacing);

      if (chartType === 'candlestick' || chartType === 'heikinashi') {
        seriesCtx.strokeStyle = candleColor;
        seriesCtx.lineWidth = 1;
        seriesCtx.beginPath(); seriesCtx.moveTo(x, highY); seriesCtx.lineTo(x, lowY); seriesCtx.stroke();
        seriesCtx.fillStyle = candleColor;
        seriesCtx.fillRect(x - w / 2, Math.min(openY, closeY), w, Math.max(1, Math.abs(closeY - openY)));
      } else if (chartType === 'bar') {
        seriesCtx.strokeStyle = candleColor;
        seriesCtx.lineWidth = Math.max(1.5, candleWidth * 0.1);
        seriesCtx.beginPath();
        seriesCtx.moveTo(x, highY); seriesCtx.lineTo(x, lowY);
        seriesCtx.moveTo(x - w / 2, openY); seriesCtx.lineTo(x, openY);
        seriesCtx.moveTo(x, closeY); seriesCtx.lineTo(x + w / 2, closeY);
        seriesCtx.stroke();
      }
    }

    if (chartType === 'line' || chartType === 'area') {
      seriesCtx.beginPath();
      let started = false;
      for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= displayData.length) continue;
        const x = getX(i); const y = getY(displayData[i].close);
        if (!started) { seriesCtx.moveTo(x, y); started = true; }
        else { seriesCtx.lineTo(x, y); }
      }
      if (chartType === 'area') {
        seriesCtx.lineTo(getX(endIdx), pricePaneHeight);
        seriesCtx.lineTo(getX(startIdx), pricePaneHeight);
        seriesCtx.closePath();
        const grad = seriesCtx.createLinearGradient(0, 0, 0, pricePaneHeight);
        grad.addColorStop(0, 'rgba(37, 99, 235, 0.35)'); grad.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
        seriesCtx.fillStyle = grad; seriesCtx.fill();
      }
      seriesCtx.strokeStyle = '#2563eb'; seriesCtx.lineWidth = 2; seriesCtx.stroke();
    }

    if (indicators.ema20) {
      seriesCtx.strokeStyle = colors.ema; seriesCtx.lineWidth = 1.8; seriesCtx.beginPath();
      let s = false;
      for (let i = startIdx; i <= endIdx; i++) {
        if (ema20[i] !== null) {
          const x = getX(i); const y = getY(ema20[i]!);
          if (!s) { seriesCtx.moveTo(x, y); s = true; } else { seriesCtx.lineTo(x, y); }
        }
      }
      seriesCtx.stroke();
    }

    if (indicators.sma50) {
      seriesCtx.strokeStyle = colors.sma; seriesCtx.lineWidth = 1.8; seriesCtx.beginPath();
      let s = false;
      for (let i = startIdx; i <= endIdx; i++) {
        if (sma50[i] !== null) {
          const x = getX(i); const y = getY(sma50[i]!);
          if (!s) { seriesCtx.moveTo(x, y); s = true; } else { seriesCtx.lineTo(x, y); }
        }
      }
      seriesCtx.stroke();
    }

    if (indicators.rsi) {
      seriesCtx.strokeStyle = colors.rsi; seriesCtx.lineWidth = 1.6; seriesCtx.beginPath();
      let s = false;
      for (let i = startIdx; i <= endIdx; i++) {
        if (rsi14[i] !== null) {
          const x = getX(i); const y = getRsiY(rsi14[i]!);
          if (!s) { seriesCtx.moveTo(x, y); s = true; } else { seriesCtx.lineTo(x, y); }
        }
      }
      seriesCtx.stroke();
    }

    // Corporate Events
    events.forEach(ev => {
      const evIndex = displayData.findIndex(d => d.date === ev.date);
      if (evIndex >= startIdx && evIndex <= endIdx) {
        const x = getX(evIndex); const y = height - xAxisHeight / 2;
        seriesCtx.fillStyle = ev.color;
        seriesCtx.beginPath(); seriesCtx.arc(x, y, 10, 0, Math.PI * 2); seriesCtx.fill();
        seriesCtx.fillStyle = '#ffffff'; seriesCtx.font = 'bold 10px Inter, sans-serif';
        seriesCtx.textAlign = 'center'; seriesCtx.textBaseline = 'middle';
        seriesCtx.fillText(ev.type[0], x, y);
      }
    });

    // 3. DRAWINGS (IF VISIBLE)
    if (areDrawingsVisible) {
      drawings.forEach(d => {
        const drawItem = (item: DrawingItem) => {
          if (item.type === 'trendline' && item.p2) {
            const x1 = getX(item.p1.index); const y1 = getY(item.p1.price);
            const x2 = getX(item.p2.index); const y2 = getY(item.p2.price);
            seriesCtx.strokeStyle = item.color || '#3b82f6'; seriesCtx.lineWidth = 2;
            seriesCtx.beginPath(); seriesCtx.moveTo(x1, y1); seriesCtx.lineTo(x2, y2); seriesCtx.stroke();
            seriesCtx.fillStyle = item.color || '#3b82f6';
            seriesCtx.beginPath(); seriesCtx.arc(x1, y1, 3, 0, Math.PI * 2); seriesCtx.arc(x2, y2, 3, 0, Math.PI * 2); seriesCtx.fill();
          } else if (item.type === 'horizontal') {
            const y = getY(item.p1.price);
            seriesCtx.strokeStyle = item.color || '#eab308'; seriesCtx.lineWidth = 1.5; seriesCtx.setLineDash([5, 5]);
            seriesCtx.beginPath(); seriesCtx.moveTo(0, y); seriesCtx.lineTo(chartWidth, y); seriesCtx.stroke(); seriesCtx.setLineDash([]);
          } else if (item.type === 'rectangle' && item.p2) {
            const x1 = getX(item.p1.index); const y1 = getY(item.p1.price);
            const x2 = getX(item.p2.index); const y2 = getY(item.p2.price);
            seriesCtx.fillStyle = 'rgba(59, 130, 246, 0.15)';
            seriesCtx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
            seriesCtx.strokeStyle = '#3b82f6'; seriesCtx.lineWidth = 1.5;
            seriesCtx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
          } else if (item.type === 'ray' && item.p2) {
            const x1 = getX(item.p1.index); const y1 = getY(item.p1.price);
            const x2 = getX(item.p2.index); const y2 = getY(item.p2.price);
            const dx = x2 - x1; const dy = y2 - y1;
            const endX = x1 + dx * 10; const endY = y1 + dy * 10;
            seriesCtx.strokeStyle = '#ec4899'; seriesCtx.lineWidth = 2;
            seriesCtx.beginPath(); seriesCtx.moveTo(x1, y1); seriesCtx.lineTo(endX, endY); seriesCtx.stroke();
          } else if (item.type === 'measure' && item.p2) {
            const x1 = getX(item.p1.index); const y1 = getY(item.p1.price);
            const x2 = getX(item.p2.index); const y2 = getY(item.p2.price);
            const diffPrice = item.p2.price - item.p1.price;
            const diffPct = (diffPrice / item.p1.price) * 100;
            const barDiff = Math.abs(item.p2.index - item.p1.index);

            seriesCtx.fillStyle = diffPrice >= 0 ? 'rgba(38, 166, 154, 0.2)' : 'rgba(239, 83, 80, 0.2)';
            seriesCtx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
            seriesCtx.strokeStyle = diffPrice >= 0 ? '#26a69a' : '#ef5350'; seriesCtx.lineWidth = 1.5;
            seriesCtx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));

            // Ruler Info Badge Box
            const midX = (x1 + x2) / 2; const midY = (y1 + y2) / 2;
            seriesCtx.fillStyle = colors.badgeBg;
            seriesCtx.fillRect(midX - 55, midY - 14, 110, 28);
            seriesCtx.fillStyle = colors.badgeText;
            seriesCtx.font = 'bold 10px Inter, sans-serif'; seriesCtx.textAlign = 'center';
            seriesCtx.fillText(`${diffPrice >= 0 ? '+' : ''}${diffPrice.toFixed(2)} (${diffPct.toFixed(2)}%)`, midX, midY - 2);
            seriesCtx.fillText(`${barDiff} Bars`, midX, midY + 9);
          } else if (item.type === 'text') {
            const x = getX(item.p1.index); const y = getY(item.p1.price);
            seriesCtx.fillStyle = colors.badgeBg;
            seriesCtx.fillRect(x - 30, y - 20, 60, 20);
            seriesCtx.fillStyle = colors.badgeText;
            seriesCtx.font = 'bold 11px Inter, sans-serif'; seriesCtx.textAlign = 'center';
            seriesCtx.fillText(item.text || 'Note', x, y - 6);
          }
        };

        drawItem(d);
      });

      if (currentDrawing && currentDrawing.p1 && currentDrawing.p2) {
        seriesCtx.strokeStyle = '#3b82f6'; seriesCtx.lineWidth = 2; seriesCtx.setLineDash([4, 4]);
        const x1 = getX(currentDrawing.p1.index); const y1 = getY(currentDrawing.p1.price);
        const x2 = getX(currentDrawing.p2.index); const y2 = getY(currentDrawing.p2.price);
        seriesCtx.beginPath(); seriesCtx.moveTo(x1, y1); seriesCtx.lineTo(x2, y2); seriesCtx.stroke();
        seriesCtx.setLineDash([]);
      }
    }

    // 4. CROSSHAIRS & HOVER BADGES (overlayCanvas)
    overlayCtx.clearRect(0, 0, width, height);

    if (mousePos && mousePos.x < chartWidth && mousePos.y < height - xAxisHeight) {
      const { x, y } = mousePos;
      const rawIdx = Math.floor(x / candleWidth) + startIdx;
      const hoverIdx = Math.max(startIdx, Math.min(endIdx, rawIdx));
      const hoverCandle = displayData[hoverIdx];

      if (hoverCandle) {
        const snappedX = getX(hoverIdx);

        overlayCtx.strokeStyle = colors.crosshair;
        overlayCtx.setLineDash([4, 4]);
        overlayCtx.lineWidth = 1;
        overlayCtx.beginPath();
        overlayCtx.moveTo(snappedX, 0); overlayCtx.lineTo(snappedX, height - xAxisHeight);
        overlayCtx.moveTo(0, y); overlayCtx.lineTo(chartWidth, y);
        overlayCtx.stroke(); overlayCtx.setLineDash([]);

        // Magnet indicator ring if magnet mode is active
        if (isMagnetActive) {
          const closeY = getY(hoverCandle.close);
          overlayCtx.strokeStyle = '#f59e0b'; overlayCtx.lineWidth = 2;
          overlayCtx.beginPath(); overlayCtx.arc(snappedX, closeY, 6, 0, Math.PI * 2); overlayCtx.stroke();
        }

        let hoverPrice = minPrice + (1 - y / pricePaneHeight) * (maxPrice - minPrice);
        if (isLogScale && minPrice > 0) {
          const logMin = Math.log10(minPrice); const logMax = Math.log10(maxPrice);
          hoverPrice = Math.pow(10, logMin + (1 - y / pricePaneHeight) * (logMax - logMin));
        }

        overlayCtx.fillStyle = colors.badgeBg;
        overlayCtx.fillRect(chartWidth + 2, y - 10, yAxisWidth - 4, 20);
        overlayCtx.fillStyle = colors.badgeText;
        overlayCtx.font = 'bold 11px Inter, sans-serif'; overlayCtx.textAlign = 'center'; overlayCtx.textBaseline = 'middle';
        overlayCtx.fillText(hoverPrice.toFixed(2), chartWidth + yAxisWidth / 2, y);

        overlayCtx.fillStyle = colors.badgeBg;
        overlayCtx.fillRect(snappedX - 40, height - xAxisHeight, 80, xAxisHeight);
        overlayCtx.fillStyle = colors.badgeText;
        overlayCtx.fillText(hoverCandle.date.slice(0, 10), snappedX, height - xAxisHeight / 2);

        onHoverData?.({
          candle: hoverCandle,
          ema20: ema20[hoverIdx] ?? null,
          sma50: sma50[hoverIdx] ?? null,
          rsi: rsi14[hoverIdx] ?? null
        });
      }
    }
  }, [
    displayData, events, range, chartType, indicators, isLogScale, colors, mousePos,
    ema20, sma50, rsi14, drawings, currentDrawing, areDrawingsVisible, isMagnetActive, onHoverData
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => renderAll());
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderAll]);

  useEffect(() => {
    renderAll();
  }, [renderAll]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const [startIdx, endIdx] = range;
    const currentCount = endIdx - startIdx + 1;
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
    const newCount = Math.max(15, Math.min(displayData.length, Math.round(currentCount * zoomFactor)));

    const container = containerRef.current;
    if (!container) return;
    const mouseX = e.clientX - container.getBoundingClientRect().left;
    const ratio = mouseX / (container.clientWidth - 65);

    const centerIdx = startIdx + currentCount * ratio;
    const newStart = Math.max(0, Math.round(centerIdx - newCount * ratio));
    const newEnd = Math.min(displayData.length - 1, Math.round(newStart + newCount - 1));

    setRange([newStart, newEnd]);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = container.clientWidth - 65;
    const pricePaneHeight = container.clientHeight - 28 - (indicators.rsi ? 110 : 0) - (container.clientHeight * 0.22);

    if (x >= chartWidth) return;

    const [startIdx, endIdx] = range;
    const candleWidth = chartWidth / (endIdx - startIdx + 1);
    const clickedIdx = Math.max(startIdx, Math.min(endIdx, Math.floor(x / candleWidth) + startIdx));
    const candle = displayData[clickedIdx];

    // Compute Price based on Magnet Mode
    let clickedPrice = 100;
    if (candle) {
      if (isMagnetActive) {
        clickedPrice = candle.close;
      } else {
        clickedPrice = candle.close;
      }
    }

    if (activeDrawingTool !== 'none') {
      if (!currentDrawing) {
        if (activeDrawingTool === 'horizontal') {
          setDrawings(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            type: 'horizontal',
            p1: { index: clickedIdx, price: clickedPrice }
          }]);
        } else if (activeDrawingTool === 'text') {
          const txt = prompt('Enter annotation text:', 'Key Level');
          if (txt) {
            setDrawings(prev => [...prev, {
              id: Math.random().toString(36).substring(7),
              type: 'text',
              p1: { index: clickedIdx, price: clickedPrice },
              text: txt
            }]);
          }
        } else {
          setCurrentDrawing({ type: activeDrawingTool, p1: { index: clickedIdx, price: clickedPrice } });
        }
      } else if (currentDrawing.p1) {
        setDrawings(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          type: activeDrawingTool,
          p1: currentDrawing.p1!,
          p2: { index: clickedIdx, price: clickedPrice }
        }]);
        setCurrentDrawing(null);
      }
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, startIndex: range[0], endIndex: range[1] });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (currentDrawing && currentDrawing.p1) {
      const chartWidth = container.clientWidth - 65;
      const [startIdx, endIdx] = range;
      const candleWidth = chartWidth / (endIdx - startIdx + 1);
      const moveIdx = Math.max(startIdx, Math.min(endIdx, Math.floor(x / candleWidth) + startIdx));
      const candle = displayData[moveIdx];
      const movePrice = candle ? candle.close : 100;
      setCurrentDrawing(prev => prev ? { ...prev, p2: { index: moveIdx, price: movePrice } } : null);
    }

    if (isDragging && dragStart) {
      const chartWidth = container.clientWidth - 65;
      const count = dragStart.endIndex - dragStart.startIndex + 1;
      const pxPerBar = chartWidth / count;
      const barShift = Math.round((e.clientX - dragStart.x) / pxPerBar);

      let newStart = Math.max(0, dragStart.startIndex - barShift);
      let newEnd = Math.min(displayData.length - 1, dragStart.endIndex - barShift);
      setRange([newStart, newEnd]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-crosshair select-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { setIsDragging(false); setDragStart(null); }}
      onPointerLeave={() => { setMousePos(null); setIsDragging(false); }}
    >
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" />
      <canvas ref={seriesCanvasRef} className="absolute inset-0 pointer-events-none" />
      <canvas ref={overlayCanvasRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
};
