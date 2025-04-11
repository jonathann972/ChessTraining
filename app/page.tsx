import ChessClient from "./chess-client"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1a1a1a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-cyan-400 [text-shadow:_-1.5px_-1.5px_0_#000,_1.5px_-1.5px_0_#000,_-1.5px_1.5px_0_#000,_1.5px_1.5px_0_#000,_0_0_8px_rgba(0,0,0,0.3)] tracking-wide">
          Salle du temps
        </h1>
        <ChessClient />
      </div>
    </main>
  )
}
