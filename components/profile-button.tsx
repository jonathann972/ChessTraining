"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { ProfileModal } from "./profile-modal"

interface ProfileButtonProps {
  playerElo: number
  gameHistory: any[]
  onImportData: (data: any) => void
}

export function ProfileButton({ playerElo, gameHistory, onImportData }: ProfileButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center p-2 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-cyan-400 transition-colors"
        title="Profil du joueur"
      >
        <User className="h-5 w-5" />
      </button>

      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        playerElo={playerElo}
        gameHistory={gameHistory}
        onImportData={onImportData}
      />
    </>
  )
}
