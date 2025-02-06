'use client'

import React from 'react'
import { Brain, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PredictionData } from '@/services/types'

interface PricePredictionsData {
  shortTerm: {
    price: { low: number; high: number }
    confidence: number
    signals: string[]
  }
  midTerm: {
    price: { low: number; high: number }
    confidence: number
    signals: string[]
  }
  longTerm: {
    price: { low: number; high: number }
    confidence: number
    signals: string[]
  }
  externalPredictions?: PredictionData[]
}

interface PricePredictionsProps {
  data: PricePredictionsData
}

export const PricePredictions: React.FC<PricePredictionsProps> = ({ data }) => {
  if (!data) {
    return (
      <Card className="bg-black/30 backdrop-blur-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-300 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Price Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white">Loading predictions...</div>
        </CardContent>
      </Card>
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'from-green-400 to-green-600'
    if (confidence >= 50) return 'from-yellow-400 to-yellow-600'
    return 'from-red-400 to-red-600'
  }

  const formatPrice = (price: number) => 
    `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  const timeframes = [
    { key: 'shortTerm', label: 'Short Term' },
    { key: 'midTerm', label: 'Mid Term' },
    { key: 'longTerm', label: 'Long Term' }
  ] as const

  return (
    <Card className="bg-black/30 backdrop-blur-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-blue-300 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Price Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeframes.map(({ key, label }, index) => (
          <motion.div 
            key={key} 
            className="bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">{label}</span>
              <motion.div 
                className={`px-2 py-1 rounded-full text-sm bg-gradient-to-r ${getConfidenceColor(data[key].confidence)}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
              >
                {data[key].confidence.toFixed(1)}% confidence
              </motion.div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-white">
                <span className="text-slate-400">Range: </span>
                <span className="font-medium">
                  {formatPrice(data[key].price.low)} - {formatPrice(data[key].price.high)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {data[key].price.high > data[key].price.low ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            {data[key].signals.length > 0 && (
              <div className="text-xs text-slate-400">
                {data[key].signals[0]}
              </div>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}