const DB_NAME = 'viralscape-chat'
const STORE_NAME = 'sessions'
const DB_VERSION = 1
const MAX_NON_FAV = 100

// Session schema:
// { id, type: 'fortune'|'story'|'builder', title, messages: [{role,content}], model, favorite, timestamp }

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('favorite', 'favorite', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSession({ type, title, messages, model }) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const id = await new Promise((res, rej) => {
      const req = store.add({ type, title, messages, model: model || '', favorite: false, timestamp: Date.now() })
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    await new Promise(res => { tx.oncomplete = res })
    db.close()
    await autoCleanup()
    return id
  } catch { return null }
}

export async function updateSession(id, { messages, title }) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const item = await new Promise(res => {
      const req = store.get(id)
      req.onsuccess = () => res(req.result)
      req.onerror = () => res(null)
    })
    if (!item) { db.close(); return }
    if (messages !== undefined) item.messages = messages
    if (title !== undefined) item.title = title
    item.timestamp = Date.now()
    store.put(item)
    await new Promise(res => { tx.oncomplete = res })
    db.close()
  } catch {}
}

export async function getAllSessions(limit = 100) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const idx = store.index('timestamp')
    return new Promise(resolve => {
      const items = []
      const req = idx.openCursor(null, 'prev')
      req.onsuccess = e => {
        const cursor = e.target.result
        if (cursor && items.length < limit) { items.push(cursor.value); cursor.continue() }
        else { db.close(); resolve(items) }
      }
      req.onerror = () => { db.close(); resolve([]) }
    })
  } catch { return [] }
}

export async function getSession(id) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    return new Promise(resolve => {
      const req = tx.objectStore(STORE_NAME).get(id)
      req.onsuccess = () => { db.close(); resolve(req.result || null) }
      req.onerror = () => { db.close(); resolve(null) }
    })
  } catch { return null }
}

export async function deleteSession(id) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    await new Promise(res => { tx.oncomplete = res })
    db.close()
  } catch {}
}

export async function clearAllSessions() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await new Promise(res => { tx.oncomplete = res })
    db.close()
  } catch {}
}

export async function clearNonFavSessions() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await new Promise(resolve => {
      const req = store.openCursor()
      req.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) { if (!cursor.value.favorite) cursor.delete(); cursor.continue() }
        else resolve()
      }
    })
    await new Promise(res => { tx.oncomplete = res })
    db.close()
  } catch {}
}

export async function toggleSessionFav(id) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const item = await new Promise(res => {
      const req = store.get(id)
      req.onsuccess = () => res(req.result)
      req.onerror = () => res(null)
    })
    if (!item) { db.close(); return false }
    item.favorite = !item.favorite
    store.put(item)
    await new Promise(res => { tx.oncomplete = res })
    db.close()
    return item.favorite
  } catch { return false }
}

export async function getFavSessions() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const idx = store.index('timestamp')
    return new Promise(resolve => {
      const items = []
      const req = idx.openCursor(null, 'prev')
      req.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) { if (cursor.value.favorite) items.push(cursor.value); cursor.continue() }
        else { db.close(); resolve(items) }
      }
      req.onerror = () => { db.close(); resolve([]) }
    })
  } catch { return [] }
}

async function autoCleanup() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const idx = store.index('timestamp')
    const all = []
    await new Promise(resolve => {
      const req = idx.openCursor()
      req.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) { all.push({ id: cursor.value.id, favorite: cursor.value.favorite, timestamp: cursor.value.timestamp }); cursor.continue() }
        else resolve()
      }
    })
    const nonFav = all.filter(i => !i.favorite).sort((a, b) => a.timestamp - b.timestamp)
    if (nonFav.length > MAX_NON_FAV) {
      const toDelete = nonFav.slice(0, nonFav.length - MAX_NON_FAV)
      for (const item of toDelete) store.delete(item.id)
    }
    await new Promise(res => { tx.oncomplete = res })
    db.close()
  } catch {}
}
