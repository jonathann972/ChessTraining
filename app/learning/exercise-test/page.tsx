"use client"

import { useState, useEffect } from "react"
import { validateAllExercises } from "@/utils/exercise-validator"
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function ExerciseTestPage() {
  const [validationResult, setValidationResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function runValidation() {
      try {
        const result = await validateAllExercises()
        setValidationResult(result)
      } catch (error) {
        console.error("Erreur lors de la validation des exercices:", error)
      } finally {
        setLoading(false)
      }
    }

    runValidation()
  }, [])

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">Test des exercices</h1>
          <Link href="/learning">
            <button className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-2 px-4 rounded">Retour</button>
          </Link>
        </div>

        <div className="bg-[#1e1e1e] rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Résumé</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total des exercices</p>
                <p className="text-2xl font-bold text-white">{validationResult?.totalExercises || 0}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Exercices valides</p>
                <p className="text-2xl font-bold text-green-400">{validationResult?.validExercises || 0}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Exercices avec erreurs</p>
                <p className="text-2xl font-bold text-red-400">
                  {(validationResult?.totalExercises || 0) - (validationResult?.validExercises || 0)}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-4">Détails des exercices</h2>

          {validationResult?.exerciseReports && (
            <div className="space-y-4">
              {/* Regrouper par module */}
              {Object.entries(
                validationResult.exerciseReports.reduce((acc: any, report: any) => {
                  if (!acc[report.moduleId]) {
                    acc[report.moduleId] = {
                      id: report.moduleId,
                      name: report.moduleName,
                      lessons: {},
                    }
                  }

                  if (!acc[report.moduleId].lessons[report.lessonId]) {
                    acc[report.moduleId].lessons[report.lessonId] = {
                      id: report.lessonId,
                      name: report.lessonName,
                      exercises: [],
                    }
                  }

                  acc[report.moduleId].lessons[report.lessonId].exercises.push(report)
                  return acc
                }, {}),
              ).map(([moduleId, moduleData]: [string, any]) => (
                <div key={moduleId} className="bg-[#2a2a2a] rounded-lg overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#3a3a3a]"
                    onClick={() => toggleModule(moduleId)}
                  >
                    <div className="flex items-center">
                      {expandedModules[moduleId] ? (
                        <ChevronDown className="h-5 w-5 text-cyan-400 mr-2" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-cyan-400 mr-2" />
                      )}
                      <h3 className="font-medium text-white">{moduleData.name}</h3>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">
                        {Object.values(moduleData.lessons).reduce(
                          (acc: number, lesson: any) => acc + lesson.exercises.length,
                          0,
                        )}{" "}
                        exercices
                      </span>
                      {Object.values(moduleData.lessons).every((lesson: any) =>
                        lesson.exercises.every((ex: any) => ex.valid),
                      ) ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      )}
                    </div>
                  </div>

                  {expandedModules[moduleId] && (
                    <div className="border-t border-[#444] p-4">
                      <div className="space-y-3">
                        {/* Leçons dans le module */}
                        {Object.values(moduleData.lessons).map((lesson: any) => (
                          <div key={lesson.id} className="bg-[#333] rounded-lg overflow-hidden">
                            <div
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#444]"
                              onClick={() => toggleLesson(lesson.id)}
                            >
                              <div className="flex items-center">
                                {expandedLessons[lesson.id] ? (
                                  <ChevronDown className="h-4 w-4 text-cyan-400 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-cyan-400 mr-2" />
                                )}
                                <h4 className="text-sm font-medium text-white">{lesson.name}</h4>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-400 mr-2">{lesson.exercises.length} exercices</span>
                                {lesson.exercises.every((ex: any) => ex.valid) ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                )}
                              </div>
                            </div>

                            {expandedLessons[lesson.id] && (
                              <div className="border-t border-[#555] p-3">
                                <div className="space-y-2">
                                  {/* Exercices dans la leçon */}
                                  {lesson.exercises.map((exercise: any) => (
                                    <div
                                      key={exercise.exerciseId}
                                      className={`p-3 rounded-lg ${exercise.valid ? "bg-[#2a3a2a]" : "bg-[#3a2a2a]"}`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                          {exercise.valid ? (
                                            <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                                          ) : (
                                            <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                                          )}
                                          <h5 className="text-sm font-medium text-white">{exercise.exerciseName}</h5>
                                        </div>
                                        <Link
                                          href={`/learning/lesson/${exercise.lessonId}?exercise=${exercise.exerciseId}`}
                                        >
                                          <button className="text-xs bg-[#444] hover:bg-[#555] text-white py-1 px-2 rounded">
                                            Tester
                                          </button>
                                        </Link>
                                      </div>

                                      {/* Erreurs et avertissements */}
                                      {exercise.errors.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs font-medium text-red-400 mb-1">Erreurs:</p>
                                          <ul className="list-disc list-inside text-xs text-red-300">
                                            {exercise.errors.map((error: string, index: number) => (
                                              <li key={index}>{error}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {exercise.warnings.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs font-medium text-yellow-400 mb-1">Avertissements:</p>
                                          <ul className="list-disc list-inside text-xs text-yellow-300">
                                            {exercise.warnings.map((warning: string, index: number) => (
                                              <li key={index}>{warning}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
