'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, FolderOpen, Printer, Check, X, Search, Package, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadProgress, listProgress, saveProgress } from '@/lib/actions'
import type { ExpandedItem, SteelProgress } from '@/lib/types'

export default function ConferenciaPage() {
  const [userId, setUserId] = useState<string>('')
  const [items, setItems] = useState<ExpandedItem[]>([])
  const [progressName, setProgressName] = useState('')
  const [savedProgressList, setSavedProgressList] = useState<SteelProgress[]>([])
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastMarked, setLastMarked] = useState<ExpandedItem | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Resgata o e-mail do usuário do localStorage ao montar a página
  useEffect(() => {
    const storedUser = localStorage.getItem('steel_user_id')
    if (storedUser) {
      setUserId(storedUser)
    }
  }, [])

  const loadSavedProgressList = useCallback(async () => {
    if (!userId) return
    const result = await listProgress(userId)
    if (result.success && result.data) {
      setSavedProgressList(result.data)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadSavedProgressList()
    }
  }, [userId, loadSavedProgressList])

  useEffect(() => {
    if (items.length > 0 && searchRef.current) {
      searchRef.current.focus()
    }
  }, [items.length])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleLoad = async (name: string) => {
    setIsLoading(true)
    const result = await loadProgress(name, userId)
    setIsLoading(false)

    if (result.success && result.data) {
      setItems(result.data.items?.map(item => ({
        arquivo: item.arquivo,
        os: item.os,
        conferido: item.conferido
      })) || [])
      setProgressName(name)
      setShowLoadModal(false)
      showMessage('success', `Progresso "${name}" carregado!`)
    } else {
      showMessage('error', result.error || 'Erro ao carregar')
    }
  }

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    const searchTerm = searchInput.trim().toUpperCase()
    const normalizedSearch = searchTerm.replace(/[^A-Z0-9]/g, '')
    const match = normalizedSearch.match(/^(.+?)(\d+)$/)
    
    if (!match) {
      showMessage('error', 'Formato inválido. Use NOME + NÚMERO (ex: 0281, 028D3)')
      return
    }
    
    const [, nomeBusca, osNumBusca] = match
    const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const extractOsNumber = (value: string) => {
      const clean = normalize(value).replace(/^HOME/, '')
      return clean.match(/\d+$/)?.[0] ?? clean
    }
    const matchesItem = (item: ExpandedItem) => {
      // Cadastro: arquivo = nome (ex.: 028D) e os = número (ex.: 3).
      // A checagem também aceita dados antigos invertidos.
      const arquivo = normalize(item.arquivo)
      const os = normalize(item.os)
      const arquivoOs = extractOsNumber(item.arquivo)
      const osOs = extractOsNumber(item.os)
      return (
        (arquivo === nomeBusca && osOs === osNumBusca) ||
        (os === nomeBusca && arquivoOs === osNumBusca)
      )
    }

    const index = items.findIndex(item => matchesItem(item) && !item.conferido)

    if (index !== -1) {
      const newItems = [...items]
      newItems[index].conferido = true
      setItems(newItems)
      setLastMarked(newItems[index])

      if (progressName) {
        await saveProgress(progressName, newItems, userId)
      }

      showMessage('success', `${newItems[index].arquivo} - ${newItems[index].os} conferido!`)
      setSearchInput('')
      searchRef.current?.focus()
    } else {
      const alreadyChecked = items.find(item => matchesItem(item) && item.conferido)
      
      if (alreadyChecked) {
        showMessage('error', `"${searchTerm}" já foi conferido`)
      } else {
        showMessage('error', `"${searchTerm}" não encontrado`)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleToggleItem = async (index: number) => {
    const newItems = [...items]
    newItems[index].conferido = !newItems[index].conferido
    setItems(newItems)

    if (progressName) {
      await saveProgress(progressName, newItems, userId)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const conferidos = items.filter(item => item.conferido).length
  const pendentes = items.length - conferidos
  const percentual = items.length > 0 ? Math.round((conferidos / items.length) * 100) : 0

  return (
    <main className="min-h-screen bg-background">
      {/* Print Header */}
      <div className="hidden print:block print:mb-6">
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold">GRUPO N1 EMPREENDIMENTOS</h1>
          <p className="text-lg">Conferência de Estoque - {progressName}</p>
          <p className="text-sm text-gray-600">
            Data: {new Date().toLocaleDateString('pt-BR')} | 
            Total: {items.length} | Conferidos: {conferidos} | Pendentes: {pendentes}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 no-print">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Conferir Estoque
              </h1>
              <p className="text-muted-foreground">
                {progressName ? `Conferindo: ${progressName}` : 'Selecione um progresso para conferir'}
              </p>
            </div>
          </div>
          <Image
            src="/images/logo-n1-white.png"
            alt="Grupo N1"
            width={140}
            height={70}
            className="object-contain hidden md:block"
            priority
          />
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-sm flex items-center gap-3 animate-in slide-in-from-right ${
            message.type === 'success' 
              ? 'bg-primary/90 text-primary-foreground border-primary' 
              : 'bg-destructive/90 text-destructive-foreground border-destructive'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Load Button - Initial State */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-gradient-to-br from-card to-secondary/50 border border-border rounded-3xl p-12 text-center shadow-xl">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Nenhum Progresso Carregado</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Carregue um progresso salvo para iniciar a conferência do estoque de aço
              </p>
              <Button 
                onClick={() => { loadSavedProgressList(); setShowLoadModal(true) }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/20"
                size="lg"
              >
                <FolderOpen className="w-6 h-6 mr-3" />
                Carregar Progresso
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {items.length > 0 && (
          <div className="space-y-6">
            {/* Search Section */}
            <div className="bg-gradient-to-br from-card to-secondary/30 border border-border rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Buscar e Conferir</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Digite o NOME + NÚMERO DA OS (ex: 0281 = nome &quot;028&quot; + OS &quot;1&quot;) e pressione Enter
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    ref={searchRef}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: 0281, 028D3, 02915..."
                    className="bg-background/50 border-border text-lg h-14 pl-4 pr-4 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-xl shadow-lg shadow-primary/20"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Conferir
                </Button>
              </div>
              {lastMarked && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Último conferido:</span>{' '}
                    <span className="font-semibold text-primary">{lastMarked.arquivo}</span>{' '}
                    <span className="text-foreground">- {lastMarked.os}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-card to-secondary/30 border border-border rounded-2xl p-5 text-center shadow-lg">
                <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-4xl font-bold text-primary">{items.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Total de Itens</p>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-5 text-center shadow-lg">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-4xl font-bold text-primary">{conferidos}</p>
                <p className="text-sm text-muted-foreground mt-1">Conferidos</p>
              </div>
              <div className="bg-gradient-to-br from-card to-secondary/30 border border-destructive/30 rounded-2xl p-5 text-center shadow-lg">
                <Clock className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="text-4xl font-bold text-destructive">{pendentes}</p>
                <p className="text-sm text-muted-foreground mt-1">Pendentes</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gradient-to-br from-card to-secondary/30 border border-border rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-foreground">Progresso da Conferência</span>
                <span className="text-lg font-bold text-primary">{percentual}%</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${percentual}%` }}
                />
              </div>
              {percentual === 100 && (
                <p className="text-sm text-primary mt-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Conferência concluída!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => { loadSavedProgressList(); setShowLoadModal(true) }}
                variant="outline" 
                className="border-border text-foreground hover:bg-secondary hover:border-primary/50 rounded-xl"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Carregar Outro
              </Button>
              <Button 
                onClick={handlePrint} 
                variant="outline" 
                className="border-border text-foreground hover:bg-secondary hover:border-primary/50 rounded-xl"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Lista
              </Button>
            </div>

            {/* Items Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/80">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-foreground w-16">#</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">OS</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Nome</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-foreground w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, index) => (
                      <tr 
                        key={index} 
                        className={`transition-all duration-300 ${
                          item.conferido 
                            ? 'bg-gradient-to-r from-primary/20 to-primary/5' 
                            : 'hover:bg-secondary/30'
                        }`}
                      >
                        <td className="px-4 py-4 text-sm text-muted-foreground font-mono">{index + 1}</td>
                        <td className={`px-4 py-4 text-sm font-mono font-semibold ${
                          item.conferido ? 'text-primary' : 'text-foreground'
                        }`}>
                          {item.arquivo}
                        </td>
                        <td className={`px-4 py-4 text-sm ${
                          item.conferido ? 'text-primary/80' : 'text-foreground'
                        }`}>
                          {item.os}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggleItem(index)}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                              item.conferido
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                                : 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary'
                            }`}
                          >
                            {item.conferido ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Load Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Carregar Progresso</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowLoadModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="overflow-y-auto flex-1">
                {savedProgressList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum progresso salvo
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedProgressList.map((progress) => (
                      <div 
                        key={progress.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80"
                      >
                        <button
                          onClick={() => handleLoad(progress.name)}
                          className="flex-1 text-left"
                        >
                          <p className="font-medium text-foreground">{progress.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Atualizado: {new Date(progress.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
