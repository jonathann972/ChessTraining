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
# Mouvements des pièces d'échecs

Chaque pièce aux échecs a son propre mouvement unique. Comprendre ces mouvements est la première étape pour maîtriser le jeu.

## Le Roi
- Se déplace d'une case dans n'importe quelle direction
- Ne peut jamais se mettre en échec
- Peut effectuer un roque avec une tour sous certaines conditions

## La Dame (Reine)
- La pièce la plus puissante
- Se déplace en ligne droite horizontalement, verticalement ou en diagonale
- Peut se déplacer d'autant de cases que souhaité tant que le chemin est libre

## La Tour
- Se déplace horizontalement ou verticalement
- Peut se déplacer d'autant de cases que souhaité tant que le chemin est libre
- Participe au roque avec le roi

## Le Fou
- Se déplace en diagonale uniquement
- Reste toujours sur la même couleur de case
- Peut se déplacer d'autant de cases que souhaité tant que le chemin est libre

## Le Cavalier
- La seule pièce qui peut sauter par-dessus d'autres pièces
- Se déplace en "L" : deux cases dans une direction puis une case perpendiculairement
- Toujours change de couleur de case

## Le Pion
- Se déplace d'une case vers l'avant
- Peut avancer de deux cases lors de son premier mouvement
- Capture en diagonale vers l'avant
- Peut effectuer une prise "en passant" dans certaines situations
- Peut être promu en n'importe quelle pièce (sauf roi) en atteignant la dernière rangée
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
  {
    id: "openings-module",
    title: "Principes d'ouverture",
    description: "Apprenez les principes fondamentaux des ouvertures et quelques lignes classiques",
    category: "openings",
    difficulty: "beginner",
    order: 3,
    imageUrl: "/chess-opening-diagram.png",
    lessons: [
      {
        id: "opening-principles",
        title: "Principes d'ouverture",
        description: "Maîtrisez les principes fondamentaux qui guident le début de partie",
        category: "openings",
        difficulty: "beginner",
        content: `
# Principes fondamentaux des ouvertures

Une bonne ouverture pose les bases d'une partie réussie. Voici les principes clés à suivre:

## 1. Contrôler le centre

Les quatre cases centrales (d4, d5, e4, e5) sont stratégiquement importantes:
- Elles permettent à vos pièces de se déplacer plus efficacement
- Elles limitent la mobilité des pièces adverses
- Elles servent de base pour des attaques sur les deux ailes

## 2. Développer les pièces rapidement

- Sortez vos cavaliers et vos fous en premier
- Évitez de déplacer plusieurs fois la même pièce dans l'ouverture
- Développez les pièces vers des cases actives où elles contrôlent plus de terrain

## 3. Mettre le roi en sécurité

- Le roque est généralement la meilleure façon de protéger votre roi
- Essayez de roquer dans les 7-10 premiers coups
- Évitez d'affaiblir la structure de pions autour de votre roi

## 4. Connecter les tours

- Une fois que vous avez développé vos pièces mineures et roqué, connectez vos tours
- Placez-les sur des colonnes ouvertes ou semi-ouvertes quand c'est possible

## 5. Éviter les mouvements de pions inutiles

- Chaque mouvement de pion crée des faiblesses permanentes
- Ne déplacez les pions que pour contrôler le centre, développer des pièces ou créer des menaces concrètes
        `,
        exercises: [
          {
            id: "center-control",
            title: "Contrôle du centre",
            description: "Trouvez le meilleur coup pour contrôler le centre",
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            solution: ["e2e4", "d2d4"],
            hints: [
              "Les pions centraux sont généralement les meilleurs premiers coups",
              "e4 et d4 sont les coups les plus populaires pour commencer une partie",
            ],
            explanation:
              "Les coups e4 et d4 sont les meilleurs premiers coups car ils contrôlent immédiatement des cases centrales importantes, libèrent des pièces (fou et dame), et préparent le développement rapide des autres pièces.",
          },
          {
            id: "piece-development",
            title: "Développement des pièces",
            description: "Choisissez le meilleur coup pour développer vos pièces",
            fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
            solution: ["g8f6", "e7e5"],
            hints: [
              "Répondez au contrôle du centre par votre propre contrôle du centre",
              "Développer un cavalier vers le centre est aussi un bon choix",
            ],
            explanation:
              "Après e4, les deux meilleurs coups pour les noirs sont e5 (contrôlant immédiatement le centre) ou Cf6 (développant une pièce tout en attaquant e4). Ces deux coups suivent les principes d'ouverture en contestant le centre et en développant les pièces.",
          },
        ],
        prerequisites: ["piece-movements"],
        nextLessons: ["common-openings", "italian-game"],
      },
      {
        id: "italian-game",
        title: "Le jeu italien",
        description: "Apprenez l'une des ouvertures les plus classiques et populaires",
        category: "openings",
        difficulty: "beginner",
        content: `
# Le jeu italien

Le jeu italien (ou partie italienne) est l'une des ouvertures les plus anciennes et les plus populaires aux échecs. Elle commence par les coups:

1. e4 e5
2. Cf3 Cc6
3. Fc4

## Idées principales

Le jeu italien vise à:
- Développer rapidement les pièces
- Contrôler le centre
- Viser le point f7, qui est une faiblesse naturelle dans la position noire

## Variantes principales

### La partie Giuoco Piano (le "jeu tranquille")

Après 3...Fc5, on obtient la position Giuoco Piano. Les blancs peuvent continuer par:
- 4. c3 (prépare d4 pour renforcer le centre)
- 4. 0-0 (roque pour mettre le roi en sécurité)
- 4. d3 (approche plus modeste mais solide)

### La défense des deux cavaliers

Après 3...Cf6, on obtient la défense des deux cavaliers. Les blancs ont plusieurs options:
- 4. Cg5 (l'attaque Fried Liver, très agressive)
- 4. d3 (plus tranquille, préparant un développement harmonieux)
- 4. d4 (cherchant à ouvrir immédiatement le centre)

## Avantages du jeu italien

- Développement naturel des pièces
- Positions claires et compréhensibles
- Bonnes opportunités d'attaque
- Convient à tous les niveaux de jeu
        `,
        exercises: [
          {
            id: "italian-continuation",
            title: "Continuation dans le jeu italien",
            description: "Trouvez le meilleur coup pour les blancs dans cette position du jeu italien",
            fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
            solution: ["c2c3", "d2d3", "e1g1"],
            hints: [
              "Pensez aux principes d'ouverture: développement, contrôle du centre, sécurité du roi",
              "Plusieurs coups sont bons ici, mais ils doivent suivre les principes",
            ],
            explanation:
              "Dans cette position du jeu italien (Giuoco Piano), les blancs ont plusieurs bons coups: c3 (préparant d4 pour renforcer le centre), d3 (développement solide) ou 0-0 (mettant le roi en sécurité). Tous ces coups suivent les principes d'ouverture et maintiennent l'équilibre.",
          },
          {
            id: "italian-trap",
            title: "Éviter un piège dans le jeu italien",
            description: "Trouvez le meilleur coup pour les noirs après 1.e4 e5 2.Cf3 Cc6 3.Fc4 Cf6 4.Cg5",
            fen: "r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 1",
            solution: ["d7d5"],
            hints: [
              "Les blancs menacent f7 avec Cxf7",
              "Vous devez contrer cette menace tout en développant votre jeu",
            ],
            explanation:
              "Après 4.Cg5, les blancs menacent d'attaquer f7 avec Cxf7. Le meilleur coup pour les noirs est d5, qui contre-attaque le fou en c4 tout en ouvrant des lignes pour les pièces noires. Ce coup lance la défense des deux cavaliers, variante principale du jeu italien.",
          },
        ],
        prerequisites: ["opening-principles"],
        nextLessons: ["common-openings"],
      },
    ],
  },
  {
    id: "strategy-module",
    title: "Stratégie du milieu de partie",
    description: "Développez votre compréhension stratégique pour le milieu de partie",
    category: "strategy",
    difficulty: "intermediate",
    order: 4,
    imageUrl: "/strategic-chessboard.png",
    lessons: [
      {
        id: "pawn-structure",
        title: "Structure de pions",
        description: "Apprenez l'importance de la structure de pions et comment l'utiliser",
        category: "strategy",
        difficulty: "intermediate",
        content: `
# Structure de pions

La structure de pions est souvent décrite comme le "squelette" de la position d'échecs. Elle détermine le caractère de la position et influence grandement votre plan stratégique.

## Pions isolés

Un pion isolé est un pion qui n'a pas de pions alliés sur les colonnes adjacentes.

**Avantages:**
- Contrôle des cases centrales
- Peut créer de l'espace pour vos pièces
- Parfois utile pour ouvrir des lignes

**Inconvénients:**
- Faiblesse potentielle à long terme
- Nécessite une défense active
- Peut devenir une cible d'attaque

## Pions doublés

Les pions doublés sont deux pions de la même couleur sur la même colonne.

**Inconvénients:**
- Mobilité réduite
- Contrôlent moins de cases qu'un seul pion
- Peuvent créer des cases faibles

**Avantages potentiels:**
- Peuvent ouvrir des lignes pour les pièces
- Parfois utiles pour contrôler des cases importantes

## Chaîne de pions

Une chaîne de pions est une diagonale de pions qui se protègent mutuellement.

**Avantages:**
- Structure solide et difficile à attaquer
- Contrôle de l'espace
- Base solide pour une attaque

**Comment jouer avec une chaîne de pions:**
- Attaquez à la base de la chaîne
- Jouez sur l'aile où vous avez un avantage d'espace
- Utilisez la chaîne comme un "bélier" pour avancer dans la position adverse
        `,
        exercises: [
          {
            id: "isolated-pawn",
            title: "Jouer avec un pion isolé",
            description: "Trouvez le meilleur plan avec un pion isolé",
            fen: "r1bq1rk1/pp3ppp/2n1pn2/2Pp4/3P4/2N1PN2/PP3PPP/R1BQK2R w KQ - 0 1",
            solution: ["c1g5"],
            hints: [
              "Avec un pion isolé, il faut jouer activement",
              "Développez vos pièces pour maximiser leur activité",
            ],
            explanation:
              "Dans cette position, les blancs ont un pion isolé en d4. Le meilleur plan est de jouer activement avec les pièces, en les plaçant sur des cases où elles exercent une pression maximale. Fg5 développe le fou tout en épinglant le cavalier f6, ce qui augmente la pression sur la position noire.",
          },
        ],
        prerequisites: ["opening-principles"],
        nextLessons: ["piece-coordination", "weak-squares"],
      },
      {
        id: "weak-squares",
        title: "Cases faibles et avant-postes",
        description: "Apprenez à identifier et exploiter les cases faibles dans la position adverse",
        category: "strategy",
        difficulty: "intermediate",
        content: `
# Cases faibles et avant-postes

L'identification et l'exploitation des cases faibles est un concept stratégique fondamental aux échecs.

## Qu'est-ce qu'une case faible?

Une case faible est une case qui ne peut plus être défendue par un pion et qui peut être occupée par une pièce adverse. Les cases faibles se créent généralement suite à des mouvements de pions.

Caractéristiques d'une case faible:
- Ne peut pas être défendue par un pion
- Souvent située près du centre ou dans le camp adverse
- Peut servir de point d'appui pour les pièces adverses

## Avant-postes

Un avant-poste est une case avancée, généralement dans le camp adverse, où une pièce peut s'installer en toute sécurité sans risque d'être chassée par un pion.

Les meilleurs avant-postes sont:
- Protégés par un pion
- Situés profondément dans le camp adverse
- Difficiles à attaquer

## Comment exploiter les cases faibles?

1. **Identifier les cases faibles** dans la position adverse
2. **Placer vos pièces sur ces cases**, en particulier les cavaliers
3. **Utiliser ces cases comme base** pour lancer des attaques
4. **Empêcher l'adversaire de corriger** ses faiblesses

## Comment éviter de créer des cases faibles?

1. **Limiter les mouvements de pions** inutiles
2. **Maintenir une structure de pions flexible**
3. **Anticiper les poussées de pions adverses** qui pourraient créer des cases faibles
4. **Échanger les pièces adverses** qui occupent vos cases faibles
        `,
        exercises: [
          {
            id: "identify-weak-square",
            title: "Identifier une case faible",
            description: "Trouvez la meilleure case pour placer votre cavalier",
            fen: "r1bq1rk1/pp3ppp/2n1p3/3p4/3P4/2NBP3/PP3PPP/R1BQK2R w KQ - 0 1",
            solution: ["c3e2", "c3b5"],
            hints: [
              "Cherchez une case qui ne peut pas être attaquée par un pion adverse",
              "Les cavaliers sont particulièrement efficaces sur les avant-postes",
            ],
            explanation:
              "Dans cette position, la case e5 est une case faible pour les noirs car elle ne peut plus être défendue par un pion. Le cavalier blanc peut s'y rendre via e2 ou b5, créant un puissant avant-poste au centre de l'échiquier. De là, il contrôlera de nombreuses cases importantes et exercera une pression sur la position noire.",
          },
          {
            id: "exploit-weak-square",
            title: "Exploiter une case faible",
            description: "Trouvez le coup qui exploite au mieux la faiblesse dans la position adverse",
            fen: "r2q1rk1/1pp2ppp/p1n1pn2/3p4/1b1P4/1PN1PN2/1P2BPPP/R1BQ1RK1 w - - 0 1",
            solution: ["c3d5"],
            hints: [
              "Identifiez la case faible dans la position noire",
              "Cherchez un coup qui occupe cette case faible",
            ],
            explanation:
              "La case d5 est une case faible dans la position noire. En jouant Cxd5, les blancs occupent cette case centrale et créent des menaces contre les pièces noires. Après l'échange, le cavalier blanc restera solidement installé en d5, contrôlant des cases importantes et servant de base pour de futures opérations.",
          },
        ],
        prerequisites: ["pawn-structure"],
        nextLessons: ["piece-coordination"],
      },
    ],
  },
  {
    id: "endgames-module",
    title: "Finales essentielles",
    description: "Maîtrisez les finales fondamentales que tout joueur devrait connaître",
    category: "endgames",
    difficulty: "intermediate",
    order: 5,
    imageUrl: "/focused-chess-endgame.png",
    lessons: [
      {
        id: "king-pawn-endgames",
        title: "Finales Roi et Pion",
        description: "Apprenez les principes des finales de roi et pion",
        category: "endgames",
        difficulty: "intermediate",
        content: `
# Finales Roi et Pion

Les finales de roi et pion sont parmi les plus fondamentales aux échecs. Comprendre ces finales est essentiel pour tout joueur souhaitant progresser.

## L'opposition

L'opposition est un concept clé dans les finales de roi et pion. Elle se produit lorsque les rois se font face avec un nombre impair de cases entre eux.

**Opposition directe:** Les rois sont sur la même rangée ou colonne.
**Opposition diagonale:** Les rois sont sur une diagonale.

Le joueur qui n'a pas le trait (qui ne doit pas jouer) a l'opposition. C'est généralement un avantage car l'autre joueur doit céder du terrain.

## La règle du carré

Pour déterminer si un roi peut rattraper un pion adverse:
1. Tracez un carré imaginaire du pion à la case de promotion
2. Si le roi peut entrer dans ce carré en un coup, il peut rattraper le pion
3. Sinon, le pion peut être promu

## Positions clés

**Finale Roi et Pion contre Roi:**
- Si le roi défenseur peut atteindre la case de promotion ou se placer devant le pion, c'est généralement nul
- Si le roi attaquant peut soutenir l'avance du pion, c'est généralement gagné

**Pion de tour:**
- Ces finales sont souvent nulles même avec un pion d'avance
- Le roi défenseur doit atteindre le coin de la couleur de la case de promotion
        `,
        exercises: [
          {
            id: "opposition-exercise",
            title: "Utiliser l'opposition",
            description: "Utilisez l'opposition pour gagner la finale",
            fen: "8/8/8/8/5k2/8/4P3/4K3 w - - 0 1",
            solution: ["e1d2"],
            hints: [
              "Essayez de prendre l'opposition pour avancer votre roi",
              "Le but est de soutenir l'avance du pion avec votre roi",
            ],
            explanation:
              "Dans cette position, en jouant Rd2, les blancs prennent l'opposition diagonale. Si le roi noir s'approche du pion, le roi blanc peut prendre l'opposition directe. Cette technique permet aux blancs de soutenir l'avance du pion jusqu'à la promotion.",
          },
        ],
        prerequisites: ["piece-movements", "basic-checkmate"],
        nextLessons: ["rook-endgames", "square-rule"],
      },
      {
        id: "square-rule",
        title: "La règle du carré",
        description: "Apprenez à déterminer si un roi peut rattraper un pion",
        category: "endgames",
        difficulty: "intermediate",
        content: `
# La règle du carré

La règle du carré est une technique simple mais puissante pour déterminer si un roi peut rattraper un pion adverse qui avance vers la promotion.

## Comment appliquer la règle du carré

1. Tracez un carré imaginaire depuis le pion jusqu'à sa case de promotion
2. Le côté du carré est égal au nombre de cases que le pion doit parcourir
3. Si le roi défenseur peut entrer dans ce carré en un coup, il peut rattraper le pion
4. Si le roi est hors du carré et ne peut pas y entrer en un coup, le pion peut être promu

## Exemple pratique

Si un pion blanc est en a2 et veut avancer vers a8:
- Le pion doit parcourir 6 cases (de a2 à a8)
- Le carré s'étend donc de a2 à g8 (6 cases de côté)
- Si le roi noir est à l'intérieur de ce carré ou peut y entrer en un coup, il peut rattraper le pion
- Sinon, le pion blanc peut être promu

## Ajustements à la règle

- Si c'est au tour du pion de jouer, le carré est plus grand d'une case
- Si le pion peut avancer de deux cases (premier coup), le carré est plus grand d'une case
- Si le roi attaquant peut aider son pion, la situation devient plus complexe

## Importance pratique

Cette règle est essentielle pour:
- Évaluer rapidement si une finale est gagnée ou nulle
- Décider s'il faut échanger des pièces pour entrer dans une finale de pions
- Calculer si votre roi peut rattraper un pion passé adverse
        `,
        exercises: [
          {
            id: "square-rule-basic",
            title: "Application de la règle du carré",
            description: "Déterminez si le roi peut rattraper le pion",
            fen: "8/8/8/8/1P6/8/1K6/3k4 w - - 0 1",
            solution: ["b4b5"],
            hints: [
              "Appliquez la règle du carré pour voir si le roi peut rattraper le pion",
              "Le pion doit avancer pour tester si le roi peut l'attraper",
            ],
            explanation:
              "En jouant b5, le pion blanc avance vers la promotion. En appliquant la règle du carré, on voit que le roi noir est en dehors du carré imaginaire (qui s'étendrait de b5 à g8). Le roi noir ne peut donc pas rattraper le pion, et les blancs peuvent promouvoir leur pion et gagner la partie.",
          },
          {
            id: "square-rule-advanced",
            title: "Cas limite de la règle du carré",
            description: "Déterminez si le roi peut rattraper le pion dans cette position critique",
            fen: "8/8/8/8/8/5K2/4P3/7k w - - 0 1",
            solution: ["e2e4"],
            hints: [
              "Le pion peut avancer de deux cases pour son premier coup",
              "Cela affecte la taille du carré imaginaire",
            ],
            explanation:
              "En jouant e4 (avançant de deux cases), le pion blanc crée un carré plus petit que si on jouait e3. Le roi noir est juste à la limite du carré imaginaire et ne peut pas rattraper le pion. Cette position montre l'importance de considérer la possibilité d'avancer de deux cases pour un pion qui n'a pas encore bougé.",
          },
        ],
        prerequisites: ["king-pawn-endgames"],
        nextLessons: ["rook-endgames"],
      },
    ],
  },
]
