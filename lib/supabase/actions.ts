import { createClient } from './server' // ou o caminho do seu cliente do supabase

/**
 * Redefine a senha do usuário utilizando o Supabase Auth
 */
export async function resetPassword(email: string, novaSenha: string) {
  try {
    const emailFormatado = email.trim().toLowerCase()
    
    // Inicializa o cliente do Supabase
    const supabase = await createClient()

    // No Supabase, se o usuário já está autenticado ou veio pelo link de recuperação, 
    // a forma correta de atualizar a senha é usando o updateUser:
    const { data, error } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error)
    return { success: false, error: 'Erro interno ao redefinir a senha.' }
  }
}