"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Award, ChevronRight } from "lucide-react"

interface LessonTransitionProps {
  show: boolean
  currentLesson: string
  nextLesson: string
  onComplete: () => void
}

export function LessonTransition({ show, currentLesson, nextLesson, onComplete }: LessonTransitionProps) {
  const [stage, setStage] = useState<"initial" | "complete" | "next">("initial")

  useEffect(() => {
    if (show) {
      // Séquence d'animation
      const initialTimer = setTimeout(() => {
        setStage("complete")
      }, 1000)

      const completeTimer = setTimeout(() => {
        setStage("next")
      }, 2500)

      const finalTimer = setTimeout(() => {
        onComplete()
      }, 4000)

      return () => {
        clearTimeout(initialTimer)
        clearTimeout(completeTimer)
        clearTimeout(finalTimer)
      }
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-md">
        {stage === "initial" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-[#1e1e1e] rounded-lg p-6 text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">Leçon en cours</h2>
            <p className="text-cyan-400 text-lg font-medium">{currentLesson}</p>
          </motion.div>
        )}

        {stage === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg p-8 text-center"
          >
            <Award className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Leçon complétée !</h2>
            <p className="text-white/80">Félicitations pour votre progression</p>
          </motion.div>
        )}

        {stage === "next" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-[#1e1e1e] rounded-lg p-6 text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">Prochaine leçon</h2>
            <p className="text-cyan-400 text-lg font-medium mb-4">{nextLesson}</p>
            <div className="flex justify-center">
              <motion.div
                initial={{ x: -10 }}
                animate={{ x: 10 }}
                transition={{ repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", duration: 0.8 }}
              >
                <ChevronRight className="h-6 w-6 text-cyan-400" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
