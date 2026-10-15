"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function AnimatedSmsIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#F0F2F5] overflow-hidden">
      {/* Abstract Background Shapes for depth */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-400 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
        
        {/* The Image in Motion (Floating up and down) */}
        <motion.div
          animate={{ 
            y: [0, -15, 0], // Moves up 15px and back down
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative w-full h-auto flex justify-center"
        >
          {/* Your actual image */}
          <Image 
            src="/image.png" 
            alt="Delivery rider on bicycle" 
            width={500} 
            height={350} 
            className="object-contain drop-shadow-xl"
            priority
          />

          {/* Animated SMS Bubble 1 (Typing Indicator) coming from the back */}
          <motion.div
            initial={{ y: 0, opacity: 0, scale: 0.8, x: -20 }}
            animate={{ 
              y: [-10, -80, -120], 
              opacity: [0, 1, 0],
              scale: [0.8, 1, 0.9],
              x: [-20, -40, -60]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeOut",
              times: [0, 0.4, 1]
            }}
            className="absolute top-10 left-0 bg-white p-3 rounded-2xl rounded-bl-none shadow-lg border border-gray-100 flex items-center justify-center min-w-[100px]"
          >
            <div className="flex gap-1">
               <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
               <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75" />
               <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150" />
            </div>
          </motion.div>

          {/* Animated SMS Bubble 2 (New Message) */}
          <motion.div
            initial={{ y: 0, opacity: 0, x: -20 }}
            animate={{ 
              y: [-20, -140], 
              x: [-20, -80],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeOut",
              delay: 1.5 
            }}
            className="absolute top-20 left-10 bg-blue-600 px-4 py-2 rounded-2xl rounded-br-none shadow-lg text-white text-sm font-bold"
          >
            SMS Sent!
          </motion.div>
        </motion.div>

      </div>
    </div>
  )
}