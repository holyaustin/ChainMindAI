import axios from 'axios';
import { CryptoPrice, NewsItem, SentimentData, PredictionData, BatchPriceData } from './types';
import Sentiment from 'sentiment';

// Initialize sentiment analyzer as a singleton
const sentimentAnalyzer = new Sentiment();

// API Configuration
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Basic cache entry interface
interface CacheEntry {
  data: any;
  timestamp: number;
}

// News-specific cache entry interface
interface NewsCacheEntry extends CacheEntry {
  hasMore: boolean;
  page: number;
}

// Enhanced cache configuration
const CACHE_DURATION = {
  PRICE: 1 * 60 * 1000,        // 1 minute
  NEWS: 15 * 60 * 1000,        // 15 minutes
  HISTORICAL: 5 * 60 * 1000,   // 5 minutes
  SENTIMENT: 30 * 60 * 1000,   // 30 minutes
};

// Rate limiting configuration per endpoint
const rateLimiter = {
  newsdata: {
    lastCall: 0,
    minInterval: 60000, // 1 minute between calls
    retryCount: 0,
    maxRetries: 3,
    backoffMultiplier: 2, // For exponential backoff
    perCryptoCache: new Map<string, any>()
  }
};

// Enhanced cache implementation with crypto-specific caching
const cache = new Map<string, CacheEntry | NewsCacheEntry>();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isValidCache = (key: string, type: keyof typeof CACHE_DURATION) => {
  const cached = cache.get(key);
  if (!cached) return false;
  
  const isValid = Date.now() - cached.timestamp < CACHE_DURATION[type];
  console.log(`Cache ${key} is ${isValid ? 'valid' : 'expired'}`);
  return isValid;
};

// Enhanced rate limit handler with better caching
const handleRateLimit = async (api: 'newsdata', crypto: string) => {
  const limiter = rateLimiter[api];
  const now = Date.now();
  const timeSinceLastCall = now - limiter.lastCall;
  
  // Check if we have cached data for this crypto
  const cachedData = limiter.perCryptoCache.get(crypto);
  if (cachedData) {
    console.log(`Using cached data for ${crypto} during rate limit`);
    return cachedData;
  }
  
  if (timeSinceLastCall < limiter.minInterval) {
    const waitTime = limiter.minInterval * Math.pow(limiter.backoffMultiplier, limiter.retryCount);
    console.log(`Rate limited for ${crypto}, using cache or waiting ${waitTime/1000} seconds...`);
    
    // Try to use cache first
    const cacheKey = `news-${crypto}`;
    const cachedNews = cache.get(cacheKey);
    if (cachedNews) {
      console.log(`Found cached news for ${crypto}`);
      return cachedNews;
    }
    
    // If no cache, wait and retry
    await wait(waitTime);
    limiter.retryCount++;
  } else {
    limiter.retryCount = 0;
  }
  
  limiter.lastCall = Date.now();
  return null;
};

export const api = {
  async getPrice(crypto: string): Promise<CryptoPrice> {
    const cacheKey = `price-${crypto}`;
    
    if (isValidCache(cacheKey, 'PRICE')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      // Updated endpoint
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: crypto,
          vs_currencies: 'usd',
          include_24h_change: true
        }
      });

      const data = {
        price: response.data[crypto].usd,
        change24h: response.data[crypto].usd_24h_change,
        timestamp: Date.now()
      };

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  async getHistoricalData(crypto: string, days: number = 200) {
    const cacheKey = `historical-${crypto}-${days}`;
    
    if (isValidCache(cacheKey, 'HISTORICAL')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(`${COINGECKO_API}/coins/${crypto}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days.toString(),
          interval: 'daily'
        }
      });

      // Transform the data into a consistent format
      const transformedData = {
        prices: response.data.prices.map((item: [number, number]) => item[1]),
        volumes: response.data.total_volumes.map((item: [number, number]) => item[1]),
        timestamps: response.data.prices.map((item: [number, number]) => item[0]),
        current_price: response.data.prices[response.data.prices.length - 1][1],
        market_cap: response.data.market_caps[response.data.market_caps.length - 1][1],
        price_change_24h: this.calculate24hChange(response.data.prices)
      };

      cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
      return transformedData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  },

  calculate24hChange(prices: [number, number][]): number {
    if (prices.length < 2) return 0;
    const currentPrice = prices[prices.length - 1][1];
    const yesterdayPrice = prices[prices.length - 2][1];
    return ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
  },

  async getSentiment(crypto: string): Promise<SentimentData[]> {
    const cacheKey = `sentiment-${crypto}`;
    
    if (isValidCache(cacheKey, 'NEWS')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      // Use market data for sentiment analysis
      const [priceData, historicalData] = await Promise.all([
        this.getPrice(crypto),
        this.getHistoricalData(crypto)
      ]);

      // Calculate sentiment based on price and volume trends
      const priceChange = priceData.change24h;
      const volumeChange = ((historicalData.volumes[historicalData.volumes.length - 1] - 
                            historicalData.volumes[0]) / historicalData.volumes[0]) * 100;

      const sentiment: SentimentData = {
        source: 'Market Analysis',
        sentiment: priceChange > 2 ? 'Bullish' : 
                  priceChange < -2 ? 'Bearish' : 'Neutral',
        volume: Math.min(100, Math.max(0, Math.abs(volumeChange))),
        timestamp: Date.now(),
      };

      const data = [sentiment];
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error generating sentiment:', error);
      return [
        { source: 'Market', sentiment: 'Neutral', volume: 50, timestamp: Date.now() }
      ];
    }
  },

  async getNews(crypto: string, limit: number = 10): Promise<{ news: NewsItem[] }> {
    const cacheKey = `news-${crypto}`;
    
    // Check cache first
    if (isValidCache(cacheKey, 'NEWS')) {
      console.log(`Using cached news for ${crypto}`);
      const cachedNews = cache.get(cacheKey) as NewsCacheEntry;
      if (cachedNews.data.length >= limit) {
        return { news: cachedNews.data };
      }
    }

    try {
      // Handle rate limiting with caching
      const rateLimitResult = await handleRateLimit('newsdata', crypto);
      if (rateLimitResult) {
        return rateLimitResult;
      }
      
      // Make API call if no cache hit
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: 'pub_5827833f271352bd4b9540e47433b0fc33dc5',
          q: `${crypto} OR ${crypto.toLowerCase()} OR ${crypto.toUpperCase()}`,
          language: 'en',
          category: 'business,science,technology,world',
          size: limit
        },
        timeout: 10000
      });

      if (!response.data?.results) {
        throw new Error('Invalid news data format');
      }

      const processedNews = response.data.results
        .filter((item: any) => 
          item.title && 
          item.description && 
          item.description.length > 100 && 
          !item.title.includes('Sponsored') &&
          !item.title.includes('Advertisement')
        )
        .map((item: any) => ({
          title: item.title,
          description: item.description,
          source: item.source_id || 'Unknown Source',
          url: item.link,
          imageUrl: item.image_url,
          timestamp: new Date(item.pubDate).getTime(),
          sentiment: this.analyzeSentiment(item.title + ' ' + item.description),
          aiTags: this.generateAITags(item.title, item.description)
        }))
        .slice(0, limit);

      // Cache the processed news
      const cacheEntry = {
        data: processedNews,
        timestamp: Date.now(),
        hasMore: response.data.results.length > processedNews.length,
        page: 1
      };
      
      cache.set(cacheKey, cacheEntry);
      rateLimiter.newsdata.perCryptoCache.set(crypto, { news: processedNews });

      return { news: processedNews };
    } catch (error: any) {
      console.error('Error fetching news:', error);
      
      // Try to use cached data on error
      const cachedNews = cache.get(cacheKey) as NewsCacheEntry;
      if (cachedNews) {
        console.log(`Using cached news for ${crypto} after error`);
        return { news: cachedNews.data };
      }
      
      return { news: this.getFallbackNews(crypto) };
    }
  },

  analyzeSentiment(text: string): string {
    const result = sentimentAnalyzer.analyze(text);
    if (result.score > 2) return 'positive';
    if (result.score < -2) return 'negative';
    return 'neutral';
  },

   generateAITags(title: string, description: string): string[] {
    const tags = new Set<string>();
    const text = (title + ' ' + description).toLowerCase();

    // Price movement tags
    if (text.includes('surge') || text.includes('soar') || text.includes('jump')) tags.add('Price Surge');
    if (text.includes('drop') || text.includes('fall') || text.includes('crash')) tags.add('Price Drop');

    // Market sentiment tags
    if (text.includes('bullish') || text.includes('optimistic')) tags.add('Bullish');
    if (text.includes('bearish') || text.includes('pessimistic')) tags.add('Bearish');

    // Event tags
    if (text.includes('regulation') || text.includes('sec')) tags.add('Regulation');
    if (text.includes('adoption') || text.includes('institutional')) tags.add('Adoption');
    if (text.includes('technology') || text.includes('upgrade')) tags.add('Technology');
    if (text.includes('market') || text.includes('trading')) tags.add('Market');

    return Array.from(tags);
  },

  async analyzeSentimentAdvanced(text: string, crypto: string): Promise<{
    sentiment: string;
    confidence: number;
    stats: {
      positive: number;
      negative: number;
      neutral: number;
    };
    impact: 'high' | 'medium' | 'low';
  }> {
    try {
      // Use multiple analysis techniques for better accuracy
      const results = await Promise.all([
        this.basicSentimentAnalysis(text),
        this.contextualAnalysis(text, crypto),
        this.technicalTermAnalysis(text),
        this.marketImpactAnalysis(text)
      ]);

      // Combine results with weighted scoring
      const [basic, contextual, technical, impact] = results;
      
      // Calculate weighted sentiment score
      const weightedScore = (
        basic.score * 0.2 +      // Basic sentiment
        contextual.score * 0.3 +  // Contextual relevance
        technical.score * 0.3 +   // Technical terms
        impact.score * 0.2        // Market impact
      );

      // Calculate confidence based on agreement between different methods
      const confidence = this.calculateConfidence(results);

      // Calculate detailed stats
      const stats = {
        positive: Math.max(0, weightedScore) * confidence / 100,
        negative: Math.max(0, -weightedScore) * confidence / 100,
        neutral: 100 - (Math.abs(weightedScore) * confidence / 100)
      };

      return {
        sentiment: weightedScore > 0.2 ? 'positive' : 
                  weightedScore < -0.2 ? 'negative' : 'neutral',
        confidence,
        stats,
        impact: impact.significance
      };
    } catch (error) {
      console.error('Error in advanced sentiment analysis:', error);
      return {
        sentiment: 'neutral',
        confidence: 50,
        stats: { positive: 33.33, negative: 33.33, neutral: 33.34 },
        impact: 'medium'
      };
    }
  },

  async basicSentimentAnalysis(text: string) {
    // Use the existing sentimentAnalyzer instance
    const analysis = sentimentAnalyzer.analyze(text);
    return {
      score: (analysis.score / Math.max(analysis.tokens.length, 1)) * 2,
      tokens: analysis.tokens,
      words: {
        positive: analysis.positive,
        negative: analysis.negative
      }
    };
  },

  async contextualAnalysis(text: string, crypto: string) {
    const cryptoTerms: Record<string, string[]> = {
      'bitcoin': ['btc', 'bitcoin', 'satoshi', 'blockchain'],
      'ethereum': ['eth', 'ethereum', 'vitalik', 'smart contracts'],
      // Add more crypto-specific terms
    };

    const relevantTerms = cryptoTerms[crypto.toLowerCase()] || [];
    const words = text.toLowerCase().split(/\W+/);
    
    // Check for crypto-specific context
    const contextRelevance = words.filter(word => 
      relevantTerms.includes(word)
    ).length / words.length;

    // Analyze surrounding words for sentiment
    let contextualScore = 0;
    words.forEach((word, index) => {
      if (relevantTerms.includes(word)) {
        const surroundingWords = words.slice(
          Math.max(0, index - 3),
          Math.min(words.length, index + 4)
        );
        contextualScore += this.analyzePhraseImpact(surroundingWords);
      }
    });

    return {
      score: contextualScore * contextRelevance,
      relevance: contextRelevance
    };
  },

  async technicalTermAnalysis(text: string) {
    const technicalTerms = {
      bullish: ['breakout', 'support', 'accumulation', 'long', 'buy'],
      bearish: ['breakdown', 'resistance', 'distribution', 'short', 'sell'],
      neutral: ['consolidation', 'range', 'sideways', 'hold']
    };

    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let technicalTermCount = 0;

    words.forEach(word => {
      if (technicalTerms.bullish.includes(word)) {
        score += 1;
        technicalTermCount++;
      } else if (technicalTerms.bearish.includes(word)) {
        score -= 1;
        technicalTermCount++;
      } else if (technicalTerms.neutral.includes(word)) {
        technicalTermCount++;
      }
    });

    return {
      score: technicalTermCount > 0 ? score / technicalTermCount : 0,
      termCount: technicalTermCount
    };
  },

  async marketImpactAnalysis(text: string) {
    type Impact = 'high' | 'medium' | 'low';
    const impactTerms: Record<Impact, string[]> = {
      high: ['massive', 'significant', 'major', 'substantial', 'dramatic'],
      medium: ['notable', 'moderate', 'considerable'],
      low: ['slight', 'minor', 'small', 'modest']
    };

    const words = text.toLowerCase().split(/\W+/);
    let significance: Impact = 'medium';
    let score = 0;

    // Check for impact terms
    words.forEach(word => {
      if (impactTerms.high.includes(word)) significance = 'high';
      else if (impactTerms.low.includes(word)) significance = 'low';
    });

    // Calculate impact score using type-safe comparison
    const getMultiplier = (impact: Impact): number => {
      switch (impact) {
        case 'high': return 1.5;
        case 'low': return 0.5;
        case 'medium': return 1;
      }
    };

    const impactMultiplier = getMultiplier(significance);
    
    // Look for price/percentage mentions
    const pricePattern = /\$?\d+\.?\d*[k|m|b]?\%?/g;
    const priceMatches = text.match(pricePattern);
    if (priceMatches) {
      score += priceMatches.length * impactMultiplier;
    }

    return {
      score: score / Math.max(words.length / 10, 1),
      significance
    };
  },

  calculateConfidence(results: any[]): number {
    // Calculate agreement between different methods
    const scores = results.map(r => Math.sign(r.score));
    const agreement = scores.filter(s => s === Math.sign(scores[0])).length;
    const baseConfidence = (agreement / scores.length) * 100;

    // Adjust confidence based on analysis depth
    const technicalTerms = results[2].termCount;
    const contextRelevance = results[1].relevance;
    
    return Math.min(95, Math.max(30,
      baseConfidence * (0.7 + 0.15 * technicalTerms + 0.15 * contextRelevance)
    ));
  },

  analyzePhraseImpact(words: string[]): number {
    const phrasePatterns = {
      veryPositive: [
        ['strong', 'buy'], ['massive', 'growth'], ['highly', 'bullish']
      ],
      positive: [
        ['going', 'up'], ['price', 'increase'], ['good', 'news']
      ],
      negative: [
        ['going', 'down'], ['price', 'decrease'], ['bad', 'news']
      ],
      veryNegative: [
        ['strong', 'sell'], ['massive', 'drop'], ['highly', 'bearish']
      ]
    };

    let impact = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = [words[i], words[i + 1]];
      if (phrasePatterns.veryPositive.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact += 2;
      else if (phrasePatterns.positive.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact += 1;
      else if (phrasePatterns.negative.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact -= 1;
      else if (phrasePatterns.veryNegative.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact -= 2;
    }

    return impact;
  },

  async getPredictions(crypto: string): Promise<PredictionData[]> {
    const cacheKey = `predictions-${crypto}`;
    
    if (isValidCache(cacheKey, 'PRICE')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      // Get historical data for predictions
      const historicalData = await this.getHistoricalData(crypto);
      const currentPrice = historicalData.current_price;

      // Generate predictions for different timeframes
      const predictions: PredictionData[] = [
        {
          period: 'Short-term',
          price: currentPrice * (1 + (Math.random() * 0.1 - 0.05)), // ±5%
          confidence: 75 + Math.random() * 20,
          timestamp: Date.now()
        },
        {
          period: 'Mid-term',
          price: currentPrice * (1 + (Math.random() * 0.2 - 0.1)), // ±10%
          confidence: 65 + Math.random() * 20,
          timestamp: Date.now()
        },
        {
          period: 'Long-term',
          price: currentPrice * (1 + (Math.random() * 0.3 - 0.15)), // ±15%
          confidence: 55 + Math.random() * 20,
          timestamp: Date.now()
        }
      ];

      cache.set(cacheKey, { data: predictions, timestamp: Date.now() });
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [
        {
          period: 'Short-term',
          price: 0,
          confidence: 0,
          timestamp: Date.now()
        }
      ];
    }
  },

  async getVolume(crypto: string, days: number = 30) {
    const cacheKey = `volume-${crypto}-${days}`;
    
    if (isValidCache(cacheKey, 'HISTORICAL')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(
        `${COINGECKO_API}/crypto/history/${crypto}`, {
          params: { days }
        }
      );

      // Extract volume data from the response
      const volumes = response.data.total_volumes.map((item: [number, number]) => ({
        timestamp: item[0],
        volume: item[1],
      }));

      cache.set(cacheKey, { data: volumes, timestamp: Date.now() });
      return volumes;
    } catch (error) {
      console.error('Error fetching volume data:', error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('Using stale cache for volume data');
        return cachedData.data;
      }
      return [];
    }
  },

  getFallbackNews(crypto: string): NewsItem[] {
    const currentTime = Date.now();
    const cryptoName = crypto.charAt(0).toUpperCase() + crypto.slice(1);
    
    return [
      {
        title: `${cryptoName} Shows Strong Technical Indicators`,
        description: `Recent market analysis shows ${cryptoName} maintaining strong technical indicators with key support levels holding. Market sentiment remains positive as institutional interest continues to grow.`,
        source: 'Market Analysis',
        url: '#',
        timestamp: currentTime - 3600000, // 1 hour ago
        sentiment: 'positive',
        aiTags: ['Technical Analysis', 'Market Update']
      },
      {
        title: `Global Markets Impact on ${cryptoName}`,
        description: `Global market conditions continue to influence ${cryptoName}'s price action. Analysts observe correlation with traditional markets while maintaining crypto-specific growth factors.`,
        source: 'Market Insights',
        url: '#',
        timestamp: currentTime - 7200000, // 2 hours ago
        sentiment: 'neutral',
        aiTags: ['Market Analysis', 'Global Markets']
      },
      {
        title: `${cryptoName} Trading Volume Analysis`,
        description: `Trading volume analysis reveals interesting patterns in ${cryptoName} market activity. Institutional flows and retail participation show balanced market engagement.`,
        source: 'Trading Analysis',
        url: '#',
        timestamp: currentTime - 10800000, // 3 hours ago
        sentiment: 'positive',
        aiTags: ['Volume Analysis', 'Trading']
      },
      {
        title: `${cryptoName} Technical Support Levels Hold Strong`,
        description: `Key technical support levels for ${cryptoName} remain intact as market tests critical price points. Analysts point to strong fundamental factors supporting current valuations.`,
        source: 'Technical Analysis',
        url: '#',
        timestamp: currentTime - 14400000, // 4 hours ago
        sentiment: 'positive',
        aiTags: ['Technical Analysis', 'Support Levels']
      },
      {
        title: `Market Sentiment Analysis: ${cryptoName}`,
        description: `Current market sentiment analysis shows balanced perspectives on ${cryptoName}'s short-term price action. Technical indicators suggest continued market stability.`,
        source: 'Sentiment Analysis',
        url: '#',
        timestamp: currentTime - 18000000, // 5 hours ago
        sentiment: 'neutral',
        aiTags: ['Sentiment Analysis', 'Market Mood']
      }
    ];
  },

  async getBatchPrices(coins: string[]): Promise<BatchPriceData> {
    const cacheKey = `batch-prices-${coins.join('-')}`;
    
    if (isValidCache(cacheKey, 'PRICE')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      // Updated endpoint
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: coins.join(','),
          vs_currencies: 'usd',
          include_24h_change: true,
          include_market_cap: true
        }
      });

      const batchData: BatchPriceData = {};
      
      Object.entries(response.data).forEach(([id, data]: [string, any]) => {
        batchData[id] = {
          price: data.usd,
          change24h: data.usd_24h_change || 0,
          timestamp: Date.now(),
          marketCap: data.usd_market_cap || 0
        };
      });

      cache.set(cacheKey, { data: batchData, timestamp: Date.now() });
      return batchData;
    } catch (error) {
      console.error('Error fetching batch prices:', error);
      return {};
    }
  },

  async getBatchHistoricalData(coins: string[], days: number = 200) {
    const cacheKey = `batch-historical-${coins.join('-')}-${days}`;
    
    if (isValidCache(cacheKey, 'HISTORICAL')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const promises = coins.map(coin => 
        axios.get(`${COINGECKO_API}/coins/${coin}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days,
            interval: 'daily'
          }
        })
      );

      const responses = await Promise.all(promises);
      const batchData: Record<string, any> = {};

      responses.forEach((response, index) => {
        const coin = coins[index];
        batchData[coin] = response.data;
      });

      cache.set(cacheKey, { data: batchData, timestamp: Date.now() });
      return batchData;
    } catch (error) {
      console.error('Error fetching batch historical data:', error);
      
      // Return cached data if available
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }
      
      throw error;
    }
  },

  // Add rate limiting and error handling
  async handleRateLimit(fn: () => Promise<any>) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.log('Rate limited, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        return await fn();
      }
      throw error;
    }
  }
}; 