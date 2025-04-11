"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Award, X, TrendingUp, TrendingDown } from "lucide-react"

interface GameResultModalProps {
  isOpen: boolean
  onClose: () => void
  result: "win" | "loss" | "draw" | null
  oldElo: number
  newElo: number
  opponentName: string
}

export function GameResultModal({ isOpen, onClose, result, oldElo, newElo, opponentName }: GameResultModalProps) {
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Réinitialiser l'animation quand le modal s'ouvre
      setAnimationComplete(false)

      // Déclencher l'animation après un court délai
      const timer = setTimeout(() => {
        setAnimationComplete(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Si le modal n'est pas ouvert ou s'il n'y a pas de résultat, ne rien afficher
  if (!isOpen || !result) return null

  const eloDifference = newElo - oldElo

  // Déterminer le titre et la couleur en fonction du résultat
  let title = ""
  let bgColor = ""
  let icon = null

  if (result === "win") {
    title = "Victoire !"
    bgColor = "from-green-600 to-green-800"
    icon = <TrendingUp className="h-8 w-8 text-white" />
  } else if (result === "loss") {
    title = "Défaite"
    bgColor = "from-red-600 to-red-800"
    icon = <TrendingDown className="h-8 w-8 text-white" />
  } else {
    title = "Match nul"
    bgColor = "from-yellow-600 to-yellow-800"
    icon = <Award className="h-8 w-8 text-white" />
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative w-full max-w-md rounded-lg shadow-xl overflow-hidden bg-gradient-to-br ${bgColor}`}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">{icon}</div>

              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              <p className="text-white/80 mb-6">Contre {opponentName}</p>

              <div className="flex justify-center items-center mb-6">
                <Trophy className="h-6 w-6 text-yellow-300 mr-2" />
                <div className="flex items-baseline">
                  <span className="text-xl font-medium text-white/90">{oldElo}</span>
                  <span className="mx-2 text-white/70">→</span>
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={animationComplete ? { y: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-white"
                  >
                    {newElo}
                  </motion.span>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={animationComplete ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`inline-block px-4 py-2 rounded-full font-bold ${
                  eloDifference > 0
                    ? "bg-green-500 text-white"
                    : eloDifference < 0
                      ? "bg-red-500 text-white"
                      : "bg-yellow-500 text-white"
                }`}
              >
                {eloDifference > 0 ? "+" : ""}
                {eloDifference} points ELO
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
