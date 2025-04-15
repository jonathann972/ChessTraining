"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { Exercise } from "@/types/learning"
import { ChevronLeft, HelpCircle, CheckCircle, AlertTriangle } from "lucide-react"
import { Chessboard } from "react-chessboard"
import { Chess } from "chess.js"
import { ensureValidFEN } from "@/utils/fen-validator"
import { isValidMove } from "@/utils/exercise-validator"

interface ExerciseViewProps {
  exercise: Exercise
  onComplete: (success: boolean) => void
  onBack: () => void
}

export function ExerciseView({ exercise, onComplete, onBack }: ExerciseViewProps) {
  // Utiliser ensureValidFEN pour garantir que la FEN est valide
  const validFen = ensureValidFEN(exercise.fen)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const [game, setGame] = useState<Chess | null>(null)
  const [status, setStatus] = useState<"initial" | "hint" | "success" | "failure">("initial")
  const [hintIndex, setHintIndex] = useState(0)
  const [movesMade, setMovesMade] = useState<string[]>([])
  const [showSolution, setShowSolution] = useState(false)
  const [solutionArrows, setSolutionArrows] = useState<[string, string, string][]>([])

  // Initialiser le jeu avec la FEN validée
  useEffect(() => {
    try {
      // Vérifier si la FEN a été corrigée
      if (validFen !== exercise.fen) {
        setValidationMessage(`La position a été corrigée pour assurer sa validité.`)
      }

      // Créer une instance Chess avec la FEN validée
      const newGame = new Chess(validFen)
      setGame(newGame)
    } catch (error) {
      console.error("Erreur lors de la création du jeu avec FEN:", error)
      setValidationMessage(`Erreur: Impossible de créer une position valide. Une position par défaut a été utilisée.`)

      // Utiliser une position de départ par défaut en cas d'erreur
      setGame(new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"))
    }
  }, [validFen, exercise.fen])

  // Fonction pour gérer les coups sur l'échiquier
  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!game) return false

    try {
      // Créer un objet de coup
      const moveObj = {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Toujours promouvoir en dame pour simplifier
      }

      // Vérifier si le coup est légal selon les règles d'échecs
      const move = game.move(moveObj)

      // Si le coup n'est pas légal, retourner false
      if (!move) return false

      // Mettre à jour le jeu
      setGame(new Chess(game.fen()))

      // Ajouter le coup à la liste des coups joués
      const moveString = `${sourceSquare}${targetSquare}${move.promotion || ""}`
      setMovesMade((prev) => [...prev, moveString])

      // Vérifier si le coup fait partie de la solution
      if (isValidMove(exercise, moveObj)) {
        setStatus("success")
        onComplete(true)
      } else {
        setStatus("failure")
      }

      return true
    } catch (error) {
      console.error("Erreur lors du déplacement:", error)
      return false
    }
  }

  // Fonction pour afficher un indice
  const showHint = () => {
    setStatus("hint")
    if (hintIndex < exercise.hints.length - 1) {
      setHintIndex(hintIndex + 1)
    }
  }

  // Fonction pour réinitialiser l'exercice
  const resetExercise = () => {
    try {
      setGame(new Chess(validFen))
    } catch (error) {
      console.error("Erreur lors de la réinitialisation avec FEN:", error)
      setGame(new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"))
    }
    setStatus("initial")
    setMovesMade([])
    setShowSolution(false)
    setSolutionArrows([])
  }

  // Fonction pour afficher la solution avec des flèches
  const revealSolution = () => {
    setShowSolution(true)
    setStatus("failure")

    // Créer des flèches pour chaque solution possible
    let arrows: [string, string, string][] = []

    // Cas spécial pour l'exercice du mouvement du cavalier
    if (exercise.id === "knight-movement") {
      // Montrer tous les mouvements possibles du cavalier
      const knightMoves = [
        ["e4", "c3", "#1b74e4"],
        ["e4", "c5", "#1b74e4"],
        ["e4", "d2", "#1b74e4"],
        ["e4", "d6", "#1b74e4"],
        ["e4", "f2", "#1b74e4"],
        ["e4", "f6", "#1b74e4"],
        ["e4", "g3", "#1b74e4"],
        ["e4", "g5", "#1b74e4"],
      ] as [string, string, string][]
      arrows = knightMoves
    } else {
      // Pour les autres exercices, utiliser les solutions définies
      arrows = exercise.solution.map((move) => {
        const from = move.substring(0, 2)
        const to = move.substring(2, 4)
        return [from, to, "#1b74e4"] // Couleur bleue pour les flèches
      })
    }

    setSolutionArrows(arrows)
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg shadow-md">
      {/* En-tête de l'exercice */}
      <div className="p-6 border-b border-[#333]">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-4 p-2 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-cyan-400">{exercise.title}</h1>
            <p className="text-sm text-gray-400">{exercise.description}</p>
          </div>
        </div>
      </div>

      {/* Contenu de l'exercice */}
      <div className="p-6">
        {validationMessage && (
          <div className="mb-4 p-3 bg-yellow-600/20 border-l-4 border-yellow-500 text-yellow-200 text-sm">
            <AlertTriangle className="inline-block h-4 w-4 mr-2" />
            {validationMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Échiquier */}
          <div className="w-full aspect-square max-w-md mx-auto">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              boardOrientation="white"
              customArrows={solutionArrows}
              customBoardStyle={{
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                overflow: "hidden",
              }}
              customDarkSquareStyle={{ backgroundColor: "#3d8b72" }}
              customLightSquareStyle={{ backgroundColor: "#e2e8d5" }}
            />
          </div>

          {/* Panneau d'information */}
          <div className="flex flex-col">
            {/* Message de statut */}
            {status === "initial" && (
              <div className="bg-[#2a2a2a] p-4 rounded-lg mb-4">
                <p className="text-white">Trouvez le meilleur coup dans cette position.</p>
              </div>
            )}

            {status === "hint" && (
              <div className="bg-[#2a2a2a] p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <HelpCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-white">{exercise.hints[hintIndex]}</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-600/20 p-4 rounded-lg mb-4 border-l-4 border-green-500"
              >
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Excellent!</p>
                    <p className="text-gray-300 text-sm mt-1">{exercise.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === "failure" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-600/20 p-4 rounded-lg mb-4 border-l-4 border-red-500"
              >
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Ce n'est pas le meilleur coup.</p>
                    <p className="text-gray-300 text-sm mt-1">Essayez à nouveau ou utilisez un indice.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {status !== "success" && (
                <>
                  <button
                    onClick={showHint}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-2 px-4 rounded flex items-center"
                    disabled={hintIndex >= exercise.hints.length}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Indice
                  </button>

                  <button
                    onClick={resetExercise}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-2 px-4 rounded"
                  >
                    Réinitialiser
                  </button>

                  <button
                    onClick={revealSolution}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-2 px-4 rounded"
                  >
                    Voir la solution
                  </button>
                </>
              )}

              {status === "success" && (
                <button
                  onClick={onBack}
                  className="bg-[#1b74e4] hover:bg-[#1b6fd0] text-white py-2 px-4 rounded flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continuer
                </button>
              )}
            </div>

            {/* Affichage de la solution */}
            {showSolution && (
              <div className="mt-4 p-4 bg-[#2a2a2a] rounded-lg">
                <h3 className="text-cyan-400 font-medium mb-2">Solution:</h3>
                {exercise.id === "knight-movement" ? (
                  <p className="text-white mb-2">
                    e4-c3 ou e4-c5 ou e4-d2 ou e4-d6 ou e4-f2 ou e4-f6 ou e4-g3 ou e4-g5
                  </p>
                ) : (
                  <p className="text-white mb-2">
                    {exercise.solution
                      .map((move) => {
                        const from = move.substring(0, 2)
                        const to = move.substring(2, 4)
                        return `${from}-${to}`
                      })
                      .join(" ou ")}
                  </p>
                )}
                <p className="text-gray-300 text-sm">{exercise.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
