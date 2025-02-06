# Crypsphere

A complete real-time cryptocurrency analysis platform that combines technical analysis, sentiment analysis, trading volume data, news trends, and AI-Agent powered predictions to provide comprehensive market insights and trading recommendations.

## Try Out Here: https://crypsphere.vercel.app/
(Note: You may hit the rate limit, as this is using Coingeko free API.)
## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Technical Architecture](#technical-architecture)
4. [Core Components](#core-components)
5. [Analysis Modules](#analysis-modules)
6. [AI Integration](#ai-integration)
7. [Setup Instructions](#setup-instructions)
8. [API Documentation](#api-documentation)
9. [Contributing](#contributing)
10. [License](#license)

## Overview

A Web3-based cryptocurrency analysis platform that provides real-time market insights, technical analysis, and AI-Agent powered trading recommendations. The platform combines multiple data sources and advanced algorithms to deliver comprehensive market analysis.

### Core Features
- Real-time price tracking and analysis
- Multiple timeframe support (1H, 4H, 1D, 1W, 1M)
- Advanced technical analysis with multiple indicators
- AI-Agent powered price predictions
- Sentiment analysis from news and social media
- Risk assessment and management
- Automated trading strategy generation
- Real-time WebSocket data streaming
- Responsive and interactive UI with Framer Motion animations

## Technical Architecture

### Frontend Stack
- Next.js 14
- TypeScript
- TailwindCSS
- Framer Motion
- Shadcn/ui Components
- TensorFlow.js

### Backend Services
- Express.js server
- WebSocket server for real-time data
- TensorFlow.js for ML models
- News API integration
- CoinGecko API integration
- Gemini API
- Akash API

### Data Flow
1. Real-time price data via WebSocket
2. Historical data from CoinGecko API
3. News data from NewsData API
4. Sentiment analysis processing
5. ML model predictions
6. Strategy generation
7. UI updates and animations

## Core Components

### Market Analysis (`src/components/MarketAnalysis.tsx`)
- Real-time market analysis dashboard
- Technical indicator visualization
- Price action analysis
- Volume profile analysis
- Market structure detection

### Advanced Analysis (`src/components/AdvancedAnalysis.tsx`)
- Comprehensive market analysis
- Multiple analysis modules integration
- Real-time data processing
- Interactive visualization components

### News Panel (`src/components/NewsPanel.tsx`)
- Real-time news aggregation
- Sentiment analysis integration
- Source credibility scoring
- Interactive news cards with metadata

## Analysis Modules

### Technical Analysis

#### Technical indicators implemented:
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
Moving Averages (20, 50, 200)
Bollinger Bands
Volume Profile
Support/Resistance Levels

### Market Phase Detection

#### Market phases identified:
- Accumulation
- Mark Up
Distribution
Mark Down
Ranges and Transitions

### Risk Analysis
```typescript
// Risk factors considered:
- Volatility Risk
- Trend Risk
- Volume Risk
- News Risk
- Social Sentiment Risk
- Market Structure Risk
```

### Trading Strategy Generation
```typescript
// Strategy components:
- Entry Points (Conservative, Moderate, Aggressive)
- Stop Loss Levels (Tight, Normal, Wide)
- Take Profit Targets
- Position Sizing Recommendations
- Timeframe Selection
```

## AI Integration

### Machine Learning Models (`src/services/ml/models.ts`)
- TrendModel: Predicts market trend direction
- PriceModel: Generates price predictions
- LevelModel: Identifies key price levels

### Model Architecture
```typescript
// Sequential model structure:
model.add(tf.layers.dense({
  units: 32,
  activation: 'relu',
  inputShape: [4]
}));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.dense({
  units: 16,
  activation: 'relu'
}));
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (optional)

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Environment Variables
```env
VITE_PORT=3001
VITE_NEWSDATA_API_KEY=your_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## API Documentation

### WebSocket API
```typescript
// Connect to WebSocket
const ws = new WebSocket(`ws://crypto-sensei.vercel.app:3001`);

// Subscribe to crypto updates
ws.send(JSON.stringify({
  type: 'subscribe',
  crypto: 'bitcoin'
}));
```

### REST API Endpoints
```typescript
// Price data
GET /api/crypto/price/:id

// Historical data
GET /api/crypto/history/:id

// News data
GET /api/news/:crypto

// Analysis data
GET /api/analysis/:crypto
```

## Data Management

### Caching Strategy
- Price data: 1 minute
- News data: 15 minutes
- Historical data: 5 minutes
- Analysis results: 3 minutes

### Rate Limiting
```typescript
const CACHE_DURATION = {
  PRICE: 1 * 60 * 1000,
  NEWS: 15 * 60 * 1000,
  HISTORICAL: 5 * 60 * 1000,
  SENTIMENT: 3 * 60 * 1000,
};
```

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Follow component structure guidelines
- Include proper documentation

## License

MIT License - see LICENSE.md for details

---

