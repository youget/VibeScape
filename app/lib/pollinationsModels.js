const CACHE_MS = 10 * 60 * 1000

function getCache(key) {
  try {
    const r = localStorage.getItem(key)
    if (!r) return null
    const { data, ts } = JSON.parse(r)
    return Date.now() - ts < CACHE_MS ? data : null
  } catch { return null }
}

function setCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

export function clearModelsCache() {
  try {
    ['vs-m-text','vs-m-image','vs-m-audio','vs-m-video'].forEach(k => localStorage.removeItem(k))
  } catch {}
}

async function doFetch(type, cacheKey, force) {
  if (!force) {
    const cached = getCache(cacheKey)
    if (cached) return cached
  }
  try {
    const res  = await fetch('/api/models?type=' + type)
    if (!res.ok) return null
    const list = await res.json()
    if (Array.isArray(list) && list.length) setCache(cacheKey, list)
    return Array.isArray(list) && list.length ? list : null
  } catch { return null }
}

export const fetchTextModels  = (force) => doFetch('text',  'vs-m-text',  force)
export const fetchImageModels = (force) => doFetch('image', 'vs-m-image', force)
export const fetchAudioModels = (force) => doFetch('audio', 'vs-m-audio', force)
export const fetchVideoModels = (force) => doFetch('video', 'vs-m-video', force)

export function sortModels(list) {
  if (!Array.isArray(list)) return []
  return [...list].sort((a, b) => (a.paid_only === b.paid_only ? 0 : a.paid_only ? 1 : -1))
}

export function toDropdown(m) {
  return {
    id:    m.name || m.id || '',
    label: m.description || m.name || m.id || '',
    free:  !m.paid_only,
  }
}
