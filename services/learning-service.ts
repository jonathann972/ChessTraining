import type { LearningModule, Lesson, UserProgress, LessonProgress } from "@/types/learning"
import { validateFEN, validateAllModulesFEN, fixMissingKings } from "@/utils/fen-validator"

// Fonction pour charger les modules d'apprentissage
export async function getLearningModules(): Promise<LearningModule[]> {
  // Dans une implémentation réelle, cela viendrait d'une API ou d'une base de données
  return SAMPLE_MODULES
}

// Fonction pour charger une leçon spécifique
export async function getLesson(lessonId: string): Promise<Lesson | null> {
  // Rechercher dans tous les modules
  for (const module of SAMPLE_MODULES) {
    const lesson = module.lessons.find((l) => l.id === lessonId)
    if (lesson) return lesson
  }
  return null
}

// Fonction pour sauvegarder la progression de l'utilisateur
export async function saveUserProgress(progress: UserProgress): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("chess_learning_progress", JSON.stringify(progress))
    }
    return true
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la progression:", error)
    return false
  }
}

// Fonction pour charger la progression de l'utilisateur
export function getUserProgress(userId: string): UserProgress {
  if (typeof window === "undefined") {
    return createDefaultUserProgress(userId)
  }

  try {
    const saved = localStorage.getItem("chess_learning_progress")
    if (saved) {
      return JSON.parse(saved) as UserProgress
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la progression:", error)
  }

  return createDefaultUserProgress(userId)
}

// Fonction pour mettre à jour la progression d'une leçon
export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  progress: LessonProgress,
): Promise<boolean> {
  try {
    const userProgress = getUserProgress(userId)
    userProgress.completedLessons[lessonId] = progress
    userProgress.lastActivity = new Date().toISOString()

    // Mettre à jour le nombre total d'exercices complétés
    if (progress.completed) {
      userProgress.totalExercisesCompleted += 1
    }

    // Mettre à jour la série de jours
    const today = new Date().toDateString()
    const lastStreakDay = userProgress.lastStreak ? new Date(userProgress.lastStreak).toDateString() : null

    if (lastStreakDay !== today) {
      userProgress.lastStreak = today

      // Si le dernier jour de série était hier, augmenter la série
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = yesterday.toDateString()

      if (lastStreakDay === yesterdayString) {
        userProgress.streakDays += 1
      } else {
        // Réinitialiser la série si ce n'était pas hier
        userProgress.streakDays = 1
      }
    }

    return await saveUserProgress(userProgress)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error)
    return false
  }
}

// Fonction pour créer un objet de progression par défaut
function createDefaultUserProgress(userId: string): UserProgress {
  return {
    userId,
    completedLessons: {},
    skillLevels: {
      basics: 0,
      openings: 0,
      tactics: 0,
      strategy: 0,
      endgames: 0,
    },
    lastActivity: new Date().toISOString(),
    totalExercisesCompleted: 0,
    streakDays: 0,
    lastStreak: "",
  }
}

// Vérifier toutes les positions FEN dans les modules
function validateAllFENs() {
  const validationResult = validateAllModulesFEN(SAMPLE_MODULES)

  if (validationResult.valid) {
    console.log("✅ Toutes les positions FEN sont valides.")
  } else {
    console.error(`❌ ${validationResult.invalidCount} positions FEN invalides trouvées:`)
    validationResult.invalidFENs.forEach((item) => {
      console.error(`- Module: ${item.moduleId}, Leçon: ${item.lessonId}, Exercice: ${item.exerciseId}`)
      console.error(`  FEN: ${item.fen}`)
      console.error(`  Erreur: ${item.error}`)

      // Tenter de corriger le FEN
      const correctedFEN = fixMissingKings(item.fen)
      console.log(`  FEN corrigé: ${correctedFEN}`)

      // Vérifier si la correction a résolu le problème
      const validationAfterFix = validateFEN(correctedFEN)
      if (validationAfterFix.valid) {
        console.log(`  ✅ Correction réussie`)
      } else {
        console.log(`  ❌ Correction échouée: ${validationAfterFix.error}`)
      }
    })
  }
}

// Exécuter la validation au chargement du module (côté client uniquement)
if (typeof window !== "undefined") {
  // Exécuter la validation après un court délai pour ne pas bloquer le rendu
  setTimeout(validateAllFENs, 2000)
}

// Données d'exemple pour les modules d'apprentissage
const SAMPLE_MODULES: LearningModule[] = [
  {
    id: "basics-module",
    title: "Fondamentaux des échecs",
    description: "Apprenez les règles de base et les mouvements des pièces",
    category: "basics",
    difficulty: "beginner",
    order: 1,
    imageUrl: "/chess-starting-position.png",
    lessons: [
      {
        id: "piece-movements",
        title: "Mouvements des pièces",
        description: "Apprenez comment chaque pièce se déplace sur l'échiquier",
        category: "basics",
        difficulty: "beginner",
        content: `
# Les mouvements des pièces d'échecs

Chaque pièce aux échecs possède un mouvement unique qui définit sa force et son rôle sur l'échiquier. Maîtriser ces mouvements est la première étape essentielle pour devenir un bon joueur d'échecs.

## Le Roi ♔♚

Le roi est la pièce la plus importante du jeu - si elle est capturée, la partie est perdue.

- **Mouvement**: Se déplace d'une seule case dans n'importe quelle direction (horizontale, verticale ou diagonale)
- **Particularités**:
  - Ne peut jamais se placer volontairement en échec (sur une case attaquée par une pièce adverse)
  - Peut effectuer un mouvement spécial appelé "roque" avec une tour sous certaines conditions
  - En fin de partie, devient une pièce active pour soutenir ses propres pions

## La Dame (Reine) ♕♛

La dame est la pièce la plus puissante du jeu, combinant les mouvements de la tour et du fou.

- **Mouvement**: Se déplace en ligne droite horizontalement, verticalement ou en diagonale, sur n'importe quel nombre de cases
- **Puissance**: Considérée comme valant environ 9 pions en termes de force
- **Stratégie**: Souvent gardée en réserve au début de la partie et déployée quand des lignes s'ouvrent

## La Tour ♖♜

La tour est une pièce de longue portée qui excelle dans les espaces ouverts.

- **Mouvement**: Se déplace horizontalement ou verticalement sur n'importe quel nombre de cases
- **Particularités**:
  - Participe au roque avec le roi (petit roque ou grand roque)
  - Particulièrement puissante sur les colonnes ouvertes
  - Vaut environ 5 pions en termes de force
- **Conseil**: Connectez vos tours en développant vos autres pièces pour maximiser leur potentiel

## Le Fou ♗♝

Le fou se déplace en diagonale et reste toujours sur des cases de la même couleur.

- **Mouvement**: Se déplace en diagonale sur n'importe quel nombre de cases
- **Particularités**:
  - Reste toujours sur des cases de la même couleur (fou de cases blanches ou fou de cases noires)
  - Travaille efficacement en paire (les deux fous ensemble contrôlent toutes les couleurs)
  - Vaut environ 3 pions en termes de force
- **Conseil**: Évitez d'échanger un fou contre un cavalier sans bonne raison

## Le Cavalier ♘♞

Le cavalier est la seule pièce qui peut sauter par-dessus d'autres pièces, ce qui lui confère une valeur unique.

- **Mouvement**: Se déplace en formant un "L" - deux cases dans une direction puis une perpendiculairement
- **Particularités**:
  - Peut sauter par-dessus d'autres pièces
  - Change toujours de couleur de case à chaque mouvement
  - Particulièrement fort dans les positions fermées
  - Vaut environ 3 pions en termes de force
- **Conseil**: Placez vos cavaliers vers le centre où ils contrôlent plus de cases

## Le Pion ♙♟

Les pions sont les soldats de l'échiquier - individuellement faibles mais collectivement puissants.

- **Mouvement**: 
  - Avance d'une case vers l'avant
  - Peut avancer de deux cases lors de son premier mouvement
  - Capture en diagonale vers l'avant (une case)
- **Particularités**:
  - Peut effectuer une prise "en passant" dans certaines situations
  - Peut être promu en n'importe quelle pièce (sauf roi) en atteignant la dernière rangée
  - La structure de pions détermine souvent la stratégie à long terme
- **Conseil**: Évitez de créer des pions doublés ou isolés sans compensation

## Règles importantes à retenir

- Une pièce ne peut pas se déplacer à travers une autre pièce (sauf le cavalier)
- Une pièce capture en prenant la place de la pièce adverse
- Le but du jeu est de mettre le roi adverse en échec et mat
- Un joueur ne peut pas faire un coup qui mettrait ou laisserait son propre roi en échec
        `,
        exercises: [
          {
            id: "knight-movement",
            title: "Mouvement du Cavalier",
            description: "Trouvez tous les mouvements possibles pour le cavalier",
            fen: "8/8/8/8/4N3/8/8/4K2k w - - 0 1",
            solution: ["e4c3", "e4c5", "e4d2", "e4d6", "e4f2", "e4f6", "e4g3", "e4g5"],
            hints: [
              "Le cavalier se déplace en forme de L",
              "Pensez à deux cases dans une direction, puis une perpendiculairement",
            ],
            explanation:
              "Le cavalier est la seule pièce qui peut sauter par-dessus d'autres pièces. Il se déplace toujours en formant un L : deux cases dans une direction (horizontale ou verticale) puis une case perpendiculairement.",
          },
          {
            id: "pawn-promotion",
            title: "Promotion du Pion",
            description: "Trouvez le meilleur coup pour le pion blanc",
            fen: "8/P7/8/8/8/8/8/4K2k w - - 0 1",
            solution: ["a7a8q"],
            hints: [
              "Le pion peut être promu en atteignant la dernière rangée",
              "La dame est généralement la meilleure pièce pour la promotion",
            ],
            explanation:
              "Lorsqu'un pion atteint la dernière rangée, il peut être promu en n'importe quelle pièce (sauf un roi). La dame étant la pièce la plus puissante, c'est généralement le meilleur choix.",
          },
        ],
        prerequisites: [],
        nextLessons: ["basic-checkmate"],
      },
      {
        id: "basic-checkmate",
        title: "Échec et mat de base",
        description: "Apprenez à reconnaître et à réaliser des mats simples",
        category: "basics",
        difficulty: "beginner",
        content: `
# Échec et mat de base

L'échec et mat est l'objectif ultime du jeu d'échecs. Comprendre les motifs de mat de base est essentiel pour tout joueur.

## Qu'est-ce que l'échec et mat?

Un échec et mat se produit lorsque:
1. Le roi est en échec (menacé de capture)
2. Il n'y a aucun coup légal pour sortir de l'échec

## Mat avec deux tours

Le mat avec deux tours est l'un des plus simples à exécuter:
- Les tours travaillent ensemble pour restreindre le roi adverse
- Une tour donne échec tandis que l'autre bloque les cases de fuite

## Mat de l'escalier

Ce mat utilise une tour pour pousser progressivement le roi adverse vers le bord de l'échiquier:
1. La tour donne échec, forçant le roi à reculer
2. Le roi de la partie gagnante avance en parallèle
3. La tour donne à nouveau échec
4. Ce processus continue jusqu'à ce que le roi adverse atteigne le bord
5. La tour donne alors un échec et mat final
        `,
        exercises: [
          {
            id: "two-rook-mate",
            title: "Mat avec deux tours",
            description: "Trouvez le coup qui donne échec et mat",
            fen: "8/8/8/8/8/1k6/8/KR5R w - - 0 1",
            solution: ["h1h3#"],
            hints: ["Utilisez une tour pour donner échec", "L'autre tour doit bloquer les cases de fuite"],
            explanation:
              "Dans cette position, en jouant Th3#, la tour donne échec au roi noir. Le roi ne peut pas s'échapper car l'autre tour contrôle la case b2, et le roi blanc contrôle les cases a2 et a3.",
          },
        ],
        prerequisites: ["piece-movements"],
        nextLessons: ["basic-tactics", "chess-notation"],
      },
      {
        id: "chess-notation",
        title: "Notation aux échecs",
        description: "Apprenez à lire et écrire la notation des coups d'échecs",
        category: "basics",
        difficulty: "beginner",
        content: `
# Notation aux échecs

La notation est un système d'écriture qui permet d'enregistrer les coups joués dans une partie d'échecs. Il existe plusieurs systèmes de notation, mais les deux plus courants sont la notation algébrique et la notation algébrique abrégée.

## Notation algébrique

La notation algébrique identifie chaque case de l'échiquier par une lettre (a-h) et un chiffre (1-8):

- Les colonnes sont désignées par les lettres a à h, de gauche à droite du point de vue des blancs
- Les rangées sont numérotées de 1 à 8, de bas en haut du point de vue des blancs

Par exemple, la case en bas à gauche est a1, et la case en haut à droite est h8.

## Notation des pièces

Chaque pièce est représentée par une lettre:

- R = Roi (K en anglais pour King)
- D = Dame (Q en anglais pour Queen)
- T = Tour (R en anglais pour Rook)
- F = Fou (B en anglais pour Bishop)
- C = Cavalier (N en anglais pour Knight)
- Les pions n'ont pas de lettre spécifique

## Notation des coups

Un coup est noté en indiquant:
1. La pièce qui se déplace (sauf pour les pions)
2. La case de destination

Exemples:
- e4 (un pion se déplace en e4)
- Cf3 (un cavalier se déplace en f3)
- Fb5 (un fou se déplace en b5)

## Symboles spéciaux

- x : capture (Cxe5 = le cavalier capture la pièce en e5)
- + : échec
- # : échec et mat
- 0-0 : petit roque
- 0-0-0 : grand roque
- = : promotion (e8=D = le pion en e8 est promu en dame)
        `,
        exercises: [
          {
            id: "read-notation",
            title: "Lire la notation",
            description: "Jouez le coup indiqué en notation algébrique",
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            solution: ["e2e4"],
            hints: ["e4 signifie déplacer un pion en e4", "Cherchez le pion blanc qui peut atteindre e4"],
            explanation:
              "Le coup e4 en notation algébrique signifie déplacer un pion sur la case e4. Dans la position initiale, c'est le pion en e2 qui peut atteindre e4 en un coup.",
          },
          {
            id: "write-notation",
            title: "Écrire la notation",
            description: "Quel est le nom du coup qui déplace le cavalier en f3?",
            fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
            solution: ["g1f3"],
            hints: [
              "Les cavaliers sont notés C en français (N en anglais)",
              "Identifiez le cavalier qui peut atteindre f3",
            ],
            explanation:
              "Le coup qui déplace le cavalier en f3 s'écrit Cf3 en notation algébrique. Dans cette position, c'est le cavalier en g1 qui peut atteindre f3.",
          },
        ],
        prerequisites: ["piece-movements"],
        nextLessons: ["basic-tactics"],
      },
    ],
  },
  // Les autres modules restent inchangés...
  {
    id: "tactics-module",
    title: "Tactiques fondamentales",
    description: "Maîtrisez les tactiques de base qui vous aideront à gagner des pièces et des parties",
    category: "tactics",
    difficulty: "beginner",
    order: 2,
    imageUrl: "/chessboard-in-thought.png",
    lessons: [
      {
        id: "basic-tactics",
        title: "Tactiques élémentaires",
        description: "Apprenez les tactiques de base comme les fourchettes et les clouages",
        category: "tactics",
        difficulty: "beginner",
        content: `
# Tactiques élémentaires aux échecs

Les tactiques sont des séquences de coups forcés qui apportent un avantage tangible. Voici les tactiques les plus fondamentales:

## La fourchette

Une fourchette se produit lorsqu'une pièce attaque simultanément deux cibles ou plus. Les pièces les plus efficaces pour les fourchettes sont:

- **Le cavalier**: Peut attaquer des pièces qui ne sont pas sur la même ligne
- **Le pion**: Particulièrement efficace pour attaquer deux pièces en diagonale
- **La dame**: Peut créer des fourchettes sur des lignes, colonnes et diagonales

## Le clouage

Un clouage se produit lorsqu'une pièce ne peut pas bouger car cela exposerait une pièce plus précieuse derrière elle (souvent le roi).

- **Clouage absolu**: La pièce clouée ne peut pas légalement bouger (car elle exposerait le roi à un échec)
- **Clouage relatif**: La pièce clouée peut bouger, mais cela entraînerait la perte d'une pièce plus précieuse

Les pièces qui peuvent créer des clouages sont les pièces à longue portée: fous, tours et dames.

## L'enfilade

L'enfilade est similaire au clouage, mais dans l'ordre inverse: une pièce de grande valeur est attaquée et forcée de bouger, exposant une pièce de moindre valeur derrière elle.
        `,
        exercises: [
          {
            id: "knight-fork",
            title: "Fourchette de cavalier",
            description: "Trouvez la fourchette de cavalier qui gagne du matériel",
            fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
            solution: ["f3e5"],
            hints: [
              "Cherchez un coup de cavalier qui attaque deux pièces à la fois",
              "Le cavalier peut capturer une pièce tout en attaquant une autre",
            ],
            explanation:
              "En jouant Cxe5, le cavalier blanc capture le pion e5 tout en attaquant le cavalier noir en c6. C'est une fourchette simple mais efficace qui permet de gagner une pièce.",
          },
          {
            id: "bishop-pin",
            title: "Clouage avec le fou",
            description: "Utilisez le fou pour créer un clouage efficace",
            fen: "rnbqkbnr/ppp2ppp/8/3pp3/8/5NP1/PPPPPPBP/RNBQK2R w KQkq - 0 1",
            solution: ["g2b7"],
            hints: [
              "Cherchez un coup de fou qui attaque une pièce avec le roi derrière",
              "Le clouage est plus efficace quand la pièce clouée est moins précieuse que celle derrière",
            ],
            explanation:
              "En jouant Fb7, le fou blanc attaque la dame noire en d5, qui ne peut pas bouger car elle protège le roi en e8. C'est un clouage relatif qui permet de gagner la dame ou de forcer un affaiblissement de la position noire.",
          },
        ],
        prerequisites: ["piece-movements"],
        nextLessons: ["intermediate-tactics", "double-attack"],
      },
      {
        id: "double-attack",
        title: "Double attaque et découverte",
        description: "Maîtrisez les tactiques avancées de double attaque et d'attaque à la découverte",
        category: "tactics",
        difficulty: "intermediate",
        content: `
# Double attaque et attaque à la découverte

Ces tactiques puissantes permettent d'attaquer simultanément plusieurs cibles et sont souvent décisives dans une partie.

## Double attaque

Une double attaque se produit lorsqu'un coup menace deux cibles différentes simultanément. Contrairement à la fourchette qui utilise une seule pièce, la double attaque peut impliquer plusieurs pièces.

Exemples de double attaque:
- Attaquer une pièce tout en menaçant un mat
- Créer une menace directe tout en démasquant une autre pièce qui attaque

## Attaque à la découverte

Une attaque à la découverte se produit lorsqu'une pièce se déplace et révèle une attaque d'une autre pièce située derrière elle.

Types d'attaques à la découverte:
- **Échec à la découverte**: Une pièce se déplace et révèle un échec d'une autre pièce
- **Double échec**: Une pièce donne échec en se déplaçant et révèle simultanément un autre échec
- **Attaque à la découverte sans échec**: Une pièce se déplace et révèle une attaque contre une pièce autre que le roi

## Pourquoi ces tactiques sont-elles si puissantes?

Ces tactiques sont particulièrement efficaces car l'adversaire ne peut généralement pas parer les deux menaces en un seul coup. Dans le cas d'un double échec, le roi doit obligatoirement se déplacer, ce qui rend cette tactique encore plus puissante.
        `,
        exercises: [
          {
            id: "discovered-check",
            title: "Échec à la découverte",
            description: "Trouvez l'échec à la découverte qui gagne du matériel",
            fen: "r3k2r/ppp2ppp/2n5/1B1pp1q1/1b1PP3/2N5/PPP2PPP/R2QK2R w KQkq - 0 1",
            solution: ["c3d5"],
            hints: [
              "Cherchez une pièce qui peut se déplacer et révéler une attaque d'une autre pièce",
              "Le cavalier peut capturer et révéler une attaque du fou",
            ],
            explanation:
              "En jouant Cxd5, le cavalier blanc capture le pion en d5 tout en révélant une attaque du fou b5 sur le roi noir en e8. C'est un échec à la découverte qui permet de gagner la dame noire en g5 au coup suivant.",
          },
          {
            id: "double-check",
            title: "Double échec",
            description: "Trouvez le double échec qui force le gain de matériel",
            fen: "r1bqk2r/ppp2ppp/2n5/3np3/1b1P4/2N2N2/PPP1BPPP/R1BQK2R w KQkq - 0 1",
            solution: ["d4e5"],
            hints: [
              "Cherchez un coup qui donne échec tout en révélant une autre pièce qui donne échec",
              "Le pion peut capturer et donner un double échec",
            ],
            explanation:
              "En jouant dxe5, le pion blanc capture le cavalier en e5 et donne échec au roi noir. Simultanément, il révèle une attaque du fou e2 sur le roi noir. C'est un double échec, et comme le roi doit obligatoirement se déplacer, les blancs pourront capturer la dame noire au coup suivant.",
          },
        ],
        prerequisites: ["basic-tactics"],
        nextLessons: ["intermediate-tactics"],
      },
    ],
  },
  // Autres modules...
]
