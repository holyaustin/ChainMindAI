import * as tf from '@tensorflow/tfjs';
import { PredictionData } from './types';
import { api } from './api';

class PredictionService {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  private readonly windowSize = 20;
  private readonly features = ['price', 'volume', 'rsi', 'macd', 'bb', 'atr'];

  private async getHistoricalData(crypto: string): Promise<any[]> {
    try {
      const response = await api.getHistoricalData(crypto, 200);
      return response;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  async initialize() {
    if (this.isInitialized) return;
    this.model = await this.createModel();
    this.isInitialized = true;
  }

  private async createModel() {
    const model = tf.sequential();
    
    // Input layer with multiple features
    model.add(tf.layers.lstm({
      units: 100,
      returnSequences: true,
      inputShape: [this.windowSize, this.features.length],
    }));
    
    // Add dropout to prevent overfitting
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Second LSTM layer
    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: false,
    }));
    
    // Add dropout
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Dense layers for prediction
    model.add(tf.layers.dense({ units: 25, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'huberLoss', // More robust to outliers
      metrics: ['mse'],
    });

    return model;
  }

  private calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi = [];
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i < period + 1; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));

    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        avgGain = (avgGain * (period - 1) + difference) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - difference) / period;
      }
      rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
    }

    return rsi;
  }

  private calculateMACD(prices: number[]): number[] {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12.map((value, index) => value - ema26[index]);
    const signalLine = this.calculateEMA(macdLine, 9);
    return macdLine.map((value, index) => value - signalLine[index]); // Return MACD histogram
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];
    
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
    
    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number = 20): number[] {
    const sma = [];
    const upperBand = [];
    const lowerBand = [];
    const bandwidth = [];

    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b) / period;
      const stdDev = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / period);
      
      sma.push(avg);
      upperBand.push(avg + (2 * stdDev));
      lowerBand.push(avg - (2 * stdDev));
      bandwidth.push((upperBand[upperBand.length - 1] - lowerBand[lowerBand.length - 1]) / avg);
    }

    return bandwidth;
  }

  private calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
    const trueRanges = [];
    const atr = [];

    // Calculate True Range
    for (let i = 1; i < highs.length; i++) {
      const tr1 = Math.abs(highs[i] - lows[i]);
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // Calculate ATR
    let atrSum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    atr.push(atrSum / period);

    for (let i = period; i < trueRanges.length; i++) {
      atr.push((atr[atr.length - 1] * (period - 1) + trueRanges[i]) / period);
    }

    return atr;
  }

  private async preprocessData(data: any[]): Promise<{ input: tf.Tensor3D; output: tf.Tensor2D }> {
    const inputs: number[][][] = [];
    const outputs: number[] = [];

    // Calculate technical indicators
    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume);
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);
    const atr = this.calculateATR(
      data.map(d => d.high || d.price),
      data.map(d => d.low || d.price),
      prices
    );

    // Normalize data
    const normalize = (arr: number[]) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return arr.map(val => (val - min) / (max - min));
    };

    const normalizedData = {
      prices: normalize(prices),
      volumes: normalize(volumes),
      rsi: normalize(rsi),
      macd: normalize(macd),
      bb: normalize(bb),
      atr: normalize(atr)
    };

    // Create input windows
    for (let i = 0; i <= data.length - this.windowSize - 1; i++) {
      const window = [];
      for (let j = i; j < i + this.windowSize; j++) {
        window.push([
          normalizedData.prices[j],
          normalizedData.volumes[j],
          normalizedData.rsi[j],
          normalizedData.macd[j],
          normalizedData.bb[j],
          normalizedData.atr[j]
        ]);
      }
      inputs.push(window);
      outputs.push(normalizedData.prices[i + this.windowSize]);
    }

    return {
      input: tf.tensor3d(inputs),
      output: tf.tensor2d(outputs, [outputs.length, 1])
    };
  }

  private async trainModel(input: tf.Tensor3D, output: tf.Tensor2D) {
    if (!this.model) return null;

    try {
      const history = await this.model.fit(input, output, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (logs) {
              console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
            }
          }
        }
      });

      // Extract validation loss value safely
      let validationLoss = 0;
      if (history.history.val_loss) {
        const lastValLoss = history.history.val_loss[history.history.val_loss.length - 1];
        if (lastValLoss instanceof tf.Tensor) {
          const valLossData = await lastValLoss.data();
          validationLoss = valLossData[0];
        } else {
          validationLoss = lastValLoss;
        }
      }

      return {
        ...history,
        validationLoss
      };
    } catch (error) {
      console.error('Error training model:', error);
      return null;
    }
  }

  private calculateConfidence(
    validationLoss: number,
    volatility: number,
    predictionHorizon: number
  ): number {
    // Base confidence from model performance
    const modelConfidence = Math.max(0, 100 - (validationLoss * 100));
    
    // Volatility impact (higher volatility = lower confidence)
    const volatilityFactor = Math.max(0.5, 1 - (volatility / 100));
    
    // Time decay (longer predictions = lower confidence)
    const timeDecay = Math.exp(-predictionHorizon / 30); // 30-day half-life
    
    // Combine factors
    const confidence = modelConfidence * volatilityFactor * timeDecay;
    
    // Ensure confidence is between 30 and 95
    return Math.min(95, Math.max(30, confidence));
  }

  async getPredictions(crypto: string): Promise<PredictionData[]> {
    try {
      await this.initialize();
      const historicalData = await this.getHistoricalData(crypto);
      
      if (!historicalData || historicalData.length < this.windowSize) {
        throw new Error('Insufficient historical data');
      }

      const { input, output } = await this.preprocessData(historicalData);
      const trainingResult = await this.trainModel(input, output);
      
      if (!trainingResult || !this.model) {
        throw new Error('Model training failed');
      }

      const predictions: PredictionData[] = [];
      const timeframes = [1, 7, 30]; // Days
      const lastWindow = input.slice([-1]);

      for (const days of timeframes) {
        const prediction = await this.model.predict(lastWindow) as tf.Tensor;
        const predictedValue = (await prediction.data())[0];
        
        const confidence = this.calculateConfidence(
          trainingResult.validationLoss,
          this.calculateVolatility(historicalData),
          days
        );

        predictions.push({
          period: days === 1 ? 'Short-term' : days === 7 ? 'Mid-term' : 'Long-term',
          price: predictedValue,
          confidence: Math.round(confidence),
          timestamp: Date.now()
        });

        prediction.dispose();
      }

      input.dispose();
      output.dispose();

      return predictions;
    } catch (error) {
      console.error('Error in prediction service:', error);
      throw error;
    }
  }

  private calculateVolatility(data: any[]): number {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push(Math.log(data[i].price / data[i - 1].price));
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility
  }
}

export const predictionService = new PredictionService();