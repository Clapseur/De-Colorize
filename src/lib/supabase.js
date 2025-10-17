import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (() => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
    return null
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
})()

export async function uploadImage(file, { bucket = 'images', pathPrefix = 'uploads' } = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  }
  const timestamp = Date.now()
  const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const path = `${pathPrefix}/${timestamp}_${cleanName}`

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream'
  })
  if (error) throw error

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  return { path, publicUrl: pub?.publicUrl || null, key: data?.path || path }
}