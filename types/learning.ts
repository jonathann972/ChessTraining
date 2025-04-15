// Types pour le système d'apprentissage
export type LessonCategory = "basics" | "openings" | "tactics" | "strategy" | "endgames"

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert"

export interface LessonProgress {
  completed: boolean
  score: number
  attempts: number
  lastAttempt: string | null
}

export interface Exercise {
  id: string
  title: string
  description: string
  fen: string
  solution: string[]
  hints: string[]
  explanation: string
}

export interface Lesson {
  id: string
  title: string
  description: string
  category: LessonCategory
  difficulty: DifficultyLevel
  content: string
  exercises: Exercise[]
  prerequisites: string[]
  nextLessons: string[]
}

export interface LearningModule {
  id: string
  title: string
  description: string
  category: LessonCategory
  difficulty: DifficultyLevel
  lessons: Lesson[]
  order: number
  imageUrl?: string
}

export interface UserProgress {
  userId: string
  completedLessons: Record<string, LessonProgress>
  skillLevels: Record<LessonCategory, number>
  lastActivity: string
  totalExercisesCompleted: number
  streakDays: number
  lastStreak: string
}
