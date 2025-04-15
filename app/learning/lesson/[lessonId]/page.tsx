"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { LessonView } from "@/components/learning/lesson-view"
import { PageTransition } from "@/components/learning/page-transition"

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params?.lessonId as string

  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer l'ID du joueur du localStorage
    if (typeof window !== "undefined") {
      const playerId = localStorage.getItem("playerId")
      if (playerId) {
        setUserId(playerId)
        setLoading(false)
      } else {
        // Si aucun ID n'existe, rediriger vers la page d'apprentissage
        router.push("/learning")
      }
    }
  }, [router, lessonId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <PageTransition id={lessonId}>
          <LessonView lessonId={lessonId} userId={userId} />
        </PageTransition>
      </div>
    </main>
  )
}
