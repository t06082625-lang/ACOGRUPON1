'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, ClipboardList, LogOut } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  
  // Estados para gerenciar o operador conectado
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  // Resgata os dados do operador salvos no localStorage ao carregar a página
  useEffect(() => {
    const storedEmail = localStorage.getItem('steel_user_id') // Pega o e-mail/ID logado
    if (storedEmail) {
      setUserEmail(storedEmail)
      // Extrai a primeira parte do e-mail para exibir como nome amigável (ex: LUIZ CARLOS)
      const namePart = storedEmail.split('@')[0].replace(/\./g, ' ').toUpperCase()
      setUserName(namePart)
    } else {
      // Se não houver operador logado, joga para a tela de login
      router.push('/login')
    }
  }, [router])

  const handleSignOut = () => {
    localStorage.removeItem('steel_user_id')
    setUserEmail(null)
    setUserName(null)
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 selection:bg-amber-500/30">
      
      {/* Título Principal - Grupo N1 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-wider text-white uppercase sm:text-4xl">
          GRUPO N1
        </h1>
        <p className="text-xs tracking-[0.3em] font-semibold text-[#f59e0b] uppercase mt-1">
          EMPREENDIMENTOS
        </p>
        <div className="w-16 h-[1px] bg-[#f59e0b] mx-auto mt-3 opacity-70" />
      </div>

      {/* Barra do Operador Conectado */}
      {userEmail && (
        <div className="bg-[#121214] border border-[#27272a] rounded-full px-5 py-2 flex items-center gap-3 text-sm text-[#a1a1aa] mb-10 shadow-lg max-w-full overflow-hidden text-ellipsis">
          <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
          <span className="truncate">
            Operador: <strong className="text-white font-medium">{userName}</strong>{' '}
            <span className="text-[#71717a] hidden sm:inline">({userEmail})</span>
          </span>
          <span className="text-[#27272a]">|</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      )}

      {/* Grid de Cards (Menu Principal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl px-4">
        
        {/* Card 1: Cadastrar Lotes */}
        <div 
          onClick={() => router.push('/cadastro')}
          className="group bg-[#121214] border border-[#27272a] hover:border-[#f59e0b]/40 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-full flex items-center justify-center mb-5 border border-[#f59e0b]/20 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-6 h-6 text-[#f59e0b]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Cadastrar Lotes
          </h3>
          <p className="text-sm text-[#71717a] max-w-[250px]">
            Cadastre novos itens de aço no seu banco de dados exclusivo.
          </p>
        </div>

        {/* Card 2: Conferir Estoque */}
        <div 
          onClick={() => router.push('/conferencia')}
          className="group bg-[#121214] border border-[#27272a] hover:border-[#f59e0b]/40 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-full flex items-center justify-center mb-5 border border-[#f59e0b]/20 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-6 h-6 text-[#f59e0b]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Conferir Estoque
          </h3>
          <p className="text-sm text-[#71717a] max-w-[250px]">
            Abra e confira suas peças através do buscador inteligente.
          </p>
        </div>

      </div>

    </main>
  )
}