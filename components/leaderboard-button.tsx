"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { LeaderboardModal } from "./leaderboard-modal"

interface LeaderboardButtonProps {
  playerId: string
}

export function LeaderboardButton({ playerId }: LeaderboardButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center p-2 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-yellow-400 transition-colors"
        title="Classement des joueurs"
      >
        <Users className="h-5 w-5" />
      </button>

      <LeaderboardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentPlayerId={playerId} />
    </>
  )
}
