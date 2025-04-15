"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { CheckCircle, Circle, ChevronRight, ChevronLeft } from "lucide-react"
import type { LearningModule, UserProgress } from "@/types/learning"
import { getLearningModules } from "@/services/learning-service"

interface ModuleProgressProps {
  currentLessonId: string
  userProgress: UserProgress
}

export function ModuleProgress({ currentLessonId, userProgress }: ModuleProgressProps) {
  const [module, setModule] = useState<LearningModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function loadModuleData() {
      try {
        setLoading(true)
        const modules = await getLearningModules()

        // Trouver le module qui contient la leçon actuelle
        const foundModule = modules.find((m) => m.lessons.some((lesson) => lesson.id === currentLessonId))

        if (foundModule) {
          setModule(foundModule)

          // Trouver l'index de la leçon actuelle dans le module
          const lessonIndex = foundModule.lessons.findIndex((lesson) => lesson.id === currentLessonId)

          setCurrentIndex(lessonIndex)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données du module:", error)
      } finally {
        setLoading(false)
      }
    }

    loadModuleData()
  }, [currentLessonId])

  if (loading || !module) {
    return <div className="h-12 bg-[#2a2a2a] rounded-lg animate-pulse"></div>
  }

  // Calculer le pourcentage de progression
  const totalLessons = module.lessons.length
  const completedLessons = module.lessons.filter((lesson) => userProgress.completedLessons[lesson.id]?.completed).length

  const progressPercentage = Math.round((completedLessons / totalLessons) * 100)

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-cyan-400">{module.title}</h3>
        <div className="flex items-center">
          <span className="text-xs text-gray-400 mr-2">
            {completedLessons}/{totalLessons} leçons
          </span>
          <div className="w-16 h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* Version compacte (affiche seulement quelques leçons autour de la leçon actuelle) */}
      {!showAll && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setShowAll(true)}
            className="p-1 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] text-gray-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {module.lessons.map((lesson, index) => {
            // Afficher seulement la leçon actuelle et 2 leçons avant/après
            const shouldShow =
              index === currentIndex ||
              index === currentIndex - 1 ||
              index === currentIndex - 2 ||
              index === currentIndex + 1 ||
              index === currentIndex + 2

            if (!shouldShow) {
              // Afficher des points de suspension pour les leçons cachées
              if (index === 0 && currentIndex > 2) {
                return (
                  <div key={`ellipsis-start`} className="text-gray-500">
                    ...
                  </div>
                )
              }
              if (index === module.lessons.length - 1 && currentIndex < module.lessons.length - 3) {
                return (
                  <div key={`ellipsis-end`} className="text-gray-500">
                    ...
                  </div>
                )
              }
              return null
            }

            const isCompleted = userProgress.completedLessons[lesson.id]?.completed
            const isCurrent = index === currentIndex

            return (
              <Link
                key={lesson.id}
                href={`/learning/lesson/${lesson.id}`}
                className={`relative ${isCurrent ? "scale-125 z-10" : ""}`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${
                      isCurrent
                        ? "bg-cyan-500 text-white"
                        : isCompleted
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[#3a3a3a] text-gray-400"
                    }
                    ${index < currentIndex ? "opacity-80" : ""}
                    transition-all duration-200
                  `}
                  title={lesson.title}
                >
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </motion.div>
                {isCurrent && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-medium text-cyan-400">
                      {index + 1}/{totalLessons}
                    </span>
                  </div>
                )}
              </Link>
            )
          })}

          <button
            onClick={() => setShowAll(true)}
            className="p-1 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] text-gray-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Version étendue (affiche toutes les leçons) */}
      {showAll && (
        <div className="space-y-2">
          <button
            onClick={() => setShowAll(false)}
            className="text-xs text-cyan-400 hover:underline mb-2 flex items-center"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Vue compacte
          </button>

          {module.lessons.map((lesson, index) => {
            const isCompleted = userProgress.completedLessons[lesson.id]?.completed
            const isCurrent = index === currentIndex

            return (
              <Link key={lesson.id} href={`/learning/lesson/${lesson.id}`}>
                <div
                  className={`
                  flex items-center p-2 rounded-lg
                  ${isCurrent ? "bg-[#1b74e4]/20 border-l-4 border-[#1b74e4]" : "hover:bg-[#3a3a3a]"}
                  transition-colors
                `}
                >
                  <div
                    className={`
                    w-6 h-6 rounded-full flex items-center justify-center mr-3
                    ${isCompleted ? "bg-green-500/20 text-green-400" : "bg-[#3a3a3a] text-gray-400"}
                  `}
                  >
                    {isCompleted ? <CheckCircle className="h-3 w-3" /> : <span className="text-xs">{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm ${isCurrent ? "text-cyan-400 font-medium" : "text-white"}`}>
                      {lesson.title}
                    </h4>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
