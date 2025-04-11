"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Download, Upload, Share2, User, Trophy } from "lucide-react"
// Remplacer l'importation incorrecte
// import QRCodeReact from "qrcode.react"

// Par l'importation correcte avec l'export nommé
import { QRCodeSVG } from "qrcode.react"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  playerElo: number
  gameHistory: any[]
  onImportData: (data: any) => void
}

export function ProfileModal({ isOpen, onClose, playerElo, gameHistory, onImportData }: ProfileModalProps) {
  const [showQR, setShowQR] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === "undefined") return "Joueur"
    return localStorage.getItem("playerName") || "Joueur"
  })

  // Sauvegarder le nom du joueur quand il change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playerName", playerName)
    }
  }, [playerName])

  // Fonction pour exporter les données dans un fichier JSON
  const exportToFile = () => {
    try {
      const data = {
        playerName,
        playerElo,
        gameHistory,
        version: "1.0",
        exportDate: new Date().toISOString(),
      }

      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // Créer un lien pour télécharger le fichier
      const a = document.createElement("a")
      a.href = url
      a.download = `samou-chess-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()

      // Nettoyer
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error)
      alert("Erreur lors de l'exportation des données")
    }
  }

  // Fonction pour importer des données depuis un fichier JSON
  const importFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string)

          // Mettre à jour le nom du joueur si présent
          if (json.playerName) {
            setPlayerName(json.playerName)
          }

          onImportData(json)
          alert("Données importées avec succès!")
        } catch (error) {
          console.error("Erreur lors du parsing JSON:", error)
          alert("Fichier de sauvegarde invalide")
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error("Erreur lors de l'importation:", error)
      alert("Erreur lors de l'importation des données")
    }
  }

  // Fonction pour générer un lien de partage
  const generateShareLink = () => {
    try {
      const data = {
        playerName,
        playerElo,
        gameHistory,
        version: "1.0",
      }

      const jsonString = JSON.stringify(data)
      const encoded = btoa(encodeURIComponent(jsonString))

      // Créer l'URL avec les données en paramètre
      const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`
      setShareUrl(url)

      // Générer le QR Code
      setShowQR(true)

      // Copier dans le presse-papier
      navigator.clipboard
        .writeText(url)
        .then(() => alert("Lien copié dans le presse-papier!"))
        .catch((err) => console.error("Erreur lors de la copie:", err))
    } catch (error) {
      console.error("Erreur lors de la génération du lien:", error)
      alert("Erreur lors de la génération du lien de partage")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md rounded-lg shadow-xl overflow-hidden bg-[#1e1e1e]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
            <User className="mr-2 h-6 w-6" />
            Profil du joueur
          </h2>

          <div className="mb-6">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
              Nom du joueur
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between mb-6 p-3 bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-white">Classement ELO</span>
            </div>
            <span className="text-xl font-bold text-white">{playerElo}</span>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-medium text-cyan-400 mb-2">Gestion des données</h3>

            <button
              onClick={exportToFile}
              className="w-full flex items-center gap-2 py-2 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white"
            >
              <Download size={16} />
              Exporter vos données
            </button>

            <div className="relative w-full">
              <label className="w-full flex items-center gap-2 py-2 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white cursor-pointer">
                <Upload size={16} />
                Importer des données
                <input
                  type="file"
                  accept=".json"
                  onChange={importFromFile}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>

            <button
              onClick={generateShareLink}
              className="w-full flex items-center gap-2 py-2 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white"
            >
              <Share2 size={16} />
              Générer un lien de partage
            </button>
          </div>

          {showQR && shareUrl && (
            <div className="mt-4 p-4 bg-white rounded-lg flex flex-col items-center">
              <QRCodeSVG value={shareUrl} size={150} />
              <p className="text-xs text-black mt-2 text-center break-all">{shareUrl}</p>
              <button
                onClick={() => setShowQR(false)}
                className="mt-2 py-1 px-3 bg-[#1b74e4] text-white rounded-md text-xs"
              >
                Fermer
              </button>
            </div>
          )}

          <div className="mt-6 text-xs text-gray-400">
            <p>Parties jouées: {gameHistory.length}</p>
            <p>Victoires: {gameHistory.filter((g) => g.result === "win").length}</p>
            <p>Défaites: {gameHistory.filter((g) => g.result === "loss").length}</p>
            <p>Matchs nuls: {gameHistory.filter((g) => g.result === "draw").length}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
