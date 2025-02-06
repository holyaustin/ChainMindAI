'use client'

import React from 'react'
import { Activity} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MarketPhaseProps {
  data: {
    phase: string
    strength: number
    confidence: number
    keyLevels: {
      strongSupport: number
      support: number
      pivot: number
      resistance: number
      strongResistance: number
    }
  }
}

export const MarketPhase: React.FC<MarketPhaseProps> = ({ data }) => {
  if (!data || !data.keyLevels) {
    return (
      <Card className="bg-black/30 backdrop-blur-lg border-none">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-bold text-blue-300 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Market Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white">Loading market phase data...</div>
        </CardContent>
      </Card>
    )
  }
  
  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'accumulation': return 'from-yellow-400 to-yellow-600'
      case 'markup': return 'from-green-400 to-green-600'
      case 'distribution': return 'from-red-400 to-red-600'
      case 'markdown': return 'from-red-500 to-red-700'
      default: return 'from-blue-400 to-blue-600'
    }
  }

  return (
    <Card className="bg-black/30 backdrop-blur-lg border-none overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-bold text-blue-300 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Market Phase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        <motion.div 
          className={`text-xl md:text-3xl font-bold text-center p-3 md:p-4 rounded-lg bg-gradient-to-r ${getPhaseColor(data.phase)}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {data.phase}
        </motion.div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs md:text-sm text-slate-300">
            <span>Strength</span>
            <span>{(data.strength * 100).toFixed(1)}%</span>
          </div>
          <motion.div 
            className="h-2 bg-slate-700 rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${data.strength * 100}%` }}
              transition={{ duration: 0.5, delay: 0.8 }}
            />
          </motion.div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {Object.entries(data.keyLevels).map(([level, price], index) => (
            <motion.div 
              key={level} 
              className="bg-slate-800/50 p-2 md:p-3 rounded-lg backdrop-blur-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="text-[10px] md:text-xs text-slate-400 mb-1">
                {level.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm md:text-base font-medium text-white truncate">
                ${(price as number).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}