const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://127.0.0.1:8000/storage'

async function getJson(path) {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) throw new Error(`Erreur API ${response.status}`)
  return response.json()
}

export const storageUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${STORAGE_URL}/${String(path).replace(/^\/+/, '')}`
}

export const publicApi = {
  preferences:  () => getJson('/public/preferences'),
  slides:       () => getJson('/public/slides'),
  about:        () => getJson('/public/about'),
  services:     () => getJson('/public/services'),
  specialistes: () => getJson('/public/specialistes'),
  partenaires:  () => getJson('/public/partenaires'),
  testimonials: () => getJson('/public/testimonials'),
  faq:          () => getJson('/public/faq'),
  pages:        () => getJson('/public/pages'),
  page:         (path) => getJson(`/public/page?path=${encodeURIComponent(path)}`),
  contact: async (payload) => {
    const response = await fetch(`${API_URL}/public/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Erreur API ${response.status}`)
    return response.json()
  },
  appointment: async (payload) => {
    const response = await fetch(`${API_URL}/public/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      let msg = `Erreur API ${response.status}`
      try { const body = await response.json(); if (body?.message) msg = body.message } catch {}
      throw new Error(msg)
    }
    return response.json()
  },
}
