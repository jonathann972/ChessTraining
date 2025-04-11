"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp, TrendingDown, Award, Target } from "lucide-react"
import { motion } from "framer-motion"
import { ProfileButton } from "./profile-button"
import { v4 as uuidv4 } from "uuid"
import { LeaderboardButton } from "./leaderboard-button"
import { UsernamePrompt } from "./username-prompt"

// Constantes pour le calcul ELO
const INITIAL_ELO = 800 // ELO de départ

// Remplacer la constante K_FACTOR = 32 par cette fonction
// Fonction pour déterminer le facteur K approprié selon le niveau du joueur
function getKFactor(playerElo: number): number {
  if (playerElo < 1000) {
    return 16 // Débutants
  } else if (playerElo < 1800) {
    return 12 // Intermédiaires
  } else {
    return 8 // Avancés
  }
}

// Niveaux de difficulté de Stockfish
export const DIFFICULTY_LEVELS = [
  { name: "Débutant 1", elo: 250, depth: 1, errorRate: 0.7 },
  { name: "Débutant 2", elo: 400, depth: 2, errorRate: 0.6 },
  { name: "Débutant 3", elo: 550, depth: 3, errorRate: 0.5 },
  { name: "Débutant 4", elo: 700, depth: 4, errorRate: 0.4 },
  { name: "Débutant 5", elo: 850, depth: 5, errorRate: 0.35 },
  { name: "Intermédiaire 1", elo: 1000, depth: 6, errorRate: 0.3 },
  { name: "Intermédiaire 2", elo: 1100, depth: 7, errorRate: 0.28 },
  { name: "Intermédiaire 3", elo: 1200, depth: 8, errorRate: 0.25 },
  { name: "Intermédiaire 4", elo: 1300, depth: 9, errorRate: 0.22 },
  { name: "Intermédiaire 5", elo: 1400, depth: 10, errorRate: 0.2 },
  { name: "Intermédiaire 6", elo: 1500, depth: 11, errorRate: 0.18 },
  { name: "Avancé 1", elo: 1600, depth: 12, errorRate: 0.15 },
  { name: "Avancé 2", elo: 1700, depth: 12, errorRate: 0.12 },
  { name: "Avancé 3", elo: 1800, depth: 13, errorRate: 0.1 },
  { name: "Avancé 4", elo: 1900, depth: 13, errorRate: 0.08 },
  { name: "Expert 1", elo: 2000, depth: 14, errorRate: 0.06 },
  { name: "Expert 2", elo: 2100, depth: 14, errorRate: 0.05 },
  { name: "Expert 3", elo: 2200, depth: 15, errorRate: 0.04 },
  { name: "Expert 4", elo: 2300, depth: 15, errorRate: 0.03 },
  { name: "Maître 1", elo: 2400, depth: 16, errorRate: 0.02 },
  { name: "Maître 2", elo: 2500, depth: 16, errorRate: 0.015 },
  { name: "Grand Maître 1", elo: 2600, depth: 17, errorRate: 0.01 },
  { name: "Grand Maître 2", elo: 2700, depth: 17, errorRate: 0.005 },
  { name: "Grand Maître 3", elo: 2900, depth: 18, errorRate: 0.002 },
  { name: "Maximum", elo: 3200, depth: 20, errorRate: 0 },
]

// Fonction pour calculer la probabilité de victoire selon la formule ELO
export function calculateWinProbability(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
}

// Modifier la fonction calculateNewElo pour utiliser le facteur K variable
export function calculateNewElo(currentElo: number, opponentElo: number, result: "win" | "loss" | "draw"): number {
  const expectedScore = calculateWinProbability(currentElo, opponentElo)
  let actualScore = 0.5 // match nul par défaut

  if (result === "win") actualScore = 1
  else if (result === "loss") actualScore = 0

  // Utiliser le facteur K variable au lieu de la constante K_FACTOR
  const kFactor = getKFactor(currentElo)

  // Formule ELO standard avec K variable
  const newElo = Math.round(currentElo + kFactor * (actualScore - expectedScore))

  return newElo
}

// Fonction pour déterminer le niveau de difficulté approprié pour un ELO donné
export function getDifficultyForElo(playerElo: number) {
  // Si l'ELO est inférieur au niveau le plus bas, retourner le niveau le plus bas
  if (playerElo < DIFFICULTY_LEVELS[0].elo) {
    return DIFFICULTY_LEVELS[0]
  }

  // Si l'ELO est supérieur au niveau le plus élevé, retourner le niveau le plus élevé
  if (playerElo > DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1].elo) {
    return DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1]
  }

  // Trouver le niveau qui correspond le mieux à l'ELO du joueur
  for (let i = 0; i < DIFFICULTY_LEVELS.length - 1; i++) {
    if (playerElo >= DIFFICULTY_LEVELS[i].elo && playerElo < DIFFICULTY_LEVELS[i + 1].elo) {
      // Si l'ELO est plus proche du niveau suivant, retourner le niveau suivant
      if (playerElo - DIFFICULTY_LEVELS[i].elo > DIFFICULTY_LEVELS[i + 1].elo - playerElo) {
        return DIFFICULTY_LEVELS[i + 1]
      }
      // Sinon, retourner le niveau actuel
      return DIFFICULTY_LEVELS[i]
    }
  }

  // Par défaut, retourner le niveau correspondant à l'ELO 800
  return DIFFICULTY_LEVELS.find((level) => level.elo === 800) || DIFFICULTY_LEVELS[0]
}

// Fonction pour introduire des erreurs dans les coups de Stockfish
export function introduceError(bestMove: string, errorRate: number, possibleMoves: string[]): string {
  // Si pas d'erreur ou pas d'autres coups disponibles, jouer le meilleur coup
  if (Math.random() > errorRate || possibleMoves.length <= 1) {
    return bestMove
  }

  // Filtrer pour ne pas rejouer le meilleur coup
  const otherMoves = possibleMoves.filter((move) => move !== bestMove)
  if (otherMoves.length === 0) return bestMove

  // Sélectionner un coup aléatoire parmi les autres coups
  const randomIndex = Math.floor(Math.random() * otherMoves.length)
  return otherMoves[randomIndex]
}

// Modifier la déclaration globale pour ajouter updateLeaderboard
declare global {
  interface Window {
    eloSystem?: {
      recordGameResult: (result: "win" | "loss" | "draw", opponentElo: number) => number
    }
    updateLeaderboard?: () => Promise<void>
  }
}

interface EloSystemProps {
  onDifficultyChange: (level: (typeof DIFFICULTY_LEVELS)[0]) => void
}

// Améliorer la fonction recordGameResult pour s'assurer qu'elle est correctement exposée
export default function EloSystem({ onDifficultyChange }: EloSystemProps) {
  const [playerId, setPlayerId] = useState<string>(() => {
    // Vérifier si on est côté client
    if (typeof window === "undefined") return uuidv4()

    // Récupérer l'ID du joueur du localStorage s'il existe
    const savedId = localStorage.getItem("playerId")
    return savedId || uuidv4()
  })

  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)

  const [playerElo, setPlayerElo] = useState<number>(() => {
    // Vérifier si on est côté client
    if (typeof window === "undefined") return INITIAL_ELO

    // Récupérer l'ELO du localStorage s'il existe
    const savedElo = localStorage.getItem("playerElo")
    return savedElo ? Number.parseInt(savedElo, 10) : INITIAL_ELO
  })

  const [gameHistory, setGameHistory] = useState<
    Array<{
      date: Date
      result: "win" | "loss" | "draw"
      eloChange: number
      opponentElo: number
    }>
  >(() => {
    // Vérifier si on est côté client
    if (typeof window === "undefined") return []

    // Récupérer l'historique des parties du localStorage s'il existe
    const savedHistory = localStorage.getItem("gameHistory")
    return savedHistory
      ? JSON.parse(savedHistory).map((game: any) => ({
          ...game,
          date: new Date(game.date),
        }))
      : []
  })

  const [showEloChange, setShowEloChange] = useState(false)
  const [lastEloChange, setLastEloChange] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(() => getDifficultyForElo(INITIAL_ELO))

  // Calculer les statistiques - DÉPLACÉ ICI AVANT updateLeaderboard
  const stats = {
    gamesPlayed: gameHistory ? gameHistory.length : 0,
    wins: gameHistory ? gameHistory.filter((game) => game.result === "win").length : 0,
    losses: gameHistory ? gameHistory.filter((game) => game.result === "loss").length : 0,
    draws: gameHistory ? gameHistory.filter((game) => game.result === "draw").length : 0,
  }

  // Fonction pour importer les données
  const importData = (data: any) => {
    if (!data) return

    if (data.playerElo) {
      setPlayerElo(data.playerElo)
    }

    if (data.gameHistory) {
      setGameHistory(
        data.gameHistory.map((game: any) => ({
          ...game,
          date: new Date(game.date),
        })),
      )
    }
  }

  // Modifier la fonction updateLeaderboard pour être plus robuste
  async function updateLeaderboard() {
    try {
      if (typeof window === "undefined") return

      const username = localStorage.getItem("playerName") || "Joueur anonyme"

      const playerData = {
        id: playerId,
        username,
        elo: playerElo,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        gamesPlayed: stats.gamesPlayed,
      }

      console.log("Mise à jour du leaderboard pour:", username)

      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ player: playerData }),
      })

      if (!response.ok) {
        console.error("Erreur lors de la mise à jour du leaderboard:", await response.text())
      } else {
        console.log("Leaderboard mis à jour avec succès")
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du leaderboard:", error)
    }
  }

  // Ajouter ce useEffect au début
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playerId", playerId)

      // Vérifier si c'est un nouveau joueur sans nom d'utilisateur
      const hasUsername = localStorage.getItem("playerName")
      if (!hasUsername) {
        setShowUsernamePrompt(true)
      }
    }
  }, [playerId])

  // Ajouter ce useEffect au début des autres useEffect pour charger les données depuis l'URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Vérifier s'il y a des données dans l'URL
        const params = new URLSearchParams(window.location.search)
        const dataParam = params.get("data")

        if (dataParam) {
          // Décoder et parser les données
          const jsonString = decodeURIComponent(atob(dataParam))
          const data = JSON.parse(jsonString)

          // Importer les données
          importData(data)

          // Nettoyer l'URL après avoir chargé les données
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données depuis l'URL:", error)
      }
    }
  }, [])

  // Sauvegarder l'ELO et l'historique dans le localStorage quand ils changent
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playerElo", playerElo.toString())
      localStorage.setItem("gameHistory", JSON.stringify(gameHistory))
    }
  }, [playerElo, gameHistory])

  // Mettre à jour le niveau de difficulté quand l'ELO change
  useEffect(() => {
    const newLevel = getDifficultyForElo(playerElo)
    setCurrentLevel(newLevel)
    onDifficultyChange(newLevel)
  }, [playerElo, onDifficultyChange])

  // Fonction pour enregistrer le résultat d'une partie
  // Améliorer la fonction recordGameResult pour s'assurer qu'elle fonctionne correctement
  const recordGameResult = useCallback(
    (result: "win" | "loss" | "draw", opponentElo: number) => {
      console.log("EloSystem.recordGameResult called with:", result, opponentElo)
      const oldElo = playerElo
      const newElo = calculateNewElo(playerElo, opponentElo, result)
      const eloChange = newElo - oldElo

      console.log("ELO calculation:", oldElo, "->", newElo, "(change:", eloChange, ")")

      // Mettre à jour l'ELO du joueur
      setPlayerElo(newElo)

      // Ajouter la partie à l'historique
      const newGame = {
        date: new Date(),
        result,
        eloChange,
        opponentElo,
      }

      setGameHistory((prev) => [newGame, ...prev])

      // Sauvegarder immédiatement dans le localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("playerElo", newElo.toString())
        localStorage.setItem("gameHistory", JSON.stringify([newGame, ...gameHistory]))

        // Mettre à jour le leaderboard
        updateLeaderboard()
      }

      // Afficher l'animation de changement d'ELO
      setLastEloChange(eloChange)
      setShowEloChange(true)
      setTimeout(() => setShowEloChange(false), 3000)

      return newElo
    },
    [playerElo, gameHistory],
  )

  // Exposer la fonction recordGameResult globalement
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Exposer la fonction recordGameResult globalement
      window.eloSystem = {
        recordGameResult,
      }

      console.log("EloSystem: recordGameResult function exposed globally")
    }

    return () => {
      // Nettoyer lors du démontage
      if (typeof window !== "undefined") {
        delete window.eloSystem
      }
    }
  }, [recordGameResult])

  // Ajouter ce useEffect pour exposer updateLeaderboard globalement
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Exposer la fonction updateLeaderboard globalement
      window.updateLeaderboard = updateLeaderboard

      console.log("EloSystem: updateLeaderboard function exposed globally")
    }

    return () => {
      // Nettoyer lors du démontage
      if (typeof window !== "undefined") {
        delete window.updateLeaderboard
      }
    }
  }, [playerId, playerElo])

  // Calculer le taux de victoire
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0

  // Calculer la progression vers le prochain niveau
  const currentLevelIndex = DIFFICULTY_LEVELS.findIndex((level) => level.name === currentLevel.name)
  const nextLevel = currentLevelIndex < DIFFICULTY_LEVELS.length - 1 ? DIFFICULTY_LEVELS[currentLevelIndex + 1] : null

  const progressToNextLevel = nextLevel
    ? Math.min(100, Math.max(0, ((playerElo - currentLevel.elo) / (nextLevel.elo - currentLevel.elo)) * 100))
    : 100

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-cyan-400">Votre Classement</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-xl font-bold text-white">{playerElo}</span>

            {showEloChange && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`ml-2 text-sm font-medium ${lastEloChange > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {lastEloChange > 0 ? "+" : ""}
                {lastEloChange}
              </motion.div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-2">
            <ProfileButton playerElo={playerElo} gameHistory={gameHistory} onImportData={importData} />
            <LeaderboardButton playerId={playerId} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col mb-1">
          <span className="text-sm text-cyan-400">Niveau: {currentLevel.name}</span>
          {nextLevel && (
            <span className="text-xs text-gray-400">
              Prochain: {nextLevel.name} ({nextLevel.elo})
            </span>
          )}
        </div>
        <Progress value={progressToNextLevel} className="h-2 bg-[#2a2a2a]" indicatorClassName="bg-[#1b74e4]" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#2a2a2a] p-2 rounded text-center">
          <div className="text-sm text-gray-400">Parties</div>
          <div className="text-lg font-medium text-white">{stats.gamesPlayed}</div>
        </div>
        <div className="bg-[#2a2a2a] p-2 rounded text-center">
          <div className="text-sm text-gray-400">Victoires</div>
          <div className="text-lg font-medium text-green-400">{stats.wins}</div>
        </div>
        <div className="bg-[#2a2a2a] p-2 rounded text-center">
          <div className="text-sm text-gray-400">Défaites</div>
          <div className="text-lg font-medium text-red-400">{stats.losses}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Target className="h-4 w-4 text-cyan-400 mr-1" />
          <span className="text-sm text-white">Taux de victoire</span>
        </div>
        <Badge variant="outline" className="bg-[#2a2a2a] text-white border-0">
          {winRate}%
        </Badge>
      </div>

      {gameHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-cyan-400 mb-2">Dernières parties</h3>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
            {gameHistory.slice(0, 5).map((game, index) => (
              <div key={index} className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded text-xs">
                <div className="flex items-center overflow-hidden">
                  {game.result === "win" ? (
                    <TrendingUp className="h-3 w-3 flex-shrink-0 text-green-400 mr-1" />
                  ) : game.result === "loss" ? (
                    <TrendingDown className="h-3 w-3 flex-shrink-0 text-red-400 mr-1" />
                  ) : (
                    <Award className="h-3 w-3 flex-shrink-0 text-yellow-400 mr-1" />
                  )}
                  <span className="text-gray-300 truncate">
                    {game.date.toLocaleDateString()} -{" "}
                    {game.result === "win" ? "Victoire" : game.result === "loss" ? "Défaite" : "Nulle"}
                  </span>
                </div>
                <span
                  className={`font-medium flex-shrink-0 ml-1 ${game.eloChange > 0 ? "text-green-400" : game.eloChange < 0 ? "text-red-400" : "text-gray-400"}`}
                >
                  {game.eloChange > 0 ? "+" : ""}
                  {game.eloChange}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ajouter cette section à la fin */}
      <UsernamePrompt
        isOpen={showUsernamePrompt}
        onClose={(username) => {
          setShowUsernamePrompt(false)
          if (username) {
            localStorage.setItem("playerName", username)
            // Mettre à jour le leaderboard après la mise à jour du nom
            updateLeaderboard()
          }
        }}
        defaultUsername={localStorage.getItem("playerName") || ""}
      />
    </div>
  )
}
