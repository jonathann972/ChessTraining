import ChessClient from "./chess-client"
import Link from "next/link"
import { Book } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 [text-shadow:_-1.5px_-1.5px_0_#000,_1.5px_-1.5px_0_#000,_-1.5px_1.5px_0_#000,_1.5px_1.5px_0_#000,_0_0_8px_rgba(0,0,0,0.3)] tracking-wide">
            Salle du temps
          </h1>
          <Link href="/learning">
            <button className="bg-[#1b74e4] hover:bg-[#1b6fd0] text-white py-2 px-4 rounded-lg flex items-center">
              <Book className="h-4 w-4 mr-2" />
              Mode Apprentissage
            </button>
          </Link>
        </div>
        <ChessClient />
      </div>
    </main>
  )
}
