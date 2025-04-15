/**
 * Utilitaire pour tester et valider les exercices d'échecs
 */
import { Chess } from "chess.js"
import { getLearningModules } from "@/services/learning-service"
import type { Exercise } from "@/types/learning"

/**
 * Vérifie si un exercice est correctement configuré
 * @param exercise L'exercice à vérifier
 * @returns Un objet contenant le résultat de la validation
 */
export async function validateExercise(exercise: Exercise): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  // Vérifier si la FEN est valide
  try {
    new Chess(exercise.fen)
  } catch (error) {
    errors.push(`FEN invalide: ${error}`)
  }

  // Vérifier si les solutions sont valides
  if (!exercise.solution || exercise.solution.length === 0) {
    errors.push("Aucune solution définie")
  } else {
    // Vérifier chaque solution
    for (const solution of exercise.solution) {
      try {
        const game = new Chess(exercise.fen)

        // Format attendu: "e2e4" (de-vers)
        if (solution.length < 4) {
          errors.push(`Solution invalide: ${solution} (format attendu: "e2e4")`)
          continue
        }

        const from = solution.substring(0, 2)
        const to = solution.substring(2, 4)
        const promotion = solution.length > 4 ? solution.substring(4, 5) : undefined

        const move = game.move({ from, to, promotion })
        if (!move) {
          errors.push(`Solution invalide: ${solution} n'est pas un coup légal`)
        }
      } catch (error) {
        errors.push(`Erreur lors de la vérification de la solution ${solution}: ${error}`)
      }
    }
  }

  // Vérifier les cas spéciaux
  if (exercise.id === "knight-movement") {
    // Vérifier que toutes les solutions du mouvement du cavalier sont présentes
    const expectedMoves = ["e4c3", "e4c5", "e4d2", "e4d6", "e4f2", "e4f6", "e4g3", "e4g5"]
    const missingSolutions = expectedMoves.filter((move) => !exercise.solution.includes(move))

    if (missingSolutions.length > 0) {
      warnings.push(`Mouvement du cavalier: solutions manquantes: ${missingSolutions.join(", ")}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Vérifie tous les exercices dans tous les modules
 * @returns Un rapport de validation pour tous les exercices
 */
export async function validateAllExercises(): Promise<{
  valid: boolean
  totalExercises: number
  validExercises: number
  exerciseReports: {
    moduleId: string
    moduleName: string
    lessonId: string
    lessonName: string
    exerciseId: string
    exerciseName: string
    valid: boolean
    errors: string[]
    warnings: string[]
  }[]
}> {
  const modules = await getLearningModules()
  const exerciseReports: {
    moduleId: string
    moduleName: string
    lessonId: string
    lessonName: string
    exerciseId: string
    exerciseName: string
    valid: boolean
    errors: string[]
    warnings: string[]
  }[] = []

  let totalExercises = 0
  let validExercises = 0

  // Parcourir tous les modules
  for (const module of modules) {
    // Parcourir toutes les leçons
    for (const lesson of module.lessons) {
      // Parcourir tous les exercices
      if (lesson.exercises && lesson.exercises.length > 0) {
        for (const exercise of lesson.exercises) {
          totalExercises++

          // Valider l'exercice
          const validation = await validateExercise(exercise)

          if (validation.valid) {
            validExercises++
          }

          exerciseReports.push({
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title,
            exerciseId: exercise.id,
            exerciseName: exercise.title,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
          })
        }
      }
    }
  }

  return {
    valid: validExercises === totalExercises,
    totalExercises,
    validExercises,
    exerciseReports,
  }
}

/**
 * Vérifie si un coup est valide pour un exercice donné
 * @param exercise L'exercice à vérifier
 * @param move Le coup à vérifier (format: {from: "e2", to: "e4"})
 * @returns true si le coup est valide, false sinon
 */
export function isValidMove(exercise: Exercise, move: { from: string; to: string; promotion?: string }): boolean {
  // Cas spécial pour l'exercice du mouvement du cavalier
  if (exercise.id === "knight-movement") {
    // Pour cet exercice, tout mouvement légal du cavalier depuis e4 est correct
    if (move.from === "e4") {
      // Vérifier si c'est un mouvement de cavalier valide
      const knightMoves = ["c3", "c5", "d2", "d6", "f2", "f6", "g3", "g5"]
      return knightMoves.includes(move.to)
    }
  }

  // Pour les autres exercices, vérifier si le coup est dans la liste des solutions
  const moveString = `${move.from}${move.to}${move.promotion || ""}`
  return exercise.solution.includes(moveString)
}
