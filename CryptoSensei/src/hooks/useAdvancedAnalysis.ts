import { useState, useEffect } from 'react';
import { advancedAnalysis, AdvancedAnalysis } from '../services/advancedAnalysis';

export function useAdvancedAnalysis(crypto: string) {
  const [analysis, setAnalysis] = useState<AdvancedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await advancedAnalysis.getFullAnalysis(crypto);
      setAnalysis(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    return () => {
      // Cleanup if needed
    };
  }, [crypto]);

  return { analysis, loading, error, refetch: fetchAnalysis };
} 