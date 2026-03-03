import { Candle } from "./types";

// Generate realistic OHLCV data for EURUSD-like price action
function generateCandles(count: number, startPrice: number, startTime: number, volatility: number): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  let time = startTime;
  
  // Create trending and ranging phases
  let trendDirection = Math.random() > 0.5 ? 1 : -1;
  let trendStrength = 0.0002 + Math.random() * 0.0003;
  let phaseDuration = 20 + Math.floor(Math.random() * 40);
  let phaseCounter = 0;

  for (let i = 0; i < count; i++) {
    phaseCounter++;
    if (phaseCounter > phaseDuration) {
      phaseCounter = 0;
      phaseDuration = 15 + Math.floor(Math.random() * 50);
      // Change trend
      if (Math.random() > 0.3) {
        trendDirection *= -1;
      }
      trendStrength = 0.0001 + Math.random() * 0.0004;
    }

    const drift = trendDirection * trendStrength;
    const noise = (Math.random() - 0.5) * volatility;
    const bodySize = Math.random() * volatility * 0.8;
    const wickRatio = 0.3 + Math.random() * 1.5;

    const open = price;
    const direction = Math.random() > 0.5 - drift * 5000 ? 1 : -1;
    const close = open + direction * bodySize + drift;
    
    const wickUp = Math.abs(close - open) * wickRatio * Math.random();
    const wickDown = Math.abs(close - open) * wickRatio * Math.random();
    
    const high = Math.max(open, close) + wickUp + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - wickDown - Math.random() * volatility * 0.3;

    const volume = 1000 + Math.random() * 5000 + (Math.abs(close - open) / volatility) * 3000;

    candles.push({
      time,
      open: Math.round(open * 100000) / 100000,
      high: Math.round(high * 100000) / 100000,
      low: Math.round(low * 100000) / 100000,
      close: Math.round(close * 100000) / 100000,
      volume: Math.round(volume),
    });

    price = close + noise * 0.3;
    time += 900; // 15-min candles
  }

  return candles;
}

// Pre-generated datasets for different pairs
const BASE_TIME = Math.floor(new Date("2024-01-02T00:00:00Z").getTime() / 1000);

export const SAMPLE_DATA: Record<string, Candle[]> = {
  "EURUSD": generateCandles(2000, 1.09500, BASE_TIME, 0.0015),
  "GBPUSD": generateCandles(2000, 1.27200, BASE_TIME, 0.0020),
  "XAUUSD": generateCandles(2000, 2045.00, BASE_TIME, 3.50),
  "USDJPY": generateCandles(2000, 148.500, BASE_TIME, 0.150),
  "GBPJPY": generateCandles(2000, 188.200, BASE_TIME, 0.250),
};

export const AVAILABLE_ASSETS = Object.keys(SAMPLE_DATA);

export const TIMEFRAMES = [
  { label: "M1", seconds: 60 },
  { label: "M5", seconds: 300 },
  { label: "M15", seconds: 900 },
  { label: "H1", seconds: 3600 },
  { label: "H4", seconds: 14400 },
];
