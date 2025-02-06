'use client'

import React from 'react'
import { AlertTriangle, Shield} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RiskAnalysisProps {
  data: {
    overall: number
    factors: Record<string, number>
    warnings: string[]
  }
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ data }) => {
  const getRiskColor = (risk: number) => {
    if (risk > 70) return 'from-red-400 to-red-600'
    if (risk > 50) return 'from-yellow-400 to-yellow-600'
    return 'from-green-400 to-green-600'
  }

  return (
    <Card className="bg-black/30 backdrop-blur-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-300 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-slate-300">Overall Risk</span>
          <motion.div 
            className={`px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${getRiskColor(data.overall)}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.5 }}
          >
            {data.overall.toFixed(1)}%
          </motion.div>
        </motion.div>

        {/* Risk Factors */}
        <div className="space-y-3">
          {Object.entries(data.factors).map(([factor, value], index) => (
            <motion.div 
              key={factor} 
              className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">
                  {factor.charAt(0).toUpperCase() + factor.slice(1)} Risk
                </span>
                <span className={`text-sm font-medium ${getRiskColor(value).split(' ')[1]}`}>
                  {value.toFixed(1)}%
                </span>
              </div>
              <motion.div 
                className="h-1.5 bg-slate-700 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              >
                <motion.div 
                  className={`h-full bg-gradient-to-r ${getRiskColor(value)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Risk Warnings */}
        {data.warnings.length > 0 && (
          <motion.div 
            className="space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h4 className="text-sm text-slate-300">Risk Warnings</h4>
            <div className="space-y-1">
              {data.warnings.map((warning, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-2 text-xs text-red-400"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{warning}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}