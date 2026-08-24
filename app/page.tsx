'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ClipboardList, Package, ArrowRight, LogOut, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [step, setStep] = useState<'login' | 'register' | 'forgot' | 'verify' | 'verify_forgot'>('login')
  
  // Inputs de formulário
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleAuthSubmit = async (type: 'login' | 'register' | 'forgot') => {
    setMessage('')
    setSuccessMessage('')

    if (!email.trim() || !password.trim()) {
      setMessage('Preencha todos os campos obrigatórios.')
      return
    }

    const supabase = createClient()
    if (type === 'register') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` },
      })
      if (error) setMessage(error.message)
      else {
        setSuccessMessage('Enviamos um código de confirmação para seu e-mail.')
        setStep('verify')
      }
    } else if (type === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/reset-password`,
      })
      if (error) setMessage('Não foi possível enviar o código. Tente novamente.')
      else { setSuccessMessage('Enviamos as instruções para seu e-mail.'); setStep('verify_forgot') }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setMessage(error.message.includes('Email not confirmed') ? 'Confirme seu e-mail antes de entrar.' : 'E-mail ou senha inválidos.')
      else setUserEmail(data.user.email ?? null)
    }
  }

  const handleVerifyCode = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' })
    if (error) setMessage('Código inválido ou expirado. Solicite um novo código.')
    else { setUserEmail(data.user?.email ?? email); clearForm() }
  }

  const handleVerifyForgotCode = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' })
    if (error) { setMessage('Código inválido ou expirado.'); return }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) setMessage('Não foi possível atualizar a senha.')
    else { setSuccessMessage('Senha atualizada com sucesso! Faça o login.'); await supabase.auth.signOut(); setStep('login'); clearForm() }
  }

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setCode('')
    setMessage('')
  }

  const handleLogout = async () => {
    await createClient().auth.signOut()
    setUserEmail(null)
    clearForm()
    setSuccessMessage('')
    setStep('login')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      
      {/* SE NÃO ESTIVER LOGADO: Caixa de login no mesmo padrão de design */}
      {!userEmail ? (
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image src="/images/logo-n1-white.png" alt="Grupo N1 Empreendimentos" width={220} height={140} className="object-contain" priority />
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/50 mx-auto mb-4 rounded-full" />
          </div>

          <div className="bg-card border border-border rounded-xl p-8 shadow-xl text-left space-y-4">
            {message && <p className="text-sm text-red-500 font-medium text-center bg-red-500/10 py-2 rounded border border-red-500/20">{message}</p>}
            {successMessage && <p className="text-sm text-emerald-500 font-medium text-center bg-emerald-500/10 py-2 rounded border border-emerald-500/20">{successMessage}</p>}

            {/* FLUXO DE LOGIN */}
            {step === 'login' && (
              <>
                <h2 className="text-xl font-semibold text-foreground text-center">Acessar Painel</h2>
                <Input type="email" placeholder="E-mail corporativo" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background py-5" />
                <Input type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background py-5" />
                <div className="text-right">
                  <button onClick={() => { setStep('forgot'); clearForm() }} className="text-xs text-muted-foreground hover:text-primary transition-colors">Esqueceu a senha?</button>
                </div>
                <Button onClick={() => handleAuthSubmit('login')} className="w-full bg-primary font-semibold py-5 flex items-center justify-center gap-2">Entrar <ArrowRight className="w-4 h-4" /></Button>
                <p className="text-xs text-center text-muted-foreground pt-2">Não possui conta? <button onClick={() => { setStep('register'); clearForm() }} className="text-primary hover:underline font-medium">Cadastre-se aqui</button></p>
              </>
            )}

            {/* FLUXO DE CADASTRO */}
            {step === 'register' && (
              <>
                <h2 className="text-xl font-semibold text-foreground text-center">Criar Conta</h2>
                <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background py-5" />
                <Input type="password" placeholder="Criar Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background py-5" />
                <Button onClick={() => handleAuthSubmit('register')} className="w-full bg-primary font-semibold py-5 flex items-center justify-center gap-2">Avançar <ArrowRight className="w-4 h-4" /></Button>
                <p className="text-xs text-center text-muted-foreground pt-2">Já tem registro? <button onClick={() => { setStep('login'); clearForm() }} className="text-primary hover:underline font-medium">Voltar para o Login</button></p>
              </>
            )}

            {/* ESQUECI MINHA SENHA */}
            {step === 'forgot' && (
              <>
                <h2 className="text-xl font-semibold text-foreground text-center flex items-center justify-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Nova Senha</h2>
                <Input type="email" placeholder="Informe seu E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background py-5" />
                <Input type="password" placeholder="Digite a Nova Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background py-5" />
                <Button onClick={() => handleAuthSubmit('forgot')} className="w-full bg-primary font-semibold py-5 flex items-center justify-center gap-2">Trocar Senha <ArrowRight className="w-4 h-4" /></Button>
                <p className="text-xs text-center text-muted-foreground pt-2"><button onClick={() => { setStep('login'); clearForm() }} className="text-muted-foreground hover:underline">Voltar</button></p>
              </>
            )}

            {/* VALIDAÇÃO DE CÓDIGO (CADASTRO) */}
            {step === 'verify' && (
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Código de Confirmação</h2>
                <p className="text-xs text-muted-foreground">Digite o código de validação padrão (1234) para confirmar.</p>
                <Input type="text" maxLength={4} placeholder="0 0 0 0" value={code} onChange={(e) => setCode(e.target.value)} className="bg-background text-center text-lg py-5 tracking-widest font-mono" />
                <Button onClick={handleVerifyCode} className="w-full bg-primary font-semibold py-5">Ativar Conta</Button>
              </div>
            )}

            {/* VALIDAÇÃO DE CÓDIGO (SENHA) */}
            {step === 'verify_forgot' && (
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Aprovar Alteração</h2>
                <p className="text-xs text-muted-foreground">Digite o código de validação padrão (1234) para salvar a senha.</p>
                <Input type="text" maxLength={4} placeholder="0 0 0 0" value={code} onChange={(e) => setCode(e.target.value)} className="bg-background text-center text-lg py-5 tracking-widest font-mono" />
                <Button onClick={handleVerifyForgotCode} className="w-full bg-primary font-semibold py-5">Confirmar Nova Senha</Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SE LOGADO: SEU DESIGNER ORIGINAL 100% INTACTO */
        <div className="max-w-4xl w-full">
          {/* Header com Logo */}
          <div className="text-center mb-12 relative">
            
            {/* Botão discreto de sair integrado para não estragar o visual */}
            <div className="absolute top-0 right-0">
              <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1.5 transition-colors bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
                <LogOut className="w-3.5 h-3.5" /> Sair ({userEmail})
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <Image
                src="/images/logo-n1-white.png"
                alt="Grupo N1 Empreendimentos"
                width={220}
                height={140}
                className="object-contain"
                priority
              />
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/50 mx-auto mb-4 rounded-full" />
            <p className="text-muted-foreground text-lg">
              Sistema de Cadastro e Conferência de Aço
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cadastrar Aço */}
            <Link href="/cadastro" className="group">
              <div className="bg-card border border-border rounded-xl p-8 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">Cadastrar Aço</h2>
                  <p className="text-muted-foreground">
                    Cadastre novos itens de aço no sistema com expansão automática de faixas
                  </p>
                </div>
              </div>
            </Link>

            {/* Conferir Estoque */}
            <Link href="/conferencia" className="group">
              <div className="bg-card border border-border rounded-xl p-8 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ClipboardList className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">Conferir Estoque</h2>
                  <p className="text-muted-foreground">
                    Confira e marque os itens de aço cadastrados no estoque
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-muted-foreground text-sm">
            <p>Sistema desenvolvido para N1 Construtora</p>
          </footer>
        </div>
      )}
    </main>
  )
}
