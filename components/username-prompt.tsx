"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface UsernamePromptProps {
  isOpen: boolean
  onClose: (username?: string) => void
  defaultUsername?: string
}

export function UsernamePrompt({ isOpen, onClose, defaultUsername = "" }: UsernamePromptProps) {
  const [username, setUsername] = useState(defaultUsername)

  useEffect(() => {
    if (isOpen) {
      setUsername(defaultUsername)
    }
  }, [isOpen, defaultUsername])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose(username.trim() || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md rounded-lg shadow-xl bg-[#1e1e1e] overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mx-auto mb-6">
            <User className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-xl font-bold text-center text-white mb-4">Comment souhaitez-vous vous appeler?</h2>

          <p className="text-gray-300 text-sm mb-6 text-center">
            Votre pseudo sera utilisé dans le classement en ligne des joueurs.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre pseudo"
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                maxLength={20}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Ce nom apparaîtra dans le classement des joueurs et sera sauvegardé en ligne.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 py-2 rounded-md flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-md flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Check className="h-4 w-4" />
                Confirmer
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
