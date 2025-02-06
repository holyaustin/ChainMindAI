'use client'

import React from 'react'
import { Target, ArrowRight, Crosshair } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TradingStrategy as TradingStrategyType } from '../../services/types'

interface TradingStrategyProps {
  data: TradingStrategyType
}

export const TradingStrategy: React.FC<TradingStrategyProps> = ({ data }) => {
  if (!data || !data.entries || !data.stopLoss || !data.targets) {
    return (
      <Card className="bg-black/30 backdrop-blur-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-300 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Trading Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white">Loading trading strategy...</div>
        </CardContent>
      </Card>
    )
  }

  const formatPrice = (price: number | undefined) => 
    `$${(price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  const recommendationParts = data.recommendation.split('(');
  const recommendation = recommendationParts[0].trim();

  const getRecommendationColor = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'buy': return 'from-green-400 to-green-600';
      case 'sell': return 'from-red-400 to-red-600';
      case 'hold': return 'from-yellow-400 to-yellow-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  return (
    <Card className="bg-black/30 backdrop-blur-lg border-none">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-bold text-blue-300 flex items-center gap-2">
          <Crosshair className="w-5 h-5" />
          Trading Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div 
          className={`text-xl md:text-3xl font-bold text-center p-3 md:p-4 rounded-lg bg-gradient-to-r ${getRecommendationColor(recommendation)}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {recommendation} ({data.confidence}%)
        </motion.div>

        {/* Entry Points */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="text-sm text-slate-300">Entry Points</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.entries || {}).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-white">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stop Losses */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h4 className="text-sm text-slate-300">Stop Loss Levels</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.stopLoss).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-red-400">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Targets */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h4 className="text-sm text-slate-300">Price Targets</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.targets).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              >
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-green-400">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rationale */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h4 className="text-sm text-slate-300">Strategy Rationale</h4>
          <div className="space-y-1">
            {data.rationale.map((reason, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-2 text-xs text-slate-400"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
              >
                <ArrowRight className="w-3 h-3 text-blue-400" />
                <span>{reason}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}