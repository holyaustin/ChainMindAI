'use client'

import React from 'react'
import { Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TechnicalSignals as TechnicalSignalsType } from '../../services/types'

interface TechnicalSignalsProps {
  data: TechnicalSignalsType
}

export const TechnicalSignals: React.FC<TechnicalSignalsProps> = ({ data }) => {
  const getTrendColor = (trend: string | number) => {
    const trendStr = String(trend).toLowerCase();
    switch (trendStr) {
      case 'bullish': return 'text-green-400'
      case 'bearish': return 'text-red-400'
      default: return 'text-yellow-400'
    }
  }

  const getSignalColor = (signal: string) => {
    if (signal.includes('bullish') || signal.includes('overbought')) return 'text-green-400'
    if (signal.includes('bearish') || signal.includes('oversold')) return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <Card className="bg-black/30 backdrop-blur-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-blue-300 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Technical Signals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Analysis */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h4 className="text-sm text-slate-300">Trend Analysis</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.trend).map(([type, trend], index) => (
              <motion.div 
                key={type} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className={`font-medium ${getTrendColor(trend)}`}>
                  {trend}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Momentum */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="text-sm text-slate-300">Momentum</h4>
          <div className="space-y-2">
            {Object.entries(data.momentum).map(([indicator, data], index) => (
              <motion.div 
                key={indicator} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">{indicator.toUpperCase()}</span>
                  <span className={`text-sm ${getSignalColor(data.signal)}`}>
                    {data.value.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs mt-1 text-slate-400">
                  {data.signal}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Volatility */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h4 className="text-sm text-slate-300">Volatility</h4>
          <motion.div 
            className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Current</span>
              <span className={`text-sm ${
                data.volatility.risk === 'high' ? 'text-red-400' :
                data.volatility.risk === 'medium' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {data.volatility.current.toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {data.volatility.trend} trend, {data.volatility.risk} risk
            </div>
          </motion.div>
        </motion.div>

        {/* Volume Analysis */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h4 className="text-sm text-slate-300">Volume Analysis</h4>
          <motion.div 
            className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Change</span>
              <span className={`text-sm ${
                data.volume.change > 1.5 ? 'text-green-400' :
                data.volume.change < 0.5 ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {data.volume.change.toFixed(2)}x
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {data.volume.trend} trend, {data.volume.significance} significance
            </div>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  )
}