import { useEffect, useRef, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";
import { Candle } from "./types";

interface Props {
  candles: Candle[];
  visibleCount: number;
  onCrosshairMove?: (price: number | null, time: number | null) => void;
}

export function SimulatorChart({ candles, visibleCount, onCrosshairMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Cleanup previous
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#7d8597",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(45, 55, 75, 0.3)" },
        horzLines: { color: "rgba(45, 55, 75, 0.3)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(70, 120, 200, 0.4)", width: 1, style: 2 },
        horzLine: { color: "rgba(70, 120, 200, 0.4)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(45, 55, 75, 0.5)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(45, 55, 75, 0.5)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#2d9a5c",
      downColor: "#d9304a",
      borderUpColor: "#2d9a5c",
      borderDownColor: "#d9304a",
      wickUpColor: "#38b86b",
      wickDownColor: "#e04560",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time) {
        onCrosshairMove?.(null, null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (data) {
        onCrosshairMove?.(data.close as number, param.time as number);
      }
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    // Handle resize
    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = initChart();
    return () => {
      cleanup?.();
      chartRef.current?.remove();
    };
  }, [initChart]);

  // Update data when candles or visibleCount changes
  useEffect(() => {
    if (!seriesRef.current || !volumeRef.current || !chartRef.current) return;

    const visible = candles.slice(0, visibleCount);
    if (visible.length === 0) return;

    const candleData: CandlestickData[] = visible.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = visible.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? "rgba(45, 154, 92, 0.3)" : "rgba(217, 48, 74, 0.3)",
    }));

    seriesRef.current.setData(candleData);
    volumeRef.current.setData(volumeData);

    // Scroll to latest
    chartRef.current.timeScale().scrollToPosition(2, false);
  }, [candles, visibleCount]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "300px" }}
    />
  );
}
