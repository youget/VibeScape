const CACHE_DURATION = 10 * 60 * 1000 // 10 menit

function getCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_DURATION) return null
    return data
  } catch { return null }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

async function doFetch(url, cacheKey) {
  const cached = getCache(cacheKey)
  if (cached) return cached
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.models || data.data || [])
    if (list.length) setCache(cacheKey, list)
    return list.length ? list : null
  } catch { return null }
}

export const fetchTextModels  = () => doFetch('https://text.pollinations.ai/models',  'vs-models-text')
export const fetchImageModels = () => doFetch('https://image.pollinations.ai/models', 'vs-models-image')
export const fetchAudioModels = () => doFetch('https://audio.pollinations.ai/models', 'vs-models-audio')
export const fetchVideoModels = () => doFetch('https://video.pollinations.ai/models', 'vs-models-video')

// Sort: free first, paid last
export function sortModels(models) {
  if (!Array.isArray(models)) return []
  return [...models].sort((a, b) => (a.paid_only === b.paid_only ? 0 : a.paid_only ? 1 : -1))
}

// Normalize API response → format yang dipakai komponen
// API: { name, description, paid_only }
// Output: { id, label, free }
export function toDropdown(m) {
  return {
    id:    m.name   || m.id    || '',
    label: m.description || m.name || m.id || '',
    free:  !m.paid_only,
  }
}
