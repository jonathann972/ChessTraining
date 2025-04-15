"use client"

import { useState, useEffect } from "react"
import { LearningDashboard } from "@/components/learning/learning-dashboard"
import { v4 as uuidv4 } from "uuid"

export default function LearningPage() {
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    // Récupérer l'ID du joueur du localStorage
    if (typeof window !== "undefined") {
      let playerId = localStorage.getItem("playerId")

      // Si aucun ID n'existe, en créer un nouveau
      if (!playerId) {
        playerId = uuidv4()
        localStorage.setItem("playerId", playerId)
      }

      setUserId(playerId)
    }
  }, []) // Dépendance vide pour n'exécuter qu'une seule fois

  // Afficher un indicateur de chargement seulement si userId n'est pas encore défini
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-cyan-400 [text-shadow:_-1.5px_-1.5px_0_#000,_1.5px_-1.5px_0_#000,_-1.5px_1.5px_0_#000,_1.5px_1.5px_0_#000,_0_0_8px_rgba(0,0,0,0.3)] tracking-wide">
          Salle du temps
        </h1>
        <LearningDashboard userId={userId} />
      </div>
    </main>
  )
}
