'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExpandedItem, SteelProgress } from '@/lib/types'

export async function listProgress(_userId?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('steel_progress').select('*').order('updated_at', { ascending: false })
  return error ? { success: false, error: error.message } : { success: true, data: data as SteelProgress[] }
}

export async function loadProgress(name: string, _userId?: string) {
  const supabase = await createClient()
  const { data: progress, error } = await supabase.from('steel_progress').select('*').eq('name', name).single()
  if (error || !progress) return { success: false, error: error?.message || 'Progresso não encontrado' }
  const { data: items, error: itemsError } = await supabase.from('steel_items').select('*').eq('progress_id', progress.id).order('created_at')
  return itemsError ? { success: false, error: itemsError.message } : { success: true, data: { ...progress, items } }
}

export async function saveProgress(name: string, items: ExpandedItem[], _userId?: string) {
  const supabase = await createClient()
  const { data: progress, error } = await supabase.from('steel_progress').upsert({ name }, { onConflict: 'name' }).select().single()
  if (error || !progress) return { success: false, error: error?.message || 'Erro ao salvar progresso' }
  const { error: deleteError } = await supabase.from('steel_items').delete().eq('progress_id', progress.id)
  if (deleteError) return { success: false, error: deleteError.message }
  if (items.length) {
    const { error: insertError } = await supabase.from('steel_items').insert(items.map(item => ({ progress_id: progress.id, arquivo: item.arquivo, os: item.os, conferido: item.conferido })))
    if (insertError) return { success: false, error: insertError.message }
  }
  return { success: true }
}

export async function deleteProgress(name: string, _userId?: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('steel_progress').delete().eq('name', name)
  return error ? { success: false, error: error.message } : { success: true }
}

export async function registrarUsuario(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  return error ? { success: false, error: error.message } : { success: true, user: data.user }
}

export async function autenticarUsuario(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? { success: false, error: error.message } : { success: true, user: data.user }
}

export async function redefinirSenhaUsuario(_email: string, novaSenha: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  return error ? { success: false, error: error.message } : { success: true }
}

export async function resetPassword(email: string, password: string) {
  return redefinirSenhaUsuario(email, password)
}
