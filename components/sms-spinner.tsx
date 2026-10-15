"use client"

import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react" // Standard SMS icon

export function SmsSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* The Animated SMS Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [1, 1.05, 1], // Gentle pulse
          opacity: 1,
          y: [0, -5, 0] // Gentle float
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative flex items-center justify-center"
      >
        {/* The Bubble Background */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-100 shadow-sm">
          {/* The Icon */}
          <MessageSquare className="h-12 w-12 text-blue-600 fill-blue-600" />
          
          {/* Small animated dots inside the bubble (simulating a typing indicator) */}
          <div className="absolute bottom-4 flex gap-1">
            <motion.div 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ repeat: Infinity, duration: 1, delay: 0 }} 
              className="h-1.5 w-1.5 rounded-full bg-blue-600" 
            />
            <motion.div 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} 
              className="h-1.5 w-1.5 rounded-full bg-blue-600" 
            />
            <motion.div 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} 
              className="h-1.5 w-1.5 rounded-full bg-blue-600" 
            />
          </div>
        </div>
      </motion.div>

      {/* The Progress Bar (Mimicking Gmail's loading bar) */}
      <div className="relative h-1 w-64 overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut",
            repeatDelay: 0.5 // Pause before restarting the loop
          }}
        />
      </div>

      {/* Loading Text */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-sm font-medium text-muted-foreground"
      >
        Sending your signal...
      </motion.p>
    </div>
  )
}