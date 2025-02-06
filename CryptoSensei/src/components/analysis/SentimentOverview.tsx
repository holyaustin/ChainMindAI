'use client'
import {Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const SentimentOverview = ({ data }: { data: any }) => {
  return (
    <Card className="bg-black/30 backdrop-blur-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-green-300 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Market Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-slate-300">Overall Sentiment</span>
          <motion.div 
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              data.overall.signal === 'bullish' ? 'bg-green-500/20 text-green-400' :
              data.overall.signal === 'bearish' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.5 }}
          >
            {data.overall.signal} ({data.overall.confidence}%)
          </motion.div>
        </motion.div>

        {/* Components */}
        <div className="space-y-4">
          {/* News Sentiment */}
          <motion.div 
            className="bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">News Sentiment</span>
              <span className="text-sm font-medium text-blue-400">{data.components.news.score.toFixed(1)}%</span>
            </div>
            <div className="space-y-1">
              {data.components.news.recent.map((news: string, index: number) => (
                <motion.div 
                  key={index} 
                  className="text-xs text-slate-400 truncate"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  {news}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Social Sentiment */}
          <motion.div 
            className="bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Social Sentiment</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-400">{data.components.social.score.toFixed(1)}%</span>
                <span className="text-xs text-slate-400">
                  Vol: {data.components.social.volume.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Market Sentiment */}
          <motion.div 
            className="bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Market Flow</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-400">{data.components.market.score.toFixed(1)}%</span>
                <span className="text-xs text-slate-400">
                  Dom: {data.components.market.dominance.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}