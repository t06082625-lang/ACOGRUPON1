'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, KeyRound, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/lib/actions'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password || !confirmPassword) {
      showMessage('error', 'Preencha todos os campos.')
      return
    }

    if (password !== confirmPassword) {
      showMessage('error', 'As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      showMessage('error', 'A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setIsLoading(true)
    const result = await resetPassword(email, password)
    setIsLoading(false)

    if (result.success) {
      showMessage('success', 'Senha alterada com sucesso! Redirecionando...')
      setTimeout(() => {
        router.push('/login') // Redireciona para o login após 2 segundos
      }, 2000)
    } else {
      showMessage('error', result.error || 'Erro ao redefinir senha.')
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
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

      <div className="w-full max-w-md bg-gradient-to-br from-card to-secondary/50 border border-border rounded-3xl p-8 shadow-xl relative">
        <Link href="/login" className="absolute top-6 left-6 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="text-center mb-8 pt-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Recuperar Senha
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digite seu e-mail cadastrado para criar uma nova senha
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">E-mail cadastrado</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@grupon1.com.br"
              className="bg-background/50 border-border h-12 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nova Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="No mínimo 6 caracteres"
              className="bg-background/50 border-border h-12 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Confirme a Nova Senha</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="bg-background/50 border-border h-12 rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl shadow-lg shadow-primary/20 mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Atualizando...' : 'Redefinir Senha'}
          </Button>
        </form>
      </div>

      <Image
        src="/images/logo-n1-white.png"
        alt="Grupo N1"
        width={120}
        height={60}
        className="object-contain mt-8 opacity-40"
        priority
      />
    </main>
  )
}