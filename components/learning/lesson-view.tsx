"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import type { Lesson, UserProgress, LessonProgress } from "@/types/learning"
import { getLesson, getUserProgress, updateLessonProgress } from "@/services/learning-service"
import { ChevronLeft, BookOpen, CheckCircle, HelpCircle, AlertTriangle, Award } from "lucide-react"
import Link from "next/link"
import { ExerciseView } from "./exercise-view"
import ReactMarkdown from "react-markdown"
import { LessonTransition } from "./lesson-transition"
// Ajouter l'import pour le composant ModuleProgress
import { ModuleProgress } from "./module-progress"

interface LessonViewProps {
  lessonId: string
  userId: string
}

export function LessonView({ lessonId, userId }: LessonViewProps) {
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1) // -1 signifie qu'on est dans le contenu de la leçon
  const [exerciseResults, setExerciseResults] = useState<Record<string, boolean>>({})
  const [lessonCompleted, setLessonCompleted] = useState(false)

  // États pour la transition
  const [showTransition, setShowTransition] = useState(false)
  const [nextLessonId, setNextLessonId] = useState<string | null>(null)
  const [nextLessonTitle, setNextLessonTitle] = useState<string>("")

  useEffect(() => {
    async function loadData() {
      try {
        const lessonData = await getLesson(lessonId)
        const progressData = getUserProgress(userId)

        setLesson(lessonData)
        setUserProgress(progressData)

        // Réinitialiser l'état de complétion
        setLessonCompleted(false)
        setCurrentExerciseIndex(-1)
        setExerciseResults({})

        // Vérifier si la leçon est déjà complétée
        if (progressData.completedLessons[lessonId]?.completed) {
          setLessonCompleted(true)
        }

        // Précharger les informations de la leçon suivante si elle existe
        if (lessonData.nextLessons && lessonData.nextLessons.length > 0) {
          const nextLessonId = lessonData.nextLessons[0]
          setNextLessonId(nextLessonId)

          try {
            const nextLessonData = await getLesson(nextLessonId)
            if (nextLessonData) {
              setNextLessonTitle(nextLessonData.title)
            }
          } catch (error) {
            console.error("Erreur lors du chargement de la leçon suivante:", error)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    loadData()
  }, [lessonId, userId])

  // Fonction pour gérer la complétion d'un exercice
  const handleExerciseComplete = (exerciseId: string, success: boolean) => {
    setExerciseResults((prev) => ({
      ...prev,
      [exerciseId]: success,
    }))

    // Vérifier si tous les exercices sont complétés avec succès
    if (lesson) {
      const allExercisesCompleted = lesson.exercises.every(
        (ex) => exerciseResults[ex.id] || (ex.id === exerciseId && success),
      )

      if (allExercisesCompleted) {
        completeLesson()
      }
    }
  }

  // Fonction pour marquer la leçon comme complétée
  const completeLesson = async () => {
    if (!userProgress || !lesson) return

    const lessonProgress: LessonProgress = {
      completed: true,
      score: 100, // Score parfait pour l'instant
      attempts: (userProgress.completedLessons[lessonId]?.attempts || 0) + 1,
      lastAttempt: new Date().toISOString(),
    }

    const success = await updateLessonProgress(userId, lessonId, lessonProgress)
    if (success) {
      setLessonCompleted(true)

      // Mettre à jour le niveau de compétence pour cette catégorie
      const updatedProgress = getUserProgress(userId)
      setUserProgress(updatedProgress)
    }
  }

  // Fonction pour naviguer vers la leçon suivante avec transition
  const navigateToNextLesson = () => {
    if (nextLessonId) {
      setShowTransition(true)
    }
  }

  // Fonction appelée lorsque la transition est terminée
  const handleTransitionComplete = () => {
    if (nextLessonId) {
      router.push(`/learning/lesson/${nextLessonId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="bg-[#1e1e1e] rounded-lg shadow-md p-6">
        <div className="text-center text-red-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Leçon introuvable</h2>
          <p className="text-gray-400 mb-4">La leçon que vous recherchez n'existe pas ou a été déplacée.</p>
          <Link href="/learning">
            <button className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-2 px-4 rounded">
              Retour au tableau de bord
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Afficher l'exercice en cours
  if (currentExerciseIndex >= 0 && currentExerciseIndex < lesson.exercises.length) {
    const exercise = lesson.exercises[currentExerciseIndex]
    return (
      <ExerciseView
        exercise={exercise}
        onComplete={(success) => handleExerciseComplete(exercise.id, success)}
        onBack={() => setCurrentExerciseIndex(-1)}
      />
    )
  }

  // Afficher le contenu de la leçon
  return (
    <>
      <LessonTransition
        show={showTransition}
        currentLesson={lesson.title}
        nextLesson={nextLessonTitle}
        onComplete={handleTransitionComplete}
      />
      {userProgress && <ModuleProgress currentLessonId={lessonId} userProgress={userProgress} />}

      <div className="bg-[#1e1e1e] rounded-lg shadow-md">
        {/* En-tête de la leçon */}
        <div className="p-6 border-b border-[#333]">
          <div className="flex items-center mb-4">
            <Link href="/learning">
              <button className="mr-4 p-2 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">{lesson.title}</h1>
              <p className="text-sm text-gray-400">{lesson.description}</p>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <span className="bg-[#2a2a2a] text-white px-2 py-1 rounded-full mr-2">
              {lesson.category === "basics"
                ? "Fondamentaux"
                : lesson.category === "tactics"
                  ? "Tactiques"
                  : lesson.category === "openings"
                    ? "Ouvertures"
                    : lesson.category === "strategy"
                      ? "Stratégie"
                      : lesson.category === "endgames"
                        ? "Finales"
                        : lesson.category}
            </span>
            <span className="bg-[#2a2a2a] text-white px-2 py-1 rounded-full">
              {lesson.difficulty === "beginner"
                ? "Débutant"
                : lesson.difficulty === "intermediate"
                  ? "Intermédiaire"
                  : lesson.difficulty === "advanced"
                    ? "Avancé"
                    : lesson.difficulty === "expert"
                      ? "Expert"
                      : lesson.difficulty}
            </span>
            {lessonCompleted && (
              <span className="ml-auto flex items-center text-green-400">
                <CheckCircle className="h-4 w-4 mr-1" />
                Complété
              </span>
            )}
          </div>
        </div>

        {/* Contenu de la leçon */}
        <div className="p-6">
          <div className="prose prose-invert max-w-none mb-8">
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          </div>

          {/* Liste des exercices */}
          {lesson.exercises.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-cyan-400 mb-4 flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Exercices pratiques
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className={`bg-[#2a2a2a] p-4 rounded-lg cursor-pointer hover:bg-[#3a3a3a] transition-colors ${
                      exerciseResults[exercise.id] ? "border-l-4 border-green-400" : ""
                    }`}
                    onClick={() => setCurrentExerciseIndex(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{exercise.title}</h3>
                      {exerciseResults[exercise.id] ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <HelpCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{exercise.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton de complétion */}
          {!lessonCompleted && lesson.exercises.length === 0 && (
            <button
              onClick={completeLesson}
              className="mt-6 w-full bg-[#1b74e4] hover:bg-[#1b6fd0] text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Marquer comme terminé
            </button>
          )}

          {/* Message de félicitations si la leçon est complétée */}
          {lessonCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-gradient-to-r from-green-600 to-cyan-600 p-6 rounded-lg text-center"
            >
              <Award className="h-12 w-12 text-white mx-auto mb-2" />
              <h3 className="text-xl font-bold text-white mb-2">Félicitations!</h3>
              <p className="text-white/80 mb-4">Vous avez complété cette leçon avec succès.</p>

              {lesson.nextLessons.length > 0 && (
                <button
                  onClick={navigateToNextLesson}
                  className="bg-white text-cyan-600 py-2 px-6 rounded-full font-medium"
                >
                  Leçon suivante
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
