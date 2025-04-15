"use client"

import { motion } from "framer-motion"
import type { LearningModule, UserProgress } from "@/types/learning"
import { BookOpen, CheckCircle, Lock } from "lucide-react"
import Link from "next/link"

interface ModuleCardProps {
  module: LearningModule
  progress: UserProgress | null
}

export function ModuleCard({ module, progress }: ModuleCardProps) {
  // Calculer le nombre de leçons complétées dans ce module
  const completedLessons = progress
    ? module.lessons.filter((lesson) => progress.completedLessons[lesson.id]?.completed).length
    : 0

  // Calculer le pourcentage de progression
  const progressPercentage = Math.round((completedLessons / module.lessons.length) * 100)

  // Déterminer si le module est déverrouillé
  // Un module est déverrouillé s'il est le premier ou si le module précédent a au moins une leçon complétée
  const isUnlocked =
    module.order === 1 ||
    (progress &&
      module.lessons.some((lesson) =>
        lesson.prerequisites.some((prereq) => progress.completedLessons[prereq]?.completed),
      ))

  // Déterminer la couleur de fond en fonction de la catégorie
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "basics":
        return "from-blue-600 to-cyan-600"
      case "tactics":
        return "from-purple-600 to-pink-600"
      case "openings":
        return "from-green-600 to-teal-600"
      case "strategy":
        return "from-orange-600 to-yellow-600"
      case "endgames":
        return "from-red-600 to-orange-600"
      default:
        return "from-gray-600 to-gray-700"
    }
  }

  // Déterminer le texte de la catégorie
  const getCategoryText = (category: string) => {
    switch (category) {
      case "basics":
        return "Fondamentaux"
      case "tactics":
        return "Tactiques"
      case "openings":
        return "Ouvertures"
      case "strategy":
        return "Stratégie"
      case "endgames":
        return "Finales"
      default:
        return category
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-[#2a2a2a] rounded-lg overflow-hidden shadow-md ${!isUnlocked ? "opacity-70" : ""}`}
    >
      {/* En-tête avec image de fond */}
      <div className={`h-32 bg-gradient-to-r ${getCategoryColor(module.category)} relative`}>
        {module.imageUrl && (
          <div className="absolute inset-0 opacity-30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={module.imageUrl || "/placeholder.svg"}
              alt={module.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="bg-black/30 text-white text-xs px-2 py-1 rounded-full">
              {getCategoryText(module.category)}
            </span>
            <span className="bg-black/30 text-white text-xs px-2 py-1 rounded-full">{module.difficulty}</span>
          </div>

          <h3 className="text-xl font-bold text-white drop-shadow-md">{module.title}</h3>
        </div>
      </div>

      {/* Corps de la carte */}
      <div className="p-4">
        <p className="text-gray-300 text-sm mb-4">{module.description}</p>

        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">
              {completedLessons} sur {module.lessons.length} leçons
            </span>
            <span className="text-cyan-400">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-[#3a3a3a] rounded-full h-2">
            <div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Bouton d'action */}
        {isUnlocked ? (
          <Link href={`/learning/module/${module.id}`}>
            <button className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-2 px-4 rounded flex items-center justify-center">
              {completedLessons > 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  {completedLessons === module.lessons.length ? "Revoir" : "Continuer"}
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Commencer
                </>
              )}
            </button>
          </Link>
        ) : (
          <button
            disabled
            className="w-full bg-[#3a3a3a] text-gray-500 py-2 px-4 rounded flex items-center justify-center cursor-not-allowed"
          >
            <Lock className="h-4 w-4 mr-2" />
            Verrouillé
          </button>
        )}
      </div>
    </motion.div>
  )
}
