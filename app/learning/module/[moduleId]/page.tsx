"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import type { LearningModule } from "@/types/learning"
import { getLearningModules, getUserProgress } from "@/services/learning-service"
import { ChevronLeft, BookOpen, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ModulePage() {
  const params = useParams()
  const moduleId = params?.moduleId as string

  const [module, setModule] = useState<LearningModule | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // Utiliser une référence pour suivre si les données ont déjà été chargées
  const dataLoaded = useRef(false)

  useEffect(() => {
    // Récupérer l'ID du joueur du localStorage
    if (typeof window !== "undefined") {
      const playerId = localStorage.getItem("playerId")
      if (playerId) {
        setUserId(playerId)
      }
    }
  }, [])

  useEffect(() => {
    // Ne charger les données que si userId est défini et que les données n'ont pas encore été chargées
    if (moduleId && userId && !dataLoaded.current) {
      async function loadData() {
        try {
          setLoading(true)
          const modules = await getLearningModules()
          const foundModule = modules.find((m) => m.id === moduleId) || null
          setModule(foundModule)

          // Marquer les données comme chargées
          dataLoaded.current = true
        } catch (error) {
          console.error("Erreur lors du chargement du module:", error)
        } finally {
          setLoading(false)
        }
      }

      loadData()
    }
  }, [moduleId, userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  if (!module) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#1e1e1e] rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-4">Module introuvable</h2>
            <Link href="/learning">
              <button className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-2 px-4 rounded">
                Retour au tableau de bord
              </button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Récupérer la progression de l'utilisateur
  const userProgress = userId ? getUserProgress(userId) : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1e1e1e] rounded-lg shadow-md">
          {/* En-tête du module */}
          <div className={`h-48 bg-gradient-to-r from-blue-600 to-cyan-600 relative`}>
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

            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <div className="flex items-center">
                <Link href="/learning">
                  <button className="mr-4 p-2 rounded-full bg-black/30 hover:bg-black/40 text-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </Link>
                <span className="bg-black/30 text-white text-sm px-3 py-1 rounded-full">
                  {module.category === "basics"
                    ? "Fondamentaux"
                    : module.category === "tactics"
                      ? "Tactiques"
                      : module.category === "openings"
                        ? "Ouvertures"
                        : module.category === "strategy"
                          ? "Stratégie"
                          : module.category === "endgames"
                            ? "Finales"
                            : module.category}
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-md">{module.title}</h1>
                <p className="text-white/80">{module.description}</p>
              </div>
            </div>
          </div>

          {/* Indicateur de progression */}
          <div className="p-6 border-b border-[#333]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-cyan-400">Progression</h2>
              <span className="text-white font-medium">
                {userProgress
                  ? `${module.lessons.filter((lesson) => userProgress.completedLessons[lesson.id]?.completed).length}/${module.lessons.length} leçons`
                  : "0/0 leçons"}
              </span>
            </div>
            <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    userProgress
                      ? Math.round(
                          (module.lessons.filter((lesson) => userProgress.completedLessons[lesson.id]?.completed)
                            .length /
                            module.lessons.length) *
                            100,
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Liste des leçons */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-cyan-400 mb-4 flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Leçons
            </h2>

            <div className="space-y-4">
              {module.lessons.map((lesson, index) => {
                const isCompleted = userProgress?.completedLessons[lesson.id]?.completed || false
                const isUnlocked =
                  index === 0 ||
                  lesson.prerequisites.some((prereq) => userProgress?.completedLessons[prereq]?.completed)

                return (
                  <div
                    key={lesson.id}
                    className={`bg-[#2a2a2a] p-4 rounded-lg ${
                      isCompleted ? "border-l-4 border-green-400" : ""
                    } ${!isUnlocked ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-white flex items-center">
                        <span className="bg-[#1e1e1e] text-gray-400 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">
                          {index + 1}
                        </span>
                        {lesson.title}
                      </h3>
                      {isCompleted && <CheckCircle className="h-5 w-5 text-green-400" />}
                    </div>
                    <p className="text-sm text-gray-400 ml-9 mb-3">{lesson.description}</p>

                    {isUnlocked ? (
                      <Link href={`/learning/lesson/${lesson.id}`}>
                        <button className="ml-9 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-1.5 px-4 rounded text-sm">
                          {isCompleted ? "Revoir" : "Commencer"}
                        </button>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="ml-9 bg-[#3a3a3a] text-gray-500 py-1.5 px-4 rounded text-sm cursor-not-allowed"
                      >
                        Verrouillé
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
