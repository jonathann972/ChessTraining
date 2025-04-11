import { put, list } from "@vercel/blob"
import { NextResponse } from "next/server"

// Types pour les données du leaderboard
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

interface LeaderboardData {
  lastUpdated: string
  players: PlayerData[]
}

// Fonction pour tenter de lire le leaderboard depuis Blob
async function getLeaderboardFromBlob() {
  try {
    // Récupérer la liste des blobs avec le préfixe 'leaderboard'
    const { blobs } = await list({ prefix: "leaderboard/" })

    // Trouver le blob le plus récent
    const leaderboardBlob =
      blobs.length > 0
        ? blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
        : null

    if (leaderboardBlob) {
      // Récupérer les données du blob
      const response = await fetch(leaderboardBlob.url)
      if (!response.ok) throw new Error("Erreur lors de la récupération du leaderboard")

      const data = await response.json()
      return data as LeaderboardData
    }
  } catch (error) {
    console.error("Erreur lors de la lecture du leaderboard:", error)
  }

  // En cas d'erreur ou si aucun blob n'existe, retourner un leaderboard vide
  return {
    lastUpdated: new Date().toISOString(),
    players: [],
  } as LeaderboardData
}

// Ajouter des logs pour mieux comprendre le fonctionnement
export async function GET() {
  try {
    console.log("GET /api/leaderboard: Récupération du leaderboard depuis Blob")
    const leaderboard = await getLeaderboardFromBlob()
    console.log(`GET /api/leaderboard: ${leaderboard.players.length} joueurs récupérés`)
    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("GET /api/leaderboard: Erreur:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération du leaderboard" }, { status: 500 })
  }
}

// Améliorer la fonction POST pour plus de robustesse
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { player } = data

    if (!player || !player.id) {
      console.error("POST /api/leaderboard: Données de joueur invalides", player)
      return NextResponse.json({ error: "Données de joueur invalides" }, { status: 400 })
    }

    console.log(`POST /api/leaderboard: Mise à jour pour le joueur ${player.username} (ID: ${player.id})`)

    // Récupérer le leaderboard actuel
    const leaderboard = await getLeaderboardFromBlob()

    // Vérifier si le joueur existe déjà
    const existingPlayerIndex = leaderboard.players.findIndex((p) => p.id === player.id)

    if (existingPlayerIndex >= 0) {
      console.log(`POST /api/leaderboard: Mise à jour du joueur existant ${player.username}`)
      // Mettre à jour le joueur existant
      leaderboard.players[existingPlayerIndex] = {
        ...leaderboard.players[existingPlayerIndex],
        ...player,
        lastPlayed: new Date().toISOString(),
      }
    } else {
      console.log(`POST /api/leaderboard: Ajout d'un nouveau joueur ${player.username}`)
      // Ajouter le nouveau joueur
      leaderboard.players.push({
        ...player,
        lastPlayed: new Date().toISOString(),
      })
    }

    // Mettre à jour la date de mise à jour
    leaderboard.lastUpdated = new Date().toISOString()

    // Enregistrer le leaderboard mis à jour dans Blob
    const uniqueId = new Date().getTime()
    const filename = `leaderboard/data-${uniqueId}.json`

    console.log(`POST /api/leaderboard: Sauvegarde dans Blob sous ${filename}`)
    const blob = await put(filename, JSON.stringify(leaderboard, null, 2), {
      contentType: "application/json",
      access: "public",
    })

    console.log(`POST /api/leaderboard: Sauvegarde réussie, URL: ${blob.url}`)
    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("POST /api/leaderboard: Erreur:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour du leaderboard" }, { status: 500 })
  }
}
