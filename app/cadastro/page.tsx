'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus, Trash2, Save, FolderOpen, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveProgress, loadProgress, listProgress, deleteProgress } from '@/lib/actions'
import type { ExpandedItem, SteelProgress } from '@/lib/types'

function expandRange(input: string): string[] {
  const results: string[] = []
  const parts = input.split(',').map(p => p.trim())

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)A(\d+)$/i)
    
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10)
      const end = parseInt(rangeMatch[2], 10)
      const minVal = Math.min(start, end)
      const maxVal = Math.max(start, end)
      
      for (let i = minVal; i <= maxVal; i++) {
        results.push(i.toString())
      }
    } else if (part) {
      results.push(part)
    }
  }

  return results
}

export default function CadastroPage() {
  const [userId, setUserId] = useState<string>('')
  const [arquivoInput, setArquivoInput] = useState('')
  const [osInput, setOsInput] = useState('')
  const [items, setItems] = useState<ExpandedItem[]>([])
  const [progressName, setProgressName] = useState('')
  const [savedProgressList, setSavedProgressList] = useState<SteelProgress[]>([])
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const arquivoRef = useRef<HTMLInputElement>(null)

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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAddItem = () => {
    if (!arquivoInput.trim() || !osInput.trim()) {
      showMessage('error', 'Preencha ambos os campos')
      return
    }

    const expandedArquivos = expandRange(arquivoInput.trim())
    const newItems: ExpandedItem[] = expandedArquivos.map(arquivo => ({
      arquivo: `${arquivo}`,
      os: osInput.trim(),
      conferido: false
    }))

    setItems(prev => [...prev, ...newItems])
    setArquivoInput('')
    setOsInput('')
    arquivoRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem()
    }
  }

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    if (confirm('Deseja limpar todos os itens?')) {
      setItems([])
      setProgressName('')
    }
  }

  const handleSave = async () => {
    if (!progressName.trim()) {
      setShowSaveModal(true)
      return
    }

    setIsLoading(true)
    const result = await saveProgress(progressName.trim(), items, userId)
    setIsLoading(false)

    if (result.success) {
      showMessage('success', `Progresso "${progressName}" salvo com sucesso!`)
      setShowSaveModal(false)
      loadSavedProgressList()
    } else {
      showMessage('error', result.error || 'Erro ao salvar')
    }
  }

  const handleSaveWithName = async () => {
    if (!progressName.trim()) {
      showMessage('error', 'Digite um nome para o progresso')
      return
    }
    await handleSave()
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

  const handleDelete = async (name: string) => {
    if (!confirm(`Deseja excluir "${name}"?`)) return

    setIsLoading(true)
    const result = await deleteProgress(name, userId)
    setIsLoading(false)

    if (result.success) {
      showMessage('success', `Progresso "${name}" excluído!`)
      loadSavedProgressList()
    } else {
      showMessage('error', result.error || 'Erro ao excluir')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 no-print">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">Cadastrar Aço</h1>
              <p className="text-muted-foreground text-sm">
                {progressName ? `Editando: ${progressName}` : 'Novo cadastro'}
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
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg no-print ${
            message.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
          }`}>
            {message.text}
          </div>
        )}

        {/* Input Form */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                OS (ex: 1A5, 10, 20A25)
              </label>
              <Input
                ref={arquivoRef}
                value={arquivoInput}
                onChange={(e) => setArquivoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: 1A5"
                className="bg-input border-border"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome
              </label>
              <Input
                value={osInput}
                onChange={(e) => setOsInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Viga Principal"
                className="bg-input border-border"
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button onClick={handleAddItem} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <Button onClick={() => setShowSaveModal(true)} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button onClick={() => { loadSavedProgressList(); setShowLoadModal(true) }} variant="outline" className="border-border text-foreground hover:bg-secondary">
            <FolderOpen className="w-4 h-4 mr-2" />
            Carregar
          </Button>
          <Button onClick={handlePrint} variant="outline" className="border-border text-foreground hover:bg-secondary">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          {items.length > 0 && (
            <Button onClick={handleClearAll} variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground ml-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Tudo
            </Button>
          )}
        </div>

        {/* Items Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">OS</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Nome</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum item cadastrado. Adicione itens usando o formulário acima.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-secondary/50">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-mono text-primary">{item.arquivo}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{item.os}</td>
                      <td className="px-4 py-3 text-center no-print">
                        <Button
                          onClick={() => handleRemoveItem(index)}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {items.length > 0 && (
            <div className="px-4 py-3 bg-secondary border-t border-border">
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-primary">{items.length}</span> itens
              </p>
            </div>
          )}
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Salvar Progresso</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowSaveModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Progresso
                </label>
                <Input
                  value={progressName}
                  onChange={(e) => setProgressName(e.target.value)}
                  placeholder="Ex: Obra Centro - Lote 1"
                  className="bg-input border-border"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowSaveModal(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveWithName} 
                  className="flex-1 bg-primary text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
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
                    Nenhum progresso salvos
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
                        <Button
                          onClick={() => handleDelete(progress.name)}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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