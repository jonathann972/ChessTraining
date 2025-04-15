"use client"

import { useRef, useCallback, useState } from "react"
import { Chess } from "chess.js"

export function usePositionHistory() {
  // Références pour stocker les positions FEN et l'historique des coups
  const positionHistoryRef = useRef<string[]>([new Chess().fen()])
  const gameHistoryRef = useRef<any[]>([])
  // État pour forcer le rendu lorsque l'historique change
  const [historyLength, setHistoryLength] = useState(0)

  // Fonction pour réinitialiser complètement l'historique
  const resetHistory = useCallback((initialFen?: string) => {
    console.log("🔄 Réinitialisation complète de l'historique")
    const initialPosition = initialFen || new Chess().fen()
    positionHistoryRef.current = [initialPosition]
    gameHistoryRef.current = []
    setHistoryLength(0)
  }, [])

  // Fonction pour ajouter une nouvelle position à l'historique
  const addPosition = useCallback((fen: string, move: any) => {
    // Créer une nouvelle copie des tableaux pour éviter les mutations directes
    const newGameHistory = [...gameHistoryRef.current, move]
    const newPositionHistory = [...positionHistoryRef.current, fen]

    // Mettre à jour les références
    gameHistoryRef.current = newGameHistory
    positionHistoryRef.current = newPositionHistory

    // Mettre à jour l'état pour forcer un rendu
    setHistoryLength(newPositionHistory.length)

    console.log(`✅ Position ajoutée: ${newPositionHistory.length} positions, ${newGameHistory.length} coups`)
    console.log("Dernier coup ajouté:", move)
  }, [])

  // Fonction pour supprimer la dernière position de l'historique
  const removeLastPosition = useCallback(() => {
    if (positionHistoryRef.current.length > 1) {
      // Créer de nouvelles copies des tableaux sans le dernier élément
      const newGameHistory = gameHistoryRef.current.slice(0, -1)
      const newPositionHistory = positionHistoryRef.current.slice(0, -1)

      // Mettre à jour les références
      gameHistoryRef.current = newGameHistory
      positionHistoryRef.current = newPositionHistory

      setHistoryLength(newPositionHistory.length)
      console.log(`🗑️ Dernier coup supprimé: ${newPositionHistory.length} positions restantes`)
      return true
    }
    return false
  }, [])

  return {
    positionHistory: positionHistoryRef,
    gameHistory: gameHistoryRef,
    historyLength,
    resetHistory,
    addPosition,
    removeLastPosition,
  }
}
