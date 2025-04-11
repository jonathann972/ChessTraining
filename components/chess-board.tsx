"use client"

import { useState, useEffect, useCallback } from "react"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RotateCw, ArrowLeft, Zap, Edit3, ChevronRight, Search } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { usePositionHistory } from "@/hooks/use-position-history"
import EloSystem, { DIFFICULTY_LEVELS, introduceError } from "./elo-system"
import { GameResultModal } from "./game-result-modal"
// Ajouter l'import pour UsernamePrompt
import { UsernamePrompt } from "./username-prompt"

// Pièces disponibles pour le mode d'édition
const PIECES = {
  white: ["wP", "wN", "wB", "wR", "wQ", "wK"],
  black: ["bP", "bN", "bB", "bR", "bQ", "bK"],
}

// Noms des pièces pour l'accessibilité et l'affichage
const PIECE_NAMES = {
  wP: "Pion blanc",
  wN: "Cavalier blanc",
  wB: "Fou blanc",
  wR: "Tour blanche",
  wQ: "Dame blanche",
  wK: "Roi blanc",
  bP: "Pion noir",
  bN: "Cavalier noir",
  bB: "Fou noir",
  bR: "Tour noire",
  bQ: "Dame noire",
  bK: "Roi noir",
}

// Noms courts des pièces pour l'affichage dans les boutons
const SHORT_PIECE_NAMES = {
  wP: "Pion",
  wN: "Cavalier",
  wB: "Fou",
  wR: "Tour",
  wQ: "Dame",
  wK: "Roi",
  bP: "Pion",
  bN: "Cavalier",
  bB: "Fou",
  bR: "Tour",
  bQ: "Dame",
  bK: "Roi",
}

// Créer une position FEN pour une seule pièce
const createSinglePieceFen = (piece) => {
  // Placer la pièce au centre exact de l'échiquier (d4)
  let fen = "8/8/8/3"

  if (piece[0] === "w") {
    fen += piece[1].toUpperCase()
  } else {
    fen += piece[1].toLowerCase()
  }

  fen += "4/8/8/8 w - - 0 1"
  return fen
}

// Composant modal d'aide
const HelpModal = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed inset-0 z-50 overflow-auto bg-black/50 ${isOpen ? "block" : "hidden"}`}>
      <div className="relative p-8 bg-[#1e1e1e] w-full max-w-md mx-auto mt-20 rounded-lg shadow-lg">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-300">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Aide</h2>

        <div className="space-y-4 text-white">
          <div>
            <h3 className="font-semibold text-lg text-cyan-400">Mode Jeu</h3>
            <p>
              Mode d'analyse où l'ordinateur joue à sa puissance maximale. Idéal pour étudier les positions et apprendre
              des meilleurs coups. Vous pouvez jouer des deux côtés ou choisir un camp.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-cyan-400">Mode Classement</h3>
            <p>
              Jouez des parties classées pour gagner ou perdre des points ELO. Sélectionnez votre couleur et affrontez
              l'ordinateur.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-cyan-400">Mode Édition</h3>
            <p>
              Créez vos propres positions d'échecs. Sélectionnez une pièce et placez-la sur l'échiquier. Utilisez les
              contrôles pour effacer, appliquer ou réinitialiser la position.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-cyan-400">Contrôles</h3>
            <ul className="list-disc list-inside">
              <li>
                <strong>Choisir un côté:</strong> Sélectionnez si vous voulez jouer en tant que blanc, noir ou les deux
                côtés.
              </li>
              <li>
                <strong>Auto-Play:</strong> Activez cette option pour que l'ordinateur joue automatiquement.
              </li>
              <li>
                <strong>Mode analyse:</strong> Activez cette option pour analyser la position actuelle avec Stockfish.
              </li>
              <li>
                <strong>Montrer flèche:</strong> Affiche une flèche indiquant le meilleur coup suggéré par Stockfish.
              </li>
              <li>
                <strong>Nouvelle partie:</strong> Démarre une nouvelle partie d'échecs.
              </li>
              <li>
                <strong>Annuler:</strong> Annule le dernier coup joué.
              </li>
              <li>
                <strong>Éditer:</strong> Passe en mode édition pour créer des positions personnalisées.
              </li>
              <li>
                <strong>Analyse auto:</strong> Analyse automatiquement chaque coup joué.
              </li>
              <li>
                <strong>Analyser:</strong> Analyse la position actuelle avec Stockfish.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess())
  const [displayFen, setDisplayFen] = useState(game.fen())
  const [playerSide, setPlayerSide] = useState("both")
  const [stockfishThinking, setStockfishThinking] = useState(false)
  const [bestMove, setBestMove] = useState("")
  const [evaluation, setEvaluation] = useState("")
  const [moveHistory, setMoveHistory] = useState([])
  const [apiError, setApiError] = useState("")
  const [continuation, setContinuation] = useState("")
  const [showBestMoveArrow, setShowBestMoveArrow] = useState(true)
  const [autoAnalyze, setAutoAnalyze] = useState(false)
  const [analyzeMode, setAnalyzeMode] = useState(false)
  const [previousGameState, setPreviousGameState] = useState(null)
  const [historyIndex, setHistoryIndex] = useState(-1) // -1 signifie position actuelle
  const [reviewMode, setReviewMode] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false) // Nouvel état pour l'auto-play
  const [isComputerTurn, setIsComputerTurn] = useState(false) // Pour suivre si c'est le tour de l'ordinateur
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [currentDifficulty, setCurrentDifficulty] = useState(DIFFICULTY_LEVELS[0])
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [gameInProgress, setGameInProgress] = useState(false)
  const [gameResult, setGameResult] = useState<"win" | "loss" | "draw" | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [oldElo, setOldElo] = useState(800)
  const [newElo, setNewElo] = useState(800)
  // Ajouter ces nouveaux états dans la liste des états du composant ChessBoard
  const [isCheck, setIsCheck] = useState(false)
  const [isCheckmate, setIsCheckmate] = useState(false)
  const [ratingMode, setRatingMode] = useState(false)
  const [ratingColorSelection, setRatingColorSelection] = useState<"white" | "black" | "random" | null>(null)
  const [ratingGameStarted, setRatingGameStarted] = useState(false)
  const [checkedKingSquare, setCheckedKingSquare] = useState<string | null>(null)
  // Ajouter ces états dans la liste des états du composant ChessBoard
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)
  const [pendingColorChoice, setPendingColorChoice] = useState<"white" | "black" | "random" | null>(null)

  // États pour le mode d'édition
  const [editMode, setEditMode] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [customPosition, setCustomPosition] = useState({})
  const [activeTab, setActiveTab] = useState("play")
  const [currentTurn, setCurrentTurn] = useState("w") // w pour blanc, b pour noir
  const [clearMode, setClearMode] = useState(false)

  // Couleurs du plateau
  const [boardColors, setBoardColors] = useState({
    dark: "#3d8b72", // Vert teal foncé
    light: "#e2e8d5", // Beige clair
  })

  // Utiliser le hook pour gérer l'historique des positions
  const {
    positionHistory: positionHistoryRef,
    gameHistory: gameHistoryRef,
    historyLength,
    resetHistory,
    addPosition,
    removeLastPosition,
  } = usePositionHistory()

  // Initialiser la position personnalisée à partir du jeu actuel
  useEffect(() => {
    if (!editMode) return

    // Convertir la position actuelle en format pour l'éditeur
    const pieces = {}
    const board = game.board()

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          const square = String.fromCharCode(97 + col) + (8 - row)
          pieces[square] = piece.color === "w" ? `w${piece.type.toUpperCase()}` : `b${piece.type.toUpperCase()}`
        }
      }
    }

    setCustomPosition(pieces)
  }, [editMode, game])

  // Fonction pour analyser la position actuelle
  const analyzePosition = useCallback(async () => {
    // Si ce n'est pas le tour de l'ordinateur, ne rien faire
    const currentTurn = game.turn() === "w" ? "white" : "black"
    const isComputerTurnNow =
      (playerSide === "white" && currentTurn === "black") || (playerSide === "black" && currentTurn === "white")

    if (!isComputerTurnNow && !analyzeMode) {
      return
    }

    setStockfishThinking(true)
    setApiError("")
    setBestMove("")

    try {
      // Utiliser une API alternative si l'API principale échoue
      const useBackupApi = localStorage.getItem("useBackupApi") === "true"
      let apiUrl

      // Toujours utiliser l'API v2, mais avec des paramètres différents selon le mode
      apiUrl = new URL("https://stockfish.online/api/s/v2.php")
      apiUrl.searchParams.append("fen", game.fen())

      // En mode jeu (non classé), utiliser la profondeur maximale
      // En mode classement, utiliser la difficulté adaptée à l'ELO
      const useMaxDepth = !ratingMode
      const depthToUse = useMaxDepth ? 20 : currentDifficulty.depth

      // Si on utilise l'API de secours, limiter la profondeur pour éviter les timeouts
      const finalDepth = useBackupApi ? Math.min(15, depthToUse) : depthToUse
      apiUrl.searchParams.append("depth", finalDepth.toString())

      console.log("Requesting analysis for FEN:", game.fen())
      console.log(
        useBackupApi
          ? `Using backup mode with limited depth ${finalDepth}`
          : !ratingMode
            ? "Using maximum depth (20) for analysis mode"
            : `Using difficulty: ${currentDifficulty.name} with depth: ${currentDifficulty.depth}`,
      )

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // Timeout après 15 secondes

      const response = await fetch(apiUrl.toString(), {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`)
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      if (data.success) {
        // Traitement pour l'API v2
        if (data.bestmove) {
          const movePart = data.bestmove.split(" ")[1]
          console.log("Extracted best move:", movePart)
          setBestMove(movePart)

          // Récupérer tous les coups légaux pour pouvoir introduire des erreurs
          try {
            const gameCopy = new Chess(game.fen())
            const legalMoves = gameCopy.moves({ verbose: true })
            const legalMovesUci = legalMoves.map((move) => `${move.from}${move.to}${move.promotion || ""}`)
            setPossibleMoves(legalMovesUci)

            // Jouer automatiquement seulement si c'est vraiment le tour de l'ordinateur
            if (isComputerTurnNow && autoPlay && !reviewMode) {
              // En mode jeu, toujours jouer le meilleur coup
              // En mode classement, introduire potentiellement des erreurs
              const moveToPlay = ratingMode
                ? introduceError(movePart, currentDifficulty.errorRate, legalMovesUci)
                : movePart
              console.log(
                ratingMode
                  ? `Original best move: ${movePart}, Move to play with errors: ${moveToPlay}`
                  : `Playing best move: ${moveToPlay}`,
              )

              const from = moveToPlay.substring(0, 2)
              const to = moveToPlay.substring(2, 4)
              const promotion = moveToPlay.length === 5 ? moveToPlay.substring(4, 5) : undefined

              makeAMove({
                from: from,
                to: to,
                promotion: promotion,
              })
            }
          } catch (error) {
            console.error("Error getting legal moves:", error)
          }
        }

        if (data.mate !== null) {
          setEvaluation(`Mat en ${Math.abs(data.mate)}`)
        } else if (data.evaluation !== undefined) {
          const evalValue = Number.parseFloat(data.evaluation)
          setEvaluation(evalValue > 0 ? `+${evalValue.toFixed(2)}` : evalValue.toFixed(2))
        }

        if (data.continuation) {
          setContinuation(data.continuation)
        }
      } else {
        // Si l'API principale échoue, essayer l'API de secours
        if (!useBackupApi) {
          console.log("Primary API failed, switching to backup API")
          localStorage.setItem("useBackupApi", "true")
          // Réessayer avec l'API de secours
          await analyzePosition()
          return
        }
        throw new Error(data.data || "Échec de l'analyse")
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error)

      // Si c'est une erreur d'avortement (timeout), afficher un message spécifique
      if (error.name === "AbortError") {
        setApiError("L'analyse a pris trop de temps. Veuillez réessayer.")
      } else if (!localStorage.getItem("useBackupApi")) {
        // Si ce n'est pas déjà fait, essayer l'API de secours
        console.log("Error with primary API, switching to backup API")
        localStorage.setItem("useBackupApi", "true")
        // Réessayer avec l'API de secours
        await analyzePosition()
        return
      } else {
        setApiError("Impossible d'obtenir l'analyse. Veuillez réessayer plus tard.")
      }

      setBestMove("")
      setEvaluation("")
      setContinuation("")
    } finally {
      setStockfishThinking(false)
    }
  }, [game, autoPlay, reviewMode, playerSide, analyzeMode, currentDifficulty, ratingMode])

  // Ajouter cette fonction pour vérifier l'échec et l'échec et mat après chaque coup
  const checkForCheckAndMate = useCallback(() => {
    if (!game) return { isCheck: false, isCheckmate: false, kingSquare: null }

    const inCheck = game.inCheck()
    const inCheckmate = game.isCheckmate()
    let kingSquare = null

    if (inCheck || inCheckmate) {
      const board = game.board()
      const kingColor = game.turn() // couleur du roi en échec

      // Trouver la position du roi
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece?.type === "k" && piece.color === kingColor) {
            kingSquare = String.fromCharCode(97 + col) + (8 - row)
            break
          }
        }
        if (kingSquare) break
      }
    }

    return { isCheck: inCheck, isCheckmate: inCheckmate, kingSquare }
  }, [game])

  // Ajouter cette fonction après la fonction checkForCheckAndMate
  const checkOnlyKingsLeft = useCallback(() => {
    if (!game) return false

    const board = game.board()
    let pieceCount = 0
    let onlyKings = true

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          pieceCount++
          if (piece.type !== "k") {
            onlyKings = false
          }
        }
      }
    }

    // S'il y a exactement 2 pièces et que ce sont uniquement des rois
    return pieceCount === 2 && onlyKings
  }, [game])

  // Modifier la fonction handleGameEnd pour utiliser window.eloSystem
  const handleGameEnd = useCallback(
    (result: "win" | "loss" | "draw") => {
      console.log(
        "Gestion de fin de partie - Résultat:",
        result,
        "Mode classement:",
        ratingMode,
        "Côté joueur:",
        playerSide,
      )

      // Arrêter l'auto-play et l'analyse
      setAutoPlay(false)
      setStockfishThinking(false)
      setGameInProgress(false)
      setGameResult(result)

      // Vérifier si on est côté client
      if (typeof window === "undefined") return

      // Utiliser window.eloSystem pour enregistrer le résultat
      if (window.eloSystem) {
        const currentElo = Number.parseInt(localStorage.getItem("playerElo") || "800", 10)
        setOldElo(currentElo)

        console.log("Enregistrement du résultat:", result, "contre ELO:", currentDifficulty.elo)
        const newEloValue = window.eloSystem.recordGameResult(result, currentDifficulty.elo)
        console.log("Nouvel ELO:", newEloValue)
        setNewElo(newEloValue)

        // Afficher le modal de résultat
        console.log("Affichage du modal de résultat")
        setShowResultModal(true)
      } else {
        console.error("EloSystem non disponible via window.eloSystem")

        // Essayer de récupérer l'ELO actuel et calculer manuellement
        const currentElo = Number.parseInt(localStorage.getItem("playerElo") || "800", 10)
        setOldElo(currentElo)

        // Afficher quand même le modal
        setShowResultModal(true)
      }
    },
    [currentDifficulty.elo, playerSide, ratingMode],
  )

  // Ajouter cette fonction de débogage pour vérifier l'état du modal
  const debugModal = () => {
    console.log("État du modal:", {
      showResultModal,
      gameResult,
      oldElo,
      newElo,
      eloSystemAvailable: typeof window !== "undefined" && !!window.eloSystem,
    })

    // Forcer l'affichage du modal pour tester
    setGameResult("win")
    setOldElo(800)
    setNewElo(820)
    setShowResultModal(true)
  }

  // Modifier la fonction checkGameEnd pour améliorer la détection de fin de partie en mode classement
  const checkGameEnd = useCallback(() => {
    if (!gameInProgress || reviewMode) return

    // Vérifier s'il ne reste que deux rois
    const onlyKingsLeft = checkOnlyKingsLeft()
    if (onlyKingsLeft) {
      console.log("Seulement deux rois restants - partie nulle")
      handleGameEnd("draw")
      return
    }

    // Vérifier explicitement l'échec et mat
    const isCheckmate = game.isCheckmate()
    const isDraw = game.isDraw()
    const isGameOver = game.isGameOver()

    console.log("Game status check:", { isCheckmate, isDraw, isGameOver })

    if (isCheckmate || isDraw || isGameOver) {
      let result: "win" | "loss" | "draw" | null = null

      if (isDraw) {
        console.log("Match nul détecté")
        result = "draw"
      } else if (isCheckmate) {
        // Le joueur qui vient de jouer est le gagnant (car c'est l'adversaire qui est en échec et mat)
        const winner = game.turn() === "w" ? "black" : "white"
        console.log(`Échec et mat détecté! Gagnant: ${winner}, Joueur: ${playerSide}`)

        // En mode classement ou normal, déterminer le résultat par rapport au joueur
        result = winner === playerSide ? "win" : "loss"
        if (playerSide === "both") {
          // Si le joueur joue les deux côtés, on considère que c'est toujours une victoire
          result = "win"
        }
      }

      if (result) {
        console.log("Fin de partie détectée avec résultat:", result)
        handleGameEnd(result)
      }
    } else {
      // Mettre à jour l'état d'échec pour l'affichage visuel
      const { isCheck, kingSquare } = checkForCheckAndMate()
      setIsCheck(isCheck)
      setCheckedKingSquare(kingSquare)
    }
  }, [game, gameInProgress, reviewMode, playerSide, checkForCheckAndMate, handleGameEnd, checkOnlyKingsLeft])

  // Ajouter cette fonction pour démarrer une partie en mode classement
  // Remplacer la fonction startRatingGame par celle-ci
  const startRatingGame = (colorChoice: "white" | "black" | "random") => {
    // Vérifier si le code s'exécute côté client
    if (typeof window === "undefined") return

    // Vérifier si le joueur a un pseudo
    const hasUsername = localStorage.getItem("playerName")

    if (!hasUsername || hasUsername === "Joueur") {
      // Si pas de pseudo, montrer le prompt et sauvegarder le choix de couleur
      setShowUsernamePrompt(true)
      setPendingColorChoice(colorChoice)
      return
    }

    // Si le joueur a déjà un pseudo, démarrer la partie
    startRatingGameWithColor(colorChoice)
  }

  // Ajouter cette nouvelle fonction
  const startRatingGameWithColor = (colorChoice: "white" | "black" | "random") => {
    // Réinitialiser complètement le jeu
    resetGame()

    // Déterminer la couleur du joueur
    let playerColor: "white" | "black"
    if (colorChoice === "random") {
      playerColor = Math.random() < 0.5 ? "white" : "black"
    } else {
      playerColor = colorChoice
    }

    console.log("Démarrage du mode classement, couleur joueur:", playerColor)

    // Configurer le jeu
    setPlayerSide(playerColor)
    setAutoPlay(true)
    setAnalyzeMode(false)
    setAutoAnalyze(false)
    setRatingMode(true)
    setRatingGameStarted(true)
    setGameInProgress(true)
    setCheckedKingSquare(null)
    setIsCheck(false)
    setIsCheckmate(false)
    setGameResult(null)

    // Si le joueur est noir, l'ordinateur (blanc) joue en premier
    if (playerColor === "black") {
      setTimeout(() => {
        analyzePosition()
      }, 500)
    }
  }

  // Ajouter cette fonction pour quitter le mode classement
  const exitRatingMode = () => {
    setRatingMode(false)
    setRatingGameStarted(false)
    setRatingColorSelection(null)
    setPlayerSide("both")
    setCheckedKingSquare(null)
    setIsCheck(false)
    setIsCheckmate(false)
    setGameResult(null)
    resetGame()
  }

  // Update FEN when game changes
  useEffect(() => {
    if (!editMode) {
      if (!reviewMode) {
        setDisplayFen(game.fen())

        // Vérifier la fin de partie
        if (gameInProgress) {
          checkGameEnd()
        }
      }

      // Get Stockfish analysis after each move if autoAnalyze is enabled
      if (autoAnalyze && gameHistoryRef.current.length > 0 && !reviewMode && !ratingMode) {
        analyzePosition()
      }

      // Gérer le tour de l'ordinateur
      const currentTurn = game.turn() === "w" ? "white" : "black"
      const isComputerTurnNow =
        (playerSide === "white" && currentTurn === "black") || (playerSide === "black" && currentTurn === "white")

      if (isComputerTurnNow && autoPlay && !reviewMode && !stockfishThinking) {
        setIsComputerTurn(true)
        analyzePosition()
      } else {
        setIsComputerTurn(false)
      }
    }
  }, [
    game,
    editMode,
    reviewMode,
    autoPlay,
    playerSide,
    stockfishThinking,
    analyzePosition,
    gameHistoryRef,
    gameInProgress,
    checkGameEnd,
    autoAnalyze,
    ratingMode,
  ])

  // Modifier la fonction makeAMove pour vérifier l'échec après chaque coup
  function makeAMove(move) {
    if (reviewMode) {
      setReviewMode(false)
      setHistoryIndex(-1)
      setDisplayFen(game.fen())
    }

    const gameCopy = new Chess(game.fen())

    try {
      const result = gameCopy.move(move)
      if (result) {
        setGame(gameCopy)
        addPosition(gameCopy.fen(), result)
        setMoveHistory([...gameHistoryRef.current.map((m) => ({ ...m }))])

        if (!gameInProgress && (playerSide !== "both" || ratingMode)) {
          setGameInProgress(true)
        }

        // Vérifier immédiatement si la partie est terminée après le coup
        if (gameCopy.isCheckmate() || gameCopy.isDraw() || gameCopy.isGameOver()) {
          console.log("Fin de partie détectée immédiatement après le coup")
          // Utiliser setTimeout pour s'assurer que l'état du jeu est à jour
          setTimeout(() => checkGameEnd(), 100)
        } else {
          // Mettre à jour l'état d'échec pour l'affichage visuel
          const inCheck = gameCopy.inCheck()
          if (inCheck) {
            const board = gameCopy.board()
            const kingColor = gameCopy.turn()
            let kingSquare = null

            // Trouver la position du roi en échec
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 8; col++) {
                const piece = board[row][col]
                if (piece?.type === "k" && piece.color === kingColor) {
                  kingSquare = String.fromCharCode(97 + col) + (8 - row)
                  break
                }
              }
              if (kingSquare) break
            }

            setIsCheck(true)
            setCheckedKingSquare(kingSquare)
          } else {
            setIsCheck(false)
            setCheckedKingSquare(null)
          }
        }

        return true
      }
      return false
    } catch (error) {
      console.error("Erreur lors du déplacement:", error, move)
      return false
    }
  }

  // Modifier la fonction onDrop pour prendre en compte le mode classement
  function onDrop(sourceSquare, targetSquare) {
    // Si on est en mode revue, ne pas permettre de déplacer les pièces
    if (reviewMode) return false

    if (editMode) {
      // En mode édition, on gère le placement des pièces manuellement
      handleEditBoardDrop(sourceSquare, targetSquare)
      return true
    } else {
      // En mode jeu normal
      // Vérifier si c'est un mouvement de promotion
      const moveObj = {
        from: sourceSquare,
        to: targetSquare,
      }

      // Ajouter la promotion uniquement si c'est un pion qui atteint la dernière rangée
      const piece = game.get(sourceSquare)
      const isPromotion =
        piece &&
        piece.type === "p" &&
        ((piece.color === "w" && targetSquare[1] === "8") || (piece.color === "b" && targetSquare[1] === "1"))

      if (isPromotion) {
        moveObj.promotion = "q" // Toujours promouvoir en dame pour simplifier
      }

      // Vérifier si c'est le tour du joueur en fonction du paramètre playerSide
      const currentTurn = game.turn() === "w" ? "white" : "black"

      // Si le mode analyse est activé, on permet de jouer n'importe quelle pièce
      if (analyzeMode && !ratingMode) {
        const move = makeAMove(moveObj)
        return move
      }

      // Sinon, on vérifie si c'est le tour du joueur
      if (playerSide !== "both" && playerSide !== currentTurn) {
        return false
      }

      const move = makeAMove(moveObj)
      return move
    }
  }

  // Modifier la fonction resetGame pour réinitialiser les états d'échec
  function resetGame() {
    const newGame = new Chess()
    setGame(newGame)
    setDisplayFen(newGame.fen())
    setBestMove("")
    setEvaluation("")
    setApiError("")
    setContinuation("")
    setPreviousGameState(null)
    setHistoryIndex(-1)
    setReviewMode(false)
    setIsComputerTurn(false)
    setGameInProgress(false)
    setGameResult(null)
    setIsCheck(false)
    setIsCheckmate(false)

    // Réinitialiser l'historique des positions
    resetHistory(newGame.fen())
    setMoveHistory([]) // réinitialiser l'historique dans l'UI
  }

  function makeBestMove() {
    if (bestMove && !reviewMode) {
      console.log("Making best move:", bestMove)

      // Extraire les cases de départ et d'arrivée
      const from = bestMove.substring(0, 2)
      const to = bestMove.substring(2, 4)

      // Vérifier s'il y a une promotion (5ème caractère)
      const promotion = bestMove.length === 5 ? bestMove.substring(4, 5) : undefined

      console.log(`Moving from ${from} to ${to}${promotion ? ` with promotion to ${promotion}` : ""}`)

      const moveResult = makeAMove({
        from: from,
        to: to,
        promotion: promotion,
      })

      console.log("Move result:", moveResult)
    }
  }

  function undoLastMove() {
    if (reviewMode) {
      // Si on est en mode revue, revenir d'abord à la position actuelle
      setReviewMode(false)
      setHistoryIndex(-1)
      setDisplayFen(game.fen())
      return
    }

    if (removeLastPosition()) {
      // Si on a réussi à supprimer le dernier coup
      const newFen = positionHistoryRef.current[positionHistoryRef.current.length - 1]
      const gameCopy = new Chess(newFen)
      setGame(gameCopy)
      setDisplayFen(newFen)
      setMoveHistory([...gameHistoryRef.current.map((m) => ({ ...m }))])
    }
  }

  function navigateToMove(index) {
    if (positionHistoryRef.current.length === 0) return

    // Si on veut voir la position actuelle
    if (index === -1) {
      setReviewMode(false)
      setHistoryIndex(-1)
      setDisplayFen(game.fen())
      return
    }

    // Vérifier que l'index est valide
    if (index >= 0 && index < positionHistoryRef.current.length) {
      try {
        setReviewMode(true)
        setHistoryIndex(index)
        setDisplayFen(positionHistoryRef.current[index])
      } catch (error) {
        console.error("Erreur lors de la navigation vers le coup:", error)
        // En cas d'erreur, revenir à la position actuelle
        setReviewMode(false)
        setHistoryIndex(-1)
        setDisplayFen(game.fen())
      }
    }
  }

  // Fonctions de navigation
  function goToFirstMove() {
    navigateToMove(0) // Aller à la position initiale
  }

  function goToPreviousMove() {
    // Si on est à la position actuelle, aller au dernier coup de l'historique
    const newIndex = historyIndex === -1 ? positionHistoryRef.current.length - 1 : Math.max(historyIndex - 1, 0)
    navigateToMove(newIndex)
  }

  function goToNextMove() {
    // Si on est au dernier coup de l'historique, aller à la position actuelle
    const newIndex = historyIndex === positionHistoryRef.current.length - 1 ? -1 : historyIndex + 1
    navigateToMove(newIndex)
  }

  function goToLastMove() {
    // Revenir à la position actuelle
    navigateToMove(-1)
  }

  // Fonctions pour le mode d'édition
  function handlePieceSelect(piece) {
    setSelectedPiece(piece)
    setClearMode(false)
  }

  function handleClearModeToggle() {
    setClearMode(!clearMode)
    setSelectedPiece(null)
  }

  function handleSquareClick(square) {
    if (!editMode) return

    const newPosition = { ...customPosition }

    if (clearMode) {
      // Supprimer la pièce de la case
      delete newPosition[square]
    } else if (selectedPiece) {
      // Placer la pièce sélectionnée sur la case
      newPosition[square] = selectedPiece
    }

    setCustomPosition(newPosition)
  }

  function handleEditBoardDrop(sourceSquare, targetSquare) {
    const newPosition = { ...customPosition }

    // Si la source est une case du plateau (pas de la palette)
    if (customPosition[sourceSquare]) {
      // Déplacer la pièce
      newPosition[targetSquare] = customPosition[sourceSquare]
      delete newPosition[sourceSquare]
    } else if (selectedPiece) {
      // Placer la pièce sélectionnée
      newPosition[targetSquare] = selectedPiece
    }

    setCustomPosition(newPosition)
  }

  function applyCustomPosition() {
    try {
      // Créer une position FEN à partir de la position personnalisée
      const boardArray = Array(8)
        .fill()
        .map(() => Array(8).fill(null))

      // Placer les pièces sur le tableau
      Object.entries(customPosition).forEach(([square, piece]) => {
        const col = square.charCodeAt(0) - 97 // 'a' -> 0, 'b' -> 1, etc.
        const row = 8 - Number.parseInt(square[1]) // '8' -> 0, '7' -> 1, etc.

        const pieceColor = piece[0] // 'w' ou 'b'
        const pieceType = piece[1].toLowerCase() // 'p', 'n', 'b', 'r', 'q', 'k'

        boardArray[row][col] = {
          type: pieceType,
          color: pieceColor === "w" ? "w" : "b",
        }
      })

      // Construire la chaîne FEN pour la position
      const fenParts = []

      // 1. Placement des pièces
      let positionString = ""
      for (let row = 0; row < 8; row++) {
        let emptyCount = 0
        for (let col = 0; col < 8; col++) {
          const piece = boardArray[row][col]
          if (piece) {
            if (emptyCount > 0) {
              positionString += emptyCount
              emptyCount = 0
            }
            const pieceChar = piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase()
            positionString += pieceChar
          } else {
            emptyCount++
          }
        }
        if (emptyCount > 0) {
          positionString += emptyCount
        }
        if (row < 7) {
          positionString += "/"
        }
      }
      fenParts.push(positionString)

      // 2. Tour de jeu
      fenParts.push(currentTurn)

      // 3-6. Droits de roque, en passant, demi-coups, nombre de coups
      // Simplification: pas de roque, pas d'en passant, reset des compteurs
      fenParts.push("-") // Pas de roque
      fenParts.push("-") // Pas d'en passant
      fenParts.push("0") // Demi-coups
      fenParts.push("1") // Nombre de coups

      const fen = fenParts.join(" ")
      console.log("Generated FEN:", fen)

      // Vérifier si la position est valide
      const newGame = new Chess(fen)

      // Appliquer la position
      setGame(newGame)
      setDisplayFen(fen)
      setEditMode(false)
      setActiveTab("play")
      setPreviousGameState(null)
      setHistoryIndex(-1)
      setReviewMode(false)
      setGameInProgress(false)
      setGameResult(null)

      // Réinitialiser l'historique des positions
      resetHistory(fen)

      // Analyser la nouvelle position si autoAnalyze est activé
      if (autoAnalyze) {
        setTimeout(() => {
          analyzePosition()
        }, 500)
      }
    } catch (error) {
      console.error("Erreur lors de l'application de la position:", error)
      setApiError("Position invalide. Veuillez vérifier le placement des pièces.")
    }
  }

  function startEditMode() {
    setEditMode(true)
    setActiveTab("edit")
    setBestMove("")
    setEvaluation("")
    setContinuation("")
    setReviewMode(false)
  }

  function cancelEditMode() {
    setEditMode(false)
    setActiveTab("play")
    setSelectedPiece(null)
    setClearMode(false)
  }

  function clearBoard() {
    setCustomPosition({})
  }

  function setStartingPosition() {
    const startGame = new Chess()

    // Convertir la position de départ en format pour l'éditeur
    const pieces = {}
    const board = startGame.board()

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          const square = String.fromCharCode(97 + col) + (8 - row)
          pieces[square] = piece.color === "w" ? `w${piece.type.toUpperCase()}` : `b${piece.type.toUpperCase()}`
        }
      }
    }

    setCustomPosition(pieces)
  }

  // Fonction pour gérer le changement de difficulté
  const handleDifficultyChange = (level) => {
    console.log("Changing difficulty to:", level.name)
    setCurrentDifficulty(level)
  }

  // Préparer les flèches pour le meilleur coup
  const customArrows = []
  if (bestMove && showBestMoveArrow && !stockfishThinking && !editMode && !reviewMode && !ratingMode) {
    const from = bestMove.substring(0, 2)
    const to = bestMove.substring(2, 4)
    customArrows.push([from, to, "#1b74e4"])
  }

  // Préparer les données pour l'affichage de l'historique des coups
  const prepareMovesForDisplay = () => {
    const history = gameHistoryRef.current
    if (history.length === 0) return []

    const movePairs = []
    for (let i = 0; i < history.length; i += 2) {
      const whiteMove = history[i]
      const blackMove = i + 1 < history.length ? history[i + 1] : null
      movePairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        whiteMove,
        blackMove,
        whiteMoveIndex: i + 1, // Index dans positionHistoryRef
        blackMoveIndex: i + 2, // Index dans positionHistoryRef (si existe)
      })
    }
    return movePairs
  }

  // Ajouter un composant pour le mode classement
  const RatingModeSelector = () => {
    return (
      <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold text-cyan-400 mb-6 text-center">Mode Classement</h2>

        {!ratingGameStarted ? (
          <>
            <p className="text-white mb-6 text-center">
              Choisissez votre couleur pour jouer une partie officielle qui comptera pour votre classement ELO.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => startRatingGame("white")}
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-4 px-2 rounded-lg flex flex-col items-center justify-center transition-all"
              >
                <div className="w-12 h-12 bg-white rounded-full mb-2 flex items-center justify-center">
                  <span className="text-black text-2xl">♙</span>
                </div>
                <span className="text-sm">Blancs</span>
              </button>

              <button
                onClick={() => startRatingGame("black")}
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-4 px-2 rounded-lg flex flex-col items-center justify-center transition-all"
              >
                <div className="w-12 h-12 bg-black rounded-full mb-2 flex items-center justify-center">
                  <span className="text-white text-2xl">♟</span>
                </div>
                <span className="text-sm">Noirs</span>
              </button>

              <button
                onClick={() => startRatingGame("random")}
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-4 px-2 rounded-lg flex flex-col items-center justify-center transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-white to-black rounded-full mb-2 flex items-center justify-center">
                  <span className="text-gray-800 text-2xl">?</span>
                </div>
                <span className="text-sm">Aléatoire</span>
              </button>
            </div>

            <div className="text-gray-400 text-sm p-4 bg-[#2a2a2a] rounded-lg">
              <p className="mb-2">
                <strong>Règles du mode classement:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Les parties comptent pour votre classement ELO</li>
                <li>L'analyse et les aides sont désactivées</li>
                <li>Vous ne pouvez pas annuler vos coups</li>
                <li>La difficulté s'adapte à votre niveau</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4 p-3 bg-[#2a2a2a] rounded-lg">
              <p className="text-white">
                Partie officielle en cours
                <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </p>
              <p className="text-sm text-gray-400 mt-1">Vous jouez les {playerSide === "white" ? "blancs" : "noirs"}</p>
            </div>

            <button
              onClick={exitRatingMode}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all"
            >
              Abandonner la partie
            </button>
          </div>
        )}
      </div>
    )
  }

  // Fonction pour afficher la palette de pièces en mode édition
  const renderPiecePalette = () => (
    <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md">
      <h2 className="text-base font-medium text-cyan-400 mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Pièces</h2>

      {/* Pièces blanches */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Blancs</h3>
        <div className="grid grid-cols-3 gap-2">
          {PIECES.white.map((piece) => (
            <button
              key={piece}
              onClick={() => handlePieceSelect(piece)}
              className={`p-2 rounded-md transition-colors duration-200 ${
                selectedPiece === piece ? "bg-[#1b74e4] text-white" : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
              }`}
              title={PIECE_NAMES[piece]}
              aria-label={PIECE_NAMES[piece]}
            >
              {SHORT_PIECE_NAMES[piece]}
            </button>
          ))}
        </div>
      </div>

      {/* Pièces noires */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Noirs</h3>
        <div className="grid grid-cols-3 gap-2">
          {PIECES.black.map((piece) => (
            <button
              key={piece}
              onClick={() => handlePieceSelect(piece)}
              className={`p-2 rounded-md transition-colors duration-200 ${
                selectedPiece === piece ? "bg-[#1b74e4] text-white" : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
              }`}
              title={PIECE_NAMES[piece]}
              aria-label={PIECE_NAMES[piece]}
            >
              {SHORT_PIECE_NAMES[piece]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleClearModeToggle}
        className={`w-full mt-2 py-2 px-4 rounded text-sm font-medium transition-all ${
          clearMode ? "bg-[#1b74e4] text-white" : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
        }`}
      >
        {clearMode ? "Désactiver Effacer" : "Activer Effacer"}
      </button>
    </div>
  )

  // Fonction pour afficher les contrôles d'édition
  const renderEditControls = () => (
    <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md">
      <h2 className="text-base font-medium text-cyan-400 mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Contrôles</h2>
      <div className="flex flex-col gap-3">
        <button
          onClick={applyCustomPosition}
          className="py-2 px-4 rounded text-sm font-medium bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
        >
          Appliquer
        </button>
        <button
          onClick={setStartingPosition}
          className="py-2 px-4 rounded text-sm font-medium bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
        >
          Position de départ
        </button>
        <button
          onClick={clearBoard}
          className="py-2 px-4 rounded text-sm font-medium bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
        >
          Effacer le plateau
        </button>
        <button
          onClick={cancelEditMode}
          className="py-2 px-4 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
        >
          Annuler
        </button>
      </div>
    </div>
  )

  // Fonction pour afficher le panneau d'analyse
  const renderAnalysisPanel = () => (
    <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md">
      <h2 className="text-base font-medium mb-4 pb-2 border-b border-cyan-400/30 text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        Analyse
      </h2>

      {/* Afficher l'évaluation de la position */}
      {evaluation && (
        <div className="p-3 bg-[#2a2a2a] rounded-lg mb-4">
          <p className="text-white text-sm">
            Évaluation: <span className="font-bold">{evaluation}</span>
          </p>
        </div>
      )}

      {/* Afficher la continuation suggérée */}
      {continuation && (
        <div className="p-3 bg-[#2a2a2a] rounded-lg mb-4">
          <p className="text-white text-sm">
            Continuation: <span className="font-bold">{continuation}</span>
          </p>
        </div>
      )}

      {/* Afficher l'historique des coups */}
      <h2 className="text-base font-medium mb-4 pb-2 border-b border-cyan-400/30 text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        Historique des coups
      </h2>

      <div className="h-[200px] overflow-y-auto mb-4">
        {moveHistory.length > 0 ? (
          <div className="flex flex-col gap-1">
            {prepareMovesForDisplay().map((pair, index) => (
              <div key={index} className="flex w-full">
                {/* Numéro du coup */}
                <div className="w-8 flex-shrink-0 font-mono text-blue-400 py-2 px-1 text-sm">{pair.moveNumber}.</div>

                {/* Coup blanc */}
                <div className="flex-1 p-2 rounded bg-[#2a2a2a] text-gray-200">
                  <span className="font-mono text-sm">{pair.whiteMove?.san || ""}</span>
                  {/* Bouton pour aller au coup blanc */}
                  {pair.whiteMoveIndex && (
                    <button
                      onClick={() => navigateToMove(pair.whiteMoveIndex - 1)}
                      className="ml-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                {/* Coup noir */}
                {pair.blackMove && (
                  <div className="flex-1 p-2 rounded ml-1 bg-[#2a2a2a] text-gray-200">
                    <span className="font-mono text-sm">{pair.blackMove?.san || ""}</span>
                    {/* Bouton pour aller au coup noir */}
                    {pair.blackMoveIndex && (
                      <button
                        onClick={() => navigateToMove(pair.blackMoveIndex - 1)}
                        className="ml-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Aucun coup joué</p>
          </div>
        )}
      </div>

      {/* Indicateur d'activité Auto-Play */}
      {autoPlay && stockfishThinking && (
        <div className="flex items-center justify-center py-2 px-3 bg-[#2a2a2a] rounded text-white mt-2">
          <Loader2 className="h-3 w-3 animate-spin text-blue-400 mr-2" />
          <span className="text-sm text-cyan-400">L'ordinateur réfléchit...</span>
        </div>
      )}

      {/* Barre de navigation dans l'historique */}
      {historyLength > 0 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={goToFirstMove}
            className="p-2 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white disabled:opacity-50"
            disabled={reviewMode && historyIndex === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={goToPreviousMove}
            className="p-2 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white disabled:opacity-50"
            disabled={reviewMode && historyIndex === 0}
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={goToNextMove}
            className="p-2 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white disabled:opacity-50"
            disabled={!reviewMode || historyIndex === positionHistoryRef.current.length - 1}
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={goToLastMove}
            className="p-2 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white disabled:opacity-50"
            disabled={!reviewMode || historyIndex === positionHistoryRef.current.length - 1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Afficher un message d'erreur de l'API */}
      {apiError && (
        <div className="p-3 bg-red-800 text-white rounded-lg mt-4">
          <p className="text-sm">{apiError}</p>
        </div>
      )}
    </div>
  )

  // Modifier le rendu principal pour inclure le mode classement et l'affichage des échecs
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-[#1e1e1e] p-1 rounded-full shadow-lg">
          <TabsTrigger
            value="play"
            onClick={() => {
              if (editMode) {
                setEditMode(false)
                setSelectedPiece(null)
                setClearMode(false)
              }
              if (ratingMode) {
                setRatingMode(false)
                setRatingGameStarted(false)
                setRatingColorSelection(null)
              }
              setActiveTab("play")
            }}
            className="data-[state=active]:bg-[#1b74e4] data-[state=active]:text-white data-[state=active]:shadow-md rounded-full py-2 px-4 text-sm font-medium"
          >
            Mode Jeu
          </TabsTrigger>
          <TabsTrigger
            value="rating"
            onClick={() => {
              if (editMode) {
                setEditMode(false)
                setSelectedPiece(null)
                setClearMode(false)
              }
              setRatingMode(true)
              setActiveTab("rating")
            }}
            className="data-[state=active]:bg-[#1b74e4] data-[state=active]:text-white data-[state=active]:shadow-md rounded-full py-2 px-4 text-sm font-medium"
          >
            Classement
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            onClick={() => {
              if (ratingMode) {
                setRatingMode(false)
                setRatingGameStarted(false)
                setRatingColorSelection(null)
              }
              startEditMode()
              setActiveTab("edit")
            }}
            className="data-[state=active]:bg-[#1b74e4] data-[state=active]:text-white data-[state=active]:shadow-md rounded-full py-2 px-4 text-sm font-medium"
          >
            Mode Édition
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Mode Classement */}
      {activeTab === "rating" && !ratingGameStarted && (
        <>
          <RatingModeSelector />
          <div className="mt-6">
            <EloSystem onDifficultyChange={handleDifficultyChange} />
          </div>
        </>
      )}

      {/* Mode Jeu et Mode Édition */}
      {(activeTab !== "rating" || ratingGameStarted) && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Contrôles à gauche */}
          {!editMode && !ratingMode && (
            <div className="w-full lg:w-72 order-2 lg:order-1">
              <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    Contrôles
                  </h3>
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-cyan-400"
                    aria-label="Aide"
                    title="Aide"
                  >
                    ?
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <Select value={playerSide} onValueChange={(value) => setPlayerSide(value)}>
                    <SelectTrigger className="w-full bg-[#2a2a2a] border-0 text-white text-sm">
                      <SelectValue placeholder="Choisir un côté" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-0 text-white">
                      <SelectItem value="both">Les deux côtés</SelectItem>
                      <SelectItem value="white">Blancs</SelectItem>
                      <SelectItem value="black">Noirs</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Auto-Play déplacé au-dessus du Mode analyse */}
                  <div className="flex items-center justify-between py-2 px-3 bg-[#2a2a2a] rounded text-white">
                    <Label
                      htmlFor="auto-play"
                      className="text-sm cursor-pointer text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                    >
                      Auto-Play
                    </Label>
                    <Switch
                      id="auto-play"
                      checked={autoPlay}
                      onCheckedChange={setAutoPlay}
                      className="data-[state=checked]:bg-[#1b74e4]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-[#2a2a2a] rounded text-white">
                    <Label
                      htmlFor="analyze-mode"
                      className="text-sm cursor-pointer text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                    >
                      Mode analyse
                    </Label>
                    <Switch
                      id="analyze-mode"
                      checked={analyzeMode}
                      onCheckedChange={setAnalyzeMode}
                      className="data-[state=checked]:bg-[#1b74e4]"
                    />
                  </div>

                  <button
                    onClick={() => setShowBestMoveArrow(!showBestMoveArrow)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-all ${
                      showBestMoveArrow ? "bg-[#1b74e4] text-white" : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
                    }`}
                  >
                    <Zap size={14} />
                    {showBestMoveArrow ? "Masquer flèche" : "Montrer flèche"}
                  </button>

                  <button
                    onClick={resetGame}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white"
                  >
                    <RotateCw size={14} />
                    Nouvelle partie
                  </button>

                  <button
                    onClick={undoLastMove}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white"
                  >
                    <ArrowLeft size={14} />
                    Annuler
                  </button>

                  <button
                    onClick={startEditMode}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white"
                  >
                    <Edit3 size={14} />
                    Éditer
                  </button>

                  <div className="flex items-center justify-between py-2 px-3 bg-[#2a2a2a] rounded text-white">
                    <Label
                      htmlFor="auto-analyze"
                      className="text-sm cursor-pointer text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                    >
                      Analyse auto
                    </Label>
                    <Switch
                      id="auto-analyze"
                      checked={autoAnalyze}
                      onCheckedChange={setAutoAnalyze}
                      className="data-[state=checked]:bg-[#1b74e4]"
                    />
                  </div>

                  <button
                    onClick={analyzePosition}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white mt-2"
                  >
                    <Search size={14} />
                    Analyser
                  </button>

                  <button
                    onClick={() => {
                      localStorage.removeItem("useBackupApi")
                      setApiError("")
                      alert("Configuration de l'API réinitialisée. L'API principale sera utilisée.")
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-sm font-medium text-white mt-2"
                  >
                    <RotateCw size={14} />
                    Réinitialiser API
                  </button>
                </div>
              </div>

              {/* Système ELO */}
            </div>
          )}

          {/* Contrôles simplifiés pour le mode classement */}
          {!editMode && ratingMode && ratingGameStarted && (
            <div className="w-full lg:w-72 order-2 lg:order-1">
              <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    Partie officielle
                  </h3>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                <div className="p-3 bg-[#2a2a2a] rounded-lg mb-4">
                  <p className="text-white text-sm">Vous jouez les {playerSide === "white" ? "blancs" : "noirs"}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">
                    Niveau: {currentDifficulty.name} (ELO {localStorage.getItem("playerElo") || "800"})
                  </p>
                </div>

                <button
                  onClick={exitRatingMode}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 rounded text-sm font-medium text-white"
                >
                  Abandonner la partie
                </button>
              </div>

              {/* Système ELO */}
              <div className="w-full">
                <EloSystem onDifficultyChange={handleDifficultyChange} />
              </div>
            </div>
          )}

          {/* Mode édition - disposition horizontale */}
          {editMode && (
            <div className="flex flex-col lg:flex-row gap-6 w-full">
              {/* Pièces à gauche */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full lg:w-1/4 order-1"
              >
                {renderPiecePalette()}
              </motion.div>

              {/* Échiquier au centre */}
              <div className="w-full lg:w-1/2 order-2 flex flex-col">
                <div className="w-full aspect-square max-w-[600px] mx-auto relative">
                  <Chessboard
                    position={customPosition}
                    onPieceDrop={onDrop}
                    onSquareClick={handleSquareClick}
                    boardOrientation={playerSide === "black" ? "black" : "white"}
                    customBoardStyle={{
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      overflow: "hidden",
                    }}
                    customDarkSquareStyle={{ backgroundColor: boardColors.dark }}
                    customLightSquareStyle={{ backgroundColor: boardColors.light }}
                  />
                </div>
              </div>

              {/* Contrôles à droite */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full lg:w-1/4 order-3"
              >
                {renderEditControls()}
              </motion.div>
            </div>
          )}

          {/* Mode jeu - échiquier au centre */}
          {!editMode && (
            <div className="w-full lg:w-1/2 order-1 lg:order-2 flex flex-col">
              <div className="w-full aspect-square max-w-[600px] mx-auto relative">
                <Chessboard
                  position={displayFen}
                  onPieceDrop={onDrop}
                  boardOrientation={playerSide === "black" ? "black" : "white"}
                  customArrows={customArrows}
                  customBoardStyle={{
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                    overflow: "hidden",
                  }}
                  customDarkSquareStyle={{ backgroundColor: boardColors.dark }}
                  customLightSquareStyle={{ backgroundColor: boardColors.light }}
                  customSquareStyles={{
                    ...(checkedKingSquare
                      ? isCheckmate
                        ? {
                            [checkedKingSquare]: {
                              backgroundColor: "rgba(255, 0, 0, 0.6)",
                              backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/svg%3E\")",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                              backgroundSize: "70%",
                            },
                          }
                        : {
                            [checkedKingSquare]: {
                              backgroundColor: "rgba(255, 0, 0, 0.4)",
                            },
                          }
                      : {}),
                  }}
                />

                {stockfishThinking && !autoPlay && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                    <div className="bg-[#1e1e1e] p-3 rounded-lg shadow-lg flex items-center gap-3 text-white">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm font-medium">Analyse en cours...</span>
                    </div>
                  </div>
                )}

                {stockfishThinking && autoPlay && (
                  <div className="absolute top-2 right-2 bg-[#1e1e1e]/80 px-2 py-1 rounded-md shadow-md flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                    <span className="text-xs font-medium text-white">Analyse...</span>
                  </div>
                )}

                {reviewMode && (
                  <div className="absolute top-2 left-2 bg-[#1b74e4] px-3 py-1 rounded-full text-white text-xs font-medium shadow-md">
                    Mode revue
                  </div>
                )}

                {/* Affichage du niveau déplacé sous l'échiquier */}
                {!ratingMode && (
                  <div className="mt-4 bg-[#1e1e1e] p-3 rounded-lg shadow-md text-center">
                    <span className="text-sm font-medium text-cyan-400">
                      Mode analyse: <span className="text-green-400">Puissance maximale</span>
                    </span>
                  </div>
                )}

                {/* Afficher le niveau du joueur et son ELO sous l'échiquier en mode classement */}
                {ratingMode && (
                  <div className="mt-4 bg-[#1e1e1e]/90 p-3 rounded-lg shadow-md text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-white">
                        Niveau: {currentDifficulty.name} (ELO {localStorage.getItem("playerElo") || "800"})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analyse à droite - seulement visible en mode jeu normal, pas en mode classement */}
          {!editMode && !ratingMode && <div className="w-full lg:w-72 order-3 lg:order-3">{renderAnalysisPanel()}</div>}

          {/* Panneau simplifié pour le mode classement */}
          {!editMode && ratingMode && ratingGameStarted && (
            <div className="w-full lg:w-72 order-3 lg:order-3">
              <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md">
                <h2 className="text-base font-medium mb-4 pb-2 border-b border-cyan-400/30 text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  Historique des coups
                </h2>

                <div className="h-[200px] overflow-y-auto mb-4">
                  {moveHistory.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {prepareMovesForDisplay().map((pair, index) => (
                        <div key={index} className="flex w-full">
                          {/* Numéro du coup */}
                          <div className="w-8 flex-shrink-0 font-mono text-blue-400 py-2 px-1 text-sm">
                            {pair.moveNumber}.
                          </div>

                          {/* Coup blanc */}
                          <div className="flex-1 p-2 rounded bg-[#2a2a2a] text-gray-200">
                            <span className="font-mono text-sm">{pair.whiteMove?.san || ""}</span>
                          </div>

                          {/* Coup noir */}
                          {pair.blackMove && (
                            <div className="flex-1 p-2 rounded ml-1 bg-[#2a2a2a] text-gray-200">
                              <span className="font-mono text-sm">{pair.blackMove?.san || ""}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-400">Aucun coup joué</p>
                    </div>
                  )}
                </div>

                {/* Indicateur d'activité Auto-Play */}
                {autoPlay && stockfishThinking && (
                  <div className="flex items-center justify-center py-2 px-3 bg-[#2a2a2a] rounded text-white mt-2">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400 mr-2" />
                    <span className="text-sm text-cyan-400">L'ordinateur réfléchit...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal d'aide */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Modal de résultat de partie - Assurons-nous qu'il s'affiche toujours */}
      <GameResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false)
          // Réinitialiser le jeu après la fermeture du modal
          setTimeout(() => {
            if (ratingMode) {
              exitRatingMode()
            } else {
              resetGame()
            }
          }, 300)
        }}
        result={gameResult || "draw"} // Valeur par défaut pour éviter les erreurs
        oldElo={oldElo}
        newElo={newElo}
        opponentName={`Stockfish (${currentDifficulty.name})`}
      />
      {/* Prompt pour demander le pseudo */}
      <UsernamePrompt
        isOpen={showUsernamePrompt}
        onClose={(username) => {
          setShowUsernamePrompt(false)

          if (username) {
            localStorage.setItem("playerName", username)

            // Mettre à jour le leaderboard avec le nouveau nom
            if (typeof window !== "undefined" && window.updateLeaderboard) {
              window.updateLeaderboard()
            }

            // Si une couleur était en attente, démarrer la partie
            if (pendingColorChoice) {
              startRatingGameWithColor(pendingColorChoice)
              setPendingColorChoice(null)
            }
          }
        }}
        defaultUsername={localStorage.getItem("playerName") || ""}
      />
    </div>
  )
}
