"use client"

import { useState, useEffect, useRef } from "react"
import { Book, Award, Trophy, BarChart2, Calendar, ChevronRight } from "lucide-react"
import type { LearningModule, UserProgress } from "@/types/learning"
import { getLearningModules, getUserProgress } from "@/services/learning-service"
import { ModuleCard } from "./module-card"
import { SkillChart } from "./skill-chart"
import { motion } from "framer-motion"

interface LearningDashboardProps {
  userId: string
}

export function LearningDashboard({ userId }: LearningDashboardProps) {
  const [modules, setModules] = useState<LearningModule[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // Utiliser une référence pour suivre si les données ont déjà été chargées
  const dataLoaded = useRef(false)

  useEffect(() => {
    // Ne charger les données que si userId est défini et que les données n'ont pas encore été chargées
    if (userId && !dataLoaded.current) {
      async function loadData() {
        try {
          setLoading(true)
          const modulesData = await getLearningModules()
          const progressData = getUserProgress(userId)

          setModules(modulesData)
          setUserProgress(progressData)

          // Marquer les données comme chargées
          dataLoaded.current = true
        } catch (error) {
          console.error("Erreur lors du chargement des données:", error)
        } finally {
          setLoading(false)
        }
      }

      loadData()
    }
  }, [userId]) // Dépendance uniquement sur userId

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  // Calculer le nombre total de leçons
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0)

  // Calculer le nombre de leçons complétées
  const completedLessons = userProgress
    ? Object.values(userProgress.completedLessons).filter((lesson) => lesson.completed).length
    : 0

  // Calculer le pourcentage de progression
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="bg-[#1e1e1e] rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
        <Book className="mr-2 h-6 w-6" />
        Mode Apprentissage
      </h1>

      {/* Résumé de progression avec animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#2a2a2a] p-4 rounded-lg flex items-center">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mr-4">
            <Trophy className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Progression totale</p>
            <div className="flex items-center">
              <motion.p
                className="text-xl font-bold text-white mr-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {progressPercentage}%
              </motion.p>
              <div className="w-16 h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                ></motion.div>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {completedLessons} sur {totalLessons} leçons
            </p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] p-4 rounded-lg flex items-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
            <Award className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Exercices complétés</p>
            <motion.p
              className="text-xl font-bold text-white"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {userProgress?.totalExercisesCompleted || 0}
            </motion.p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] p-4 rounded-lg flex items-center">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
            <Calendar className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Jours consécutifs</p>
            <motion.p
              className="text-xl font-bold text-white"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {userProgress?.streakDays || 0}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Graphique des compétences */}
      {userProgress && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-cyan-400 mb-4 flex items-center">
            <BarChart2 className="mr-2 h-5 w-5" />
            Niveau de compétence
          </h2>
          <div className="bg-[#2a2a2a] p-4 rounded-lg">
            <SkillChart skills={userProgress.skillLevels} />
          </div>
        </div>
      )}

      {/* Modules d'apprentissage */}
      <h2 className="text-lg font-medium text-cyan-400 mb-4">Modules d'apprentissage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} progress={userProgress} />
        ))}
      </div>

      {/* Continuer l'apprentissage */}
      {userProgress && completedLessons > 0 && completedLessons < totalLessons && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-cyan-400 mb-4">Continuer l'apprentissage</h2>
          <button className="w-full bg-[#1b74e4] hover:bg-[#1b6fd0] text-white py-3 px-4 rounded-lg flex items-center justify-center">
            <span className="mr-2">Reprendre où vous en étiez</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
