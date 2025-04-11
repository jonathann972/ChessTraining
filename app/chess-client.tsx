"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Import dynamique du composant ChessBoard avec ssr: false
const ChessBoard = dynamic(() => import("@/components/chess-board"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center">
        <div className="animate-pulse text-cyan-400">Chargement de l'échiquier...</div>
      </div>
    </div>
  ),
})

export default function ChessClient() {
  // État pour suivre si le composant est monté côté client
  const [isMounted, setIsMounted] = useState(false)

  // Effet pour mettre à jour l'état une fois monté côté client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Ne rien rendre jusqu'à ce que le composant soit monté côté client
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-pulse text-cyan-400">Chargement de l'échiquier...</div>
        </div>
      </div>
    )
  }

  return <ChessBoard />
}
