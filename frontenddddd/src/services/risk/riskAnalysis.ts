import { RiskFactors } from '../types';

export class RiskAnalyzer {
  calculateVolatilityRisk(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    
    const annualizedVol = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length
    ) * Math.sqrt(365) * 100;
    
    return Math.min(100, Math.max(0, annualizedVol));
  }

  calculateTrendRisk(data: any): number {
    const { prices, ma50, ma200 } = data;
    const currentPrice = prices[prices.length - 1];
    
    // Calculate trend deviation
    const ma50Dev = Math.abs((currentPrice - ma50) / ma50);
    const ma200Dev = Math.abs((currentPrice - ma200) / ma200);
    
    // Higher deviation = higher risk
    return Math.min(100, (ma50Dev + ma200Dev) * 50);
  }

  calculateVolumeRisk(volumes: number[]): number {
    const recentVol = volumes.slice(-5);
    const avgVol = volumes.slice(-20);
    
    const volRatio = recentVol.reduce((a, b) => a + b, 0) / 5 /
                     (avgVol.reduce((a, b) => a + b, 0) / 20);
                     
    return Math.min(100, Math.abs(volRatio - 1) * 100);
  }

  calculateNewsRisk(news: any[]): number {
    if (!news.length) return 50;
    
    const sentiments = news.map(n => n.sentiment);
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const volatileCount = sentiments.filter(s => s !== 'neutral').length;
    
    return Math.min(100, 
      (negativeCount / news.length * 60) + 
      (volatileCount / news.length * 40)
    );
  }

  calculateSocialRisk(social: any): number {
    if (!social) return 50;
    
    const volume = social.volume || 0;
    const trend = social.trend || 'neutral';
    const baseRisk = trend === 'bearish' ? 70 : trend === 'bullish' ? 30 : 50;
    const volumeImpact = Math.min(30, volume / 100 * 30);
    
    return Math.min(100, baseRisk + volumeImpact);
  }

  calculateMarketRisk(market: any): number {
    const { dominance, flow } = market;
    const baseRisk = flow === 'outflow' ? 70 : flow === 'inflow' ? 30 : 50;
    const dominanceImpact = (100 - dominance) / 2;
    
    return Math.min(100, baseRisk + dominanceImpact);
  }

  combineRiskFactors(factors: Array<{ value: number; weight: number }>): number {
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
    
    return weightedSum / totalWeight;
  }

  generateRiskWarnings(factors: RiskFactors): string[] {
    const warnings: string[] = [];
    
    if (factors.volatility > 70) {
      warnings.push('Extremely high market volatility');
    }
    
    if (factors.trend > 70) {
      warnings.push('Significant trend deviation');
    }
    
    if (factors.volume > 70) {
      warnings.push('Abnormal trading volume');
    }
    
    if (factors.news > 70) {
      warnings.push('High negative news sentiment');
    }
    
    if (factors.social > 70) {
      warnings.push('Concerning social sentiment');
    }
    
    if (factors.market > 70) {
      warnings.push('Unfavorable market conditions');
    }
    
    return warnings;
  }
}

export const riskAnalyzer = new RiskAnalyzer(); 