import { useAdvancedAnalysis } from '../hooks/useAdvancedAnalysis';
import { MarketPhase } from './analysis/MarketPhase';
import { TechnicalSignals } from './analysis/TechnicalSignals';
import { SentimentOverview } from './analysis/SentimentOverview';
import { PricePredictions } from './analysis/PricePredictions';
import { RiskAnalysis } from './analysis/RiskAnalysis';
import { TradingStrategy } from './analysis/TradingStrategy';
import { Loader2 } from 'lucide-react';
import { PredictionData } from '@/services/types';

interface AdvancedAnalysisProps {
  crypto: string;
  predictions: PredictionData[];
}

export const AdvancedAnalysis = ({ crypto, predictions }: AdvancedAnalysisProps) => {
  const { analysis, loading, error } = useAdvancedAnalysis(crypto);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p>Loading advanced analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>Error loading analysis: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No analysis data available</p>
      </div>
    );
  }

  // Merge external predictions with analysis predictions
  const mergedPredictions = {
    ...analysis.predictions,
    externalPredictions: predictions
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MarketPhase data={analysis.marketCondition} />
      <TechnicalSignals data={analysis.technicalSignals} />
      <SentimentOverview data={analysis.sentimentAnalysis} />
      <PricePredictions data={mergedPredictions} />
      <div className="md:col-span-2">
        <RiskAnalysis data={analysis.riskAnalysis} />
      </div>
      <div className="md:col-span-2">
        <TradingStrategy data={analysis.tradingStrategy} />
      </div>
    </div>
  );
}; 