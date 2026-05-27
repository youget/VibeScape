'use client'
import { useState, useEffect, useRef } from 'react'
import { Trash2, Play, X, Share2, Download, ImageIcon,
  ChevronLeft, ChevronRight, Copy, Heart, Stars, MessageCircle, Hammer } from 'lucide-react'
import { toast } from '../components/Toast'
import { getFavorites, clearFavorites, toggleFavorite } from '../lib/imagedb'
import { getAllSessions, deleteSession, clearNonFavSessions, clearAllSessions, toggleSessionFav } from '../lib/chatdb'

const FAV_VIDEO_KEY = 'vs-fav-videos'

// Icon-based — no colored emoji
const TAB_META = {
  fortune: { label: 'Fortune', Icon: Stars },
  story:   { label: 'Story',   Icon: MessageCircle },
  builder: { label: 'Builder', Icon: Hammer },
}

function formatViews(num) { const n = parseInt(num); if (isNaN(n)) return '0'; if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return n.toString() }
function formatDuration(sec) { const m = Math.floor(sec/60); const s = sec%60; return `${m}:${s.toString().padStart(2,'0')}` }
function formatDate(ts) { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

export default function FavoritesPage() {
  const [tab, setTab] = useState('videos')
  const [favVideos, setFavVideos] = useState([])
  const [favImages, setFavImages] = useState([])
  const [chatSessions, setChatSessions] = useState([])
  const [chatFilter, setChatFilter] = useState('all')
  const [activeVideo, setActiveVideo] = useState(null)
  const [viewIndex, setViewIndex] = useState(-1)
  const [readMoreText, setReadMoreText] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const touchStartX = useRef(0)

  useEffect(() => {
    try { setFavVideos(JSON.parse(localStorage.getItem(FAV_VIDEO_KEY) || '[]')) } catch {}
    loadImages(); loadSessions()
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (t && ['videos', 'chat', 'image'].includes(t)) setTab(t)
  }, [])

  async function loadImages() { setFavImages(await getFavorites()) }
  async function loadSessions() { setChatSessions(await getAllSessions()) }

  function removeVideo(id) {
    const updated = favVideos.filter(v => v.id !== id)
    setFavVideos(updated)
    localStorage.setItem(FAV_VIDEO_KEY, JSON.stringify(updated))
    toast('Removed')
  }
  async function handleShareVideo(video) {
    const url = `https://youtube.com/watch?v=${video.id}`
    if (navigator.share) { try { await navigator.share({ title: video.title, url }) } catch {} }
    else { try { await navigator.clipboard.writeText(url); toast('Link copied!') } catch {} }
  }
  async function removeImage(item) { await toggleFavorite(item.id); await loadImages(); toast('Removed from favorites') }
  async function removeSession(id) { await deleteSession(id); await loadSessions(); toast('Session deleted') }
  async function handleToggleFavSession(id) { await toggleSessionFav(id); await loadSessions() }
  function continueSession(session) { window.location.href = `/ai/chat?session=${session.id}&type=${session.type}` }

  async function execClear() {
    if (!deleteTarget) return
    if (tab === 'videos') { setFavVideos([]); localStorage.setItem(FAV_VIDEO_KEY, '[]') }
    else if (tab === 'image') { await clearFavorites(); await loadImages() }
    else if (tab === 'chat') {
      if (deleteTarget.mode === 'all') { await clearAllSessions(); await loadSessions() }
      else { await clearNonFavSessions(); await loadSessions() }
    }
    setDeleteTarget(null); setConfirmClear(false); toast('Cleared!')
  }

  function openViewer(index) { setViewIndex(index) }
  function closeViewer() { setViewIndex(-1) }
  function prevImage() { if (viewIndex > 0) setViewIndex(viewIndex - 1) }
  function nextImage() { if (viewIndex < favImages.length - 1) setViewIndex(viewIndex + 1) }
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { if (diff > 0) nextImage(); else prevImage() }
  }
  async function copyPrompt(text) {
    try { await navigator.clipboard.writeText(text); setCopiedId(text.slice(0, 20)); setTimeout(() => setCopiedId(null), 1500); toast('Copied!') } catch {}
  }

  const currentView = viewIndex >= 0 && viewIndex < favImages.length ? favImages[viewIndex] : null
  const filteredSessions = chatFilter === 'all' ? chatSessions : chatSessions.filter(s => s.type === chatFilter)
  const isEmpty = tab === 'videos' ? favVideos.length === 0 : tab === 'image' ? favImages.length === 0 : filteredSessions.length === 0
  const mainTabs = [{ id: 'videos', label: 'Videos' }, { id: 'chat', label: 'Chat' }, { id: 'image', label: 'Image' }]
  const totalItems = favVideos.length + favImages.length + chatSessions.length

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">Your <span className="vs-gradient-text">Stash</span></h1>
      <p className="text-xs vs-text-sub text-center mb-5">all the good stuff you saved</p>

      {totalItems > 200 && (
        <div className="vs-card border rounded-xl p-3 mb-4 text-center" style={{ borderColor: '#EF4444' }}>
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#EF4444' }}>⚠️ Storage getting full</p>
          <p className="text-[10px] vs-text-sub">Limit: 150MB shared. Clear manually to free space.</p>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {mainTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor: tab === t.id ? 'var(--vs-accent)' : 'var(--vs-card)', color: tab === t.id ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${tab === t.id ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
            {t.label}
            <span className="ml-0.5 opacity-70">({t.id === 'videos' ? favVideos.length : t.id === 'image' ? favImages.length : chatSessions.length})</span>
          </button>
        ))}
      </div>

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && (
        <div>
          {/* Filter pills with lucide icons */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {['all', 'fortune', 'story', 'builder'].map(f => {
              const meta = TAB_META[f]
              const Icon = meta?.Icon
              const active = chatFilter === f
              return (
                <button key={f} onClick={() => setChatFilter(f)}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ backgroundColor: active ? 'var(--vs-accent)' : 'var(--vs-card)', color: active ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${active ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
                  {f === 'all' ? 'All' : <>{Icon && <Icon size={11} />}{meta.label}</>}
                </button>
              )
            })}
          </div>

          {chatSessions.length > 0 && (
            <div className="flex items-center justify-end gap-3 mb-4">
              <button onClick={() => { setDeleteTarget({ type: 'all', mode: 'non-fav' }); setConfirmClear(true) }}
                className="text-xs vs-text-sub hover:underline flex items-center gap-1"><Trash2 size={12} /> Clear non-favorited</button>
              <button onClick={() => { setDeleteTarget({ type: 'all', mode: 'all' }); setConfirmClear(true) }}
                className="text-xs vs-text-sub hover:underline flex items-center gap-1">Clear all</button>
            </div>
          )}

          {isEmpty && (
            <div className="text-center py-20">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-sm font-semibold vs-text mb-1">No chat history yet</p>
              <p className="text-xs vs-text-sub mb-4">Start a conversation and it&apos;ll be saved here automatically.</p>
              <a href="/ai/chat" className="vs-btn px-5 py-2 rounded-xl text-xs font-semibold inline-flex">Start Chatting</a>
            </div>
          )}

          {!isEmpty && (
            <div className="flex flex-col gap-3">
              {filteredSessions.map(session => {
                const meta = TAB_META[session.type] || TAB_META.fortune
                const Icon = meta.Icon
                const msgCount = session.messages?.length || 0
                return (
                  <div key={session.id} className="vs-card border vs-border rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      {/* Lucide icon badge — no colored emoji */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--vs-bg2)' }}>
                        <Icon size={18} style={{ color: 'var(--vs-text)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded vs-card border vs-border vs-text">{meta.label}</span>
                          {session.favorite && <Heart size={10} fill="var(--vs-accent)" style={{ color: 'var(--vs-accent)' }} />}
                        </div>
                        <p className="text-sm font-semibold vs-text leading-snug line-clamp-1">{session.title || 'Untitled conversation'}</p>
                        <p className="text-[10px] vs-text-sub mt-0.5">{msgCount} messages · {formatDate(session.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 border-t vs-border pt-3">
                      <button onClick={() => continueSession(session)} className="flex-1 vs-btn py-2 rounded-xl text-xs font-semibold">Continue →</button>
                      <button onClick={() => handleToggleFavSession(session.id)}
                        className="vs-btn-outline py-2 px-3 rounded-xl text-xs"
                        style={{ borderColor: session.favorite ? 'var(--vs-accent)' : undefined, color: session.favorite ? 'var(--vs-accent)' : undefined }}>
                        <Heart size={12} fill={session.favorite ? 'var(--vs-accent)' : 'none'} />
                      </button>
                      <button onClick={() => removeSession(session.id)} className="vs-btn-outline py-2 px-3 rounded-xl text-xs vs-text-sub"><Trash2 size={12} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIDEOS TAB ── */}
      {tab === 'videos' && (
        <div>
          {!isEmpty && <button onClick={() => { setDeleteTarget({ type: 'all' }); setConfirmClear(true) }}
            className="flex items-center gap-1 text-xs vs-text-sub mb-4 hover:underline"><Trash2 size={12} /> Clear all</button>}
          {isEmpty && (
            <div className="text-center py-20">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-semibold vs-text mb-1">No saved videos</p>
              <p className="text-xs vs-text-sub mb-4">Hit that ♥ on videos to save them here!</p>
              <a href="/videos" className="vs-btn px-5 py-2 rounded-xl text-xs font-semibold inline-flex">Browse Videos</a>
            </div>
          )}
          {!isEmpty && (
            <div className="grid grid-cols-2 gap-3">
              {favVideos.map(v => (
                <div key={v.id} className="vs-card border vs-border rounded-xl overflow-hidden">
                  <button onClick={() => setActiveVideo(v)} className="w-full text-left">
                    <div className="relative aspect-video">
                      <img src={v.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white">{formatDuration(v.durationSec)}</span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold vs-text leading-snug line-clamp-2">{v.title}</p>
                      <p className="text-[10px] vs-text-sub mt-1">{v.channel} · {formatViews(v.views)}</p>
                    </div>
                  </button>
                  <div className="flex border-t vs-border">
                    <button onClick={() => handleShareVideo(v)} className="flex-1 py-2 flex items-center justify-center vs-text-sub vs-hover"><Share2 size={14} /></button>
                    <button onClick={() => removeVideo(v.id)} className="flex-1 py-2 flex items-center justify-center vs-text-sub vs-hover"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── IMAGE TAB ── */}
      {tab === 'image' && (
        <div>
          {!isEmpty && <button onClick={() => { setDeleteTarget({ type: 'all' }); setConfirmClear(true) }}
            className="flex items-center gap-1 text-xs vs-text-sub mb-4 hover:underline"><Trash2 size={12} /> Clear all</button>}
          {isEmpty && (
            <div className="text-center py-20">
              <p className="text-3xl mb-3">🎨</p>
              <p className="text-sm font-semibold vs-text mb-1">No favorites yet</p>
              <p className="text-xs vs-text-sub mb-4">Use ♥ in AI Create to save images here.</p>
              <a href="/ai/create?tab=image" className="vs-btn px-5 py-2 rounded-xl text-xs font-semibold inline-flex">Generate Images</a>
            </div>
          )}
          {!isEmpty && (
            <div className="grid grid-cols-2 gap-3">
              {favImages.map((item, i) => (
                <div key={item.id} className="vs-card border vs-border rounded-xl overflow-hidden">
                  <button onClick={() => openViewer(i)} className="w-full">
                    <div className="aspect-square">
                      {item.medium || item.thumbnail
                        ? <img src={item.medium || item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full vs-bg2 flex items-center justify-center"><ImageIcon size={24} className="vs-text-sub" /></div>}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs vs-text-sub leading-snug line-clamp-2">{item.prompt}</p>
                      <p className="text-[10px] vs-text-sub mt-1">{item.model} · {item.size}</p>
                    </div>
                  </button>
                  <div className="flex border-t vs-border">
                    <a href={`/ai/create?tab=image&prompt=${encodeURIComponent(item.prompt)}`}
                      className="flex-1 py-2 flex items-center justify-center text-xs font-semibold vs-text-sub vs-hover">Edit</a>
                    <button onClick={() => removeImage(item)} className="flex-1 py-2 flex items-center justify-center vs-text-sub vs-hover"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Image fullscreen viewer ── */}
      {currentView && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <p className="text-xs text-gray-400">{viewIndex + 1} / {favImages.length}</p>
            <button onClick={closeViewer} className="text-gray-400 p-1"><X size={20} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-4">
            {viewIndex > 0 && <button onClick={prevImage} className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronLeft size={20} className="text-white" /></button>}
            <img src={currentView.medium || currentView.thumbnail} alt="" className="max-w-full max-h-[55vh] rounded-xl object-contain" />
            {viewIndex < favImages.length - 1 && <button onClick={nextImage} className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronRight size={20} className="text-white" /></button>}
          </div>
          <div className="p-4 max-h-[30vh] overflow-y-auto flex-shrink-0">
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{currentView.prompt}</p>
            {currentView.prompt.length > 80 && <button onClick={() => setReadMoreText(currentView.prompt)} className="text-[10px] underline mt-1" style={{ color: 'var(--vs-accent)' }}>Read more</button>}
            <p className="text-[10px] text-gray-500 mt-2">{currentView.model} · {currentView.size}{currentView.seed ? ` · Seed: ${currentView.seed}` : ''}{currentView.style && currentView.style !== 'none' ? ` · ${currentView.style}` : ''}</p>
            <div className="flex gap-2 mt-3">
              <a href={`/ai/create?tab=image&prompt=${encodeURIComponent(currentView.prompt)}`}
                className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">Edit</a>
              <button onClick={() => { removeImage(currentView); closeViewer() }}
                className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1 vs-text-sub">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video player ── */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <iframe src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; fullscreen" allowFullScreen
              className="w-full aspect-video max-h-[70vh]" style={{ border: 'none' }} />
          </div>
          <div className="p-4 bg-black/95 flex-shrink-0">
            <p className="text-sm font-bold text-white mb-1 line-clamp-2">{activeVideo.title}</p>
            <p className="text-xs text-gray-400 mb-4">{activeVideo.channel}</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleShareVideo(activeVideo)} className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
                <Share2 size={22} className="text-white" /><span className="text-[10px]">Share</span>
              </button>
              <button onClick={() => setActiveVideo(null)} className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl bg-white/10">
                <X size={22} className="text-white" /><span className="text-[10px] text-gray-400">Close</span>
              </button>
              <button onClick={() => { removeVideo(activeVideo.id); setActiveVideo(null) }} className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
                <Trash2 size={22} className="text-white" /><span className="text-[10px]">Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Read more ── */}
      {readMoreText && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 px-4 pb-24" onClick={() => setReadMoreText(null)}>
          <div className="vs-card rounded-2xl p-5 max-w-sm w-full border vs-border max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold vs-text">Full Prompt</p>
              <div className="flex items-center gap-2">
                <button onClick={() => copyPrompt(readMoreText)} className="vs-text-sub vs-hover p-1.5 rounded-lg"><Copy size={14} /></button>
                <button onClick={() => setReadMoreText(null)} className="vs-text-sub vs-hover p-1.5 rounded-lg"><X size={14} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto"><p className="text-sm vs-text leading-relaxed">{readMoreText}</p></div>
          </div>
        </div>
      )}

      {/* ── Confirm clear ── */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => { setConfirmClear(false); setDeleteTarget(null) }}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">😬</p>
            <h3 className="text-lg font-bold vs-text mb-2">Are you sure?</h3>
            <p className="text-sm vs-text-sub mb-5">
              {tab === 'chat' && deleteTarget?.mode === 'non-fav'
                ? 'Non-favorited sessions will be deleted. Favorited ones stay safe.'
                : `All your ${tab === 'videos' ? 'saved videos' : tab === 'image' ? 'favorited images' : 'chat sessions'} will be gone.`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmClear(false); setDeleteTarget(null) }} className="flex-1 vs-btn-outline px-4 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={execClear} className="flex-1 vs-btn px-4 py-2.5 rounded-xl text-sm font-semibold">Clear</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-1{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      `}</style>
    </div>
  )
}
