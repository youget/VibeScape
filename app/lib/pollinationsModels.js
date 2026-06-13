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

async function fetchAllModels() {
  const key = 'vs-polli-all-models'
  const cached = getCache(key)
  if (cached) return cached
  try {
    const res = await fetch('https://gen.pollinations.ai/v1/models')
    if (!res.ok) return null
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.data || [])
    if (!list.length) return null
    setCache(key, list)
    return list
  } catch { return null }
}

export async function fetchTextModels() {
  const all = await fetchAllModels()
  if (!all) return null
  return all.filter(m => m.type === 'text' || m.type === 'chat' || (!m.type && !m.id?.includes('image') && !m.id?.includes('tts') && !m.id?.includes('video')))
}

export async function fetchImageModels() {
  const all = await fetchAllModels()
  if (!all) return null
  return all.filter(m => m.type === 'image')
}

export async function fetchAudioModels() {
  const all = await fetchAllModels()
  if (!all) return null
  return all.filter(m => m.type === 'audio' || m.type === 'tts')
}

export async function fetchVideoModels() {
  const all = await fetchAllModels()
  if (!all) return null
  return all.filter(m => m.type === 'video')
}

export function sortModels(models) {
  if (!Array.isArray(models)) return []
  return [...models].sort((a, b) => (a.paid_only === b.paid_only ? 0 : a.paid_only ? 1 : -1))
}

export function toDropdown(m) {
  return {
    id:    m.id   || m.name || '',
    label: m.description || m.name || m.id || '',
    free:  !m.paid_only,
  }
}

export function clearModelsCache() {
  try {
    localStorage.removeItem('vs-polli-all-models')
  } catch {}
}
