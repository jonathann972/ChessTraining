/**
 * Utilitaire pour valider et corriger les positions FEN
 */

/**
 * Vérifie si une chaîne FEN est valide
 * @param fen La chaîne FEN à valider
 * @returns Un objet contenant un booléen indiquant si la FEN est valide et un message d'erreur éventuel
 */
export function validateFEN(fen: string): { valid: boolean; error?: string } {
  try {
    // Vérifier si la FEN est une chaîne non vide
    if (!fen || typeof fen !== "string") {
      return { valid: false, error: "La FEN doit être une chaîne non vide" }
    }

    // Diviser la FEN en ses composants
    const parts = fen.split(" ")
    if (parts.length !== 6) {
      return { valid: false, error: "La FEN doit contenir 6 parties séparées par des espaces" }
    }

    // Vérifier la position des pièces (première partie)
    const position = parts[0]
    const ranks = position.split("/")
    if (ranks.length !== 8) {
      return { valid: false, error: "La position doit contenir 8 rangées séparées par des /" }
    }

    // Vérifier chaque rangée
    for (const rank of ranks) {
      let fileSum = 0
      for (let i = 0; i < rank.length; i++) {
        const char = rank[i]
        if (/[1-8]/.test(char)) {
          fileSum += Number.parseInt(char, 10)
        } else if (/[prnbqkPRNBQK]/.test(char)) {
          fileSum += 1
        } else {
          return { valid: false, error: `Caractère invalide dans la position: ${char}` }
        }
      }
      if (fileSum !== 8) {
        return { valid: false, error: `La rangée doit contenir 8 cases: ${rank}` }
      }
    }

    // Vérifier la présence des rois
    const whiteKingPresent = position.includes("K")
    const blackKingPresent = position.includes("k")
    if (!whiteKingPresent) {
      return { valid: false, error: "Le roi blanc est manquant" }
    }
    if (!blackKingPresent) {
      return { valid: false, error: "Le roi noir est manquant" }
    }

    // Vérifier le tour (deuxième partie)
    const turn = parts[1]
    if (turn !== "w" && turn !== "b") {
      return { valid: false, error: "Le tour doit être 'w' ou 'b'" }
    }

    // Vérifier les droits de roque (troisième partie)
    const castling = parts[2]
    if (!/^(-|[KQkq]+)$/.test(castling)) {
      return { valid: false, error: "Les droits de roque doivent être '-' ou une combinaison de 'K', 'Q', 'k', 'q'" }
    }

    // Vérifier la case en passant (quatrième partie)
    const enPassant = parts[3]
    if (enPassant !== "-" && !/^[a-h][36]$/.test(enPassant)) {
      return { valid: false, error: "La case en passant doit être '-' ou une case valide (ex: 'e3')" }
    }

    // Vérifier le compteur de demi-coups (cinquième partie)
    const halfmoveClock = parts[4]
    if (!/^\d+$/.test(halfmoveClock)) {
      return { valid: false, error: "Le compteur de demi-coups doit être un nombre entier" }
    }

    // Vérifier le compteur de coups (sixième partie)
    const fullmoveNumber = parts[5]
    if (!/^\d+$/.test(fullmoveNumber)) {
      return { valid: false, error: "Le compteur de coups doit être un nombre entier" }
    }

    // Si toutes les vérifications sont passées, la FEN est valide
    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Erreur lors de la validation: ${error}` }
  }
}

/**
 * Vérifie et corrige une chaîne FEN si possible
 * @param fen La chaîne FEN à vérifier et corriger
 * @returns La FEN corrigée ou la FEN par défaut si la correction n'est pas possible
 */
export function ensureValidFEN(fen: string): string {
  const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

  const validation = validateFEN(fen)
  if (validation.valid) {
    return fen
  }

  console.warn(`FEN invalide: ${validation.error}. Utilisation de la position par défaut.`)
  return DEFAULT_FEN
}

/**
 * Fonction utilitaire pour vérifier tous les FEN dans les modules d'apprentissage
 * @param modules Les modules d'apprentissage à vérifier
 * @returns Un rapport de validation avec les FEN invalides
 */
export function validateAllModulesFEN(modules: any[]): {
  valid: boolean
  invalidCount: number
  invalidFENs: { moduleId: string; lessonId: string; exerciseId: string; fen: string; error: string }[]
} {
  let invalidCount = 0
  const invalidFENs: { moduleId: string; lessonId: string; exerciseId: string; fen: string; error: string }[] = []

  modules.forEach((module) => {
    module.lessons.forEach((lesson: any) => {
      if (lesson.exercises && Array.isArray(lesson.exercises)) {
        lesson.exercises.forEach((exercise: any) => {
          const validation = validateFEN(exercise.fen)
          if (!validation.valid) {
            invalidCount++
            invalidFENs.push({
              moduleId: module.id,
              lessonId: lesson.id,
              exerciseId: exercise.id,
              fen: exercise.fen,
              error: validation.error || "Erreur inconnue",
            })
          }
        })
      }
    })
  })

  return {
    valid: invalidCount === 0,
    invalidCount,
    invalidFENs,
  }
}

/**
 * Corrige un FEN invalide en ajoutant les rois manquants
 * @param fen Le FEN à corriger
 * @returns Le FEN corrigé
 */
export function fixMissingKings(fen: string): string {
  try {
    const parts = fen.split(" ")
    if (parts.length !== 6) {
      return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" // FEN par défaut
    }

    const position = parts[0]
    const whiteKingPresent = position.includes("K")
    const blackKingPresent = position.includes("k")

    // Si les deux rois sont présents, pas besoin de correction
    if (whiteKingPresent && blackKingPresent) {
      return fen
    }

    // Convertir la position en tableau 2D pour faciliter la manipulation
    const board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))
    const ranks = position.split("/")

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      const rank = ranks[rankIndex]
      let fileIndex = 0

      for (let i = 0; i < rank.length; i++) {
        const char = rank[i]
        if (/[1-8]/.test(char)) {
          const emptyCount = Number.parseInt(char, 10)
          fileIndex += emptyCount
        } else if (/[prnbqkPRNBQK]/.test(char)) {
          board[rankIndex][fileIndex] = char
          fileIndex++
        }
      }
    }

    // Ajouter les rois manquants dans des cases vides
    if (!whiteKingPresent) {
      // Chercher une case vide pour le roi blanc
      let placed = false
      for (let rankIndex = 7; rankIndex >= 0 && !placed; rankIndex--) {
        for (let fileIndex = 0; fileIndex < 8 && !placed; fileIndex++) {
          if (board[rankIndex][fileIndex] === null) {
            board[rankIndex][fileIndex] = "K"
            placed = true
          }
        }
      }
    }

    if (!blackKingPresent) {
      // Chercher une case vide pour le roi noir
      let placed = false
      for (let rankIndex = 0; rankIndex < 8 && !placed; rankIndex++) {
        for (let fileIndex = 0; fileIndex < 8 && !placed; fileIndex++) {
          if (board[rankIndex][fileIndex] === null) {
            board[rankIndex][fileIndex] = "k"
            placed = true
          }
        }
      }
    }

    // Reconvertir le tableau 2D en chaîne FEN
    const newRanks = []
    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      let rankString = ""
      let emptyCount = 0

      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        if (board[rankIndex][fileIndex] === null) {
          emptyCount++
        } else {
          if (emptyCount > 0) {
            rankString += emptyCount.toString()
            emptyCount = 0
          }
          rankString += board[rankIndex][fileIndex]
        }
      }

      if (emptyCount > 0) {
        rankString += emptyCount.toString()
      }

      newRanks.push(rankString)
    }

    parts[0] = newRanks.join("/")
    return parts.join(" ")
  } catch (error) {
    console.error("Erreur lors de la correction des rois manquants:", error)
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" // FEN par défaut
  }
}
