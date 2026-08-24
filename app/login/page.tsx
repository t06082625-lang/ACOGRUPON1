import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Acessar painel</h1>
        <div className="space-y-4">
          <input type="email" placeholder="E-mail" className="w-full rounded-lg border border-border bg-background p-3 text-foreground" />
          <input type="password" placeholder="Senha" className="w-full rounded-lg border border-border bg-background p-3 text-foreground" />

          {/* Link de recuperação */}
<div className="flex justify-end mb-2">
  <Link 
    href="/reset-password" 
    className="text-xs text-muted-foreground hover:text-primary transition-colors"
  >
    Esqueceu a senha?
  </Link>
</div>
          <button type="button" className="w-full rounded-lg bg-primary p-3 font-semibold text-primary-foreground">Entrar</button>
        </div>
      </section>
    </main>
  )
}

