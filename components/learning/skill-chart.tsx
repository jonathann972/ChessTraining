"use client"

import { useEffect, useRef } from "react"
import type { LessonCategory } from "@/types/learning"

interface SkillChartProps {
  skills: Record<LessonCategory, number>
}

export function SkillChart({ skills }: SkillChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fonction pour dessiner le graphique radar
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Définir les dimensions du canvas
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) * 0.8

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height)

    // Dessiner les cercles concentriques
    const maxLevel = 10 // Niveau maximum
    for (let i = 1; i <= 5; i++) {
      const r = radius * (i / 5)
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.stroke()
    }

    // Définir les axes
    const categories = Object.keys(skills) as LessonCategory[]
    const numCategories = categories.length
    const angleStep = (Math.PI * 2) / numCategories

    // Dessiner les axes
    for (let i = 0; i < numCategories; i++) {
      const angle = i * angleStep - Math.PI / 2 // Commencer à midi
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
      ctx.stroke()

      // Ajouter les étiquettes
      const labelX = centerX + (radius + 20) * Math.cos(angle)
      const labelY = centerY + (radius + 20) * Math.sin(angle)

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Traduire les catégories
      const categoryLabels: Record<LessonCategory, string> = {
        basics: "Fondamentaux",
        tactics: "Tactiques",
        openings: "Ouvertures",
        strategy: "Stratégie",
        endgames: "Finales",
      }

      ctx.fillText(categoryLabels[categories[i]], labelX, labelY)
    }

    // Dessiner le polygone des compétences
    ctx.beginPath()
    for (let i = 0; i < numCategories; i++) {
      const angle = i * angleStep - Math.PI / 2
      const value = skills[categories[i]] / maxLevel // Normaliser entre 0 et 1
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fillStyle = "rgba(56, 189, 248, 0.2)" // cyan-400 avec transparence
    ctx.fill()
    ctx.strokeStyle = "rgb(56, 189, 248)" // cyan-400
    ctx.lineWidth = 2
    ctx.stroke()

    // Dessiner les points pour chaque compétence
    for (let i = 0; i < numCategories; i++) {
      const angle = i * angleStep - Math.PI / 2
      const value = skills[categories[i]] / maxLevel
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = "rgb(56, 189, 248)"
      ctx.fill()
      ctx.strokeStyle = "white"
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }, [skills])

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={300} height={300} className="max-w-full"></canvas>
    </div>
  )
}
