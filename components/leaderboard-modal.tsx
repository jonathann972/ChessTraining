"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Award, Trophy, Medal, User, UserCheck, Users, RefreshCw, ShieldAlert } from "lucide-react"

interface PlayerData {
  id: string
  username: string
  elo: number
  wins: number
  losses: number
  draws: number
  gamesPlayed: number
  lastPlayed: string
}

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlayerId: string
}

export function LeaderboardModal({ isOpen, onClose, currentPlayerId }: LeaderboardModalProps) {
  const [leaderboardData, setLeaderboardData] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"elo" | "wins" | "gamesPlayed">("elo")

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboardData()
    }
  }, [isOpen])

  async function fetchLeaderboardData() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/leaderboard")
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du classement")
      }

      const data = await response.json()
      setLeaderboardData(data.players || [])
    } catch (err) {
      console.error("Erreur:", err)
      setError("Impossible de charger le classement")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour trier les joueurs selon différents critères
  const sortedPlayers = [...leaderboardData].sort((a, b) => {
    if (sortBy === "elo") return b.elo - a.elo
    if (sortBy === "wins") return b.wins - a.wins
    return b.gamesPlayed - a.gamesPlayed
  })

  // Pour rendre les rangs (1er, 2e, 3e)
  const getRankDisplay = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />
    return <span className="text-gray-400 text-sm">{index + 1}</span>
  }

  // Pour calculer le taux de victoire
  const calculateWinRate = (player: PlayerData) => {
    if (player.gamesPlayed === 0) return "0%"
    return `${Math.round((player.wins / player.gamesPlayed) * 100)}%`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-3xl rounded-lg shadow-xl overflow-hidden bg-[#1e1e1e]"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Classement des joueurs
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboardData}
              className="p-2 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300"
              title="Actualiser"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Boutons de tri */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSortBy("elo")}
              className={`px-3 py-1 text-sm rounded-full ${
                sortBy === "elo" ? "bg-[#1b74e4] text-white" : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300"
              }`}
            >
              <Trophy className="h-3 w-3 inline mr-1" />
              ELO
            </button>
            <button
              onClick={() => setSortBy("wins")}
              className={`px-3 py-1 text-sm rounded-full ${
                sortBy === "wins" ? "bg-[#1b74e4] text-white" : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300"
              }`}
            >
              <Award className="h-3 w-3 inline mr-1" />
              Victoires
            </button>
            <button
              onClick={() => setSortBy("gamesPlayed")}
              className={`px-3 py-1 text-sm rounded-full ${
                sortBy === "gamesPlayed" ? "bg-[#1b74e4] text-white" : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300"
              }`}
            >
              <UserCheck className="h-3 w-3 inline mr-1" />
              Expérience
            </button>
          </div>

          {/* Tableau de classement */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900/30 text-red-300 rounded-lg flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="p-6 bg-[#2a2a2a] rounded-lg text-center text-gray-400">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-500" />
              <p>Aucun joueur dans le classement pour le moment.</p>
              <p className="text-sm mt-2">Jouez des parties classées pour apparaître ici !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#333] text-gray-400 text-sm">
                    <th className="px-4 py-2 text-left">Rang</th>
                    <th className="px-4 py-2 text-left">Joueur</th>
                    <th className="px-4 py-2 text-right">ELO</th>
                    <th className="px-4 py-2 text-right">V</th>
                    <th className="px-4 py-2 text-right">N</th>
                    <th className="px-4 py-2 text-right">D</th>
                    <th className="px-4 py-2 text-right">Taux</th>
                    <th className="px-4 py-2 text-right">Parties</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => (
                    <motion.tr
                      key={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-[#333333] hover:bg-[#2a2a2a] ${
                        player.id === currentPlayerId ? "bg-[#1b74e4]/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center justify-center w-8 h-8">{getRankDisplay(index)}</div>
                      </td>
                      <td className="px-4 py-3 text-left font-medium text-white flex items-center">
                        {player.id === currentPlayerId && (
                          <span className="h-2 w-2 bg-cyan-400 rounded-full mr-2"></span>
                        )}
                        {player.username || "Joueur anonyme"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-yellow-400">{player.elo}</td>
                      <td className="px-4 py-3 text-right text-green-400">{player.wins}</td>
                      <td className="px-4 py-3 text-right text-blue-400">{player.draws}</td>
                      <td className="px-4 py-3 text-right text-red-400">{player.losses}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{calculateWinRate(player)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{player.gamesPlayed}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
