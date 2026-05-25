'use client'
import { useState, useEffect } from 'react'
import { Sparkles, Shuffle, Download, Loader2, ChevronDown, ExternalLink,
  RefreshCw, Play, Film, ImageIcon, X, Heart, Copy, Trash2, ArrowRight,
  Mic, Wand2, Check } from 'lucide-react'
import { toast } from '../../components/Toast'
import { saveImage, getRecentImages, compressImage, compressImageToSize, toggleFavorite, clearRecentOnly } from '../../lib/imagedb'

const USER_KEY_STORAGE = 'vs-user-polli-key'

const IMAGE_MODELS = [
  { id: 'flux',           label: 'Flux Schnell',     tier: 'free' },
  { id: 'zimage',         label: 'Z-Image Turbo',    tier: 'byop' },
  { id: 'klein',          label: 'FLUX.2 Klein 4B',  tier: 'byop' },
  { id: 'gptimage',       label: 'GPT Image 1 Mini', tier: 'byop' },
  { id: 'qwen-image',     label: 'Qwen Image Plus',  tier: 'byop' },
  { id: 'wan-image',      label: 'Wan 2.7 Image',    tier: 'byop' },
  { id: 'kontext',        label: 'FLUX.1 Kontext',   tier: 'byop' },
  { id: 'gptimage-large', label: 'GPT Image 1.5',    tier: 'byop' },
]

const STYLES = [
  { id: 'none',       label: 'None',       suffix: '' },
  { id: 'realistic',  label: 'Realistic',  suffix: ', photorealistic, highly detailed, 8K resolution' },
  { id: '3d',         label: '3D Render',  suffix: ', 3D render, octane render, cinema 4D, highly detailed' },
  { id: 'cartoon',    label: 'Cartoon',    suffix: ', cartoon style, vibrant colors, playful, fun' },
  { id: 'anime',      label: 'Anime',      suffix: ', anime style, manga art, Studio Ghibli inspired' },
  { id: 'pixel',      label: 'Pixel Art',  suffix: ', pixel art, 16-bit retro game style' },
  { id: 'watercolor', label: 'Watercolor', suffix: ', watercolor painting, soft colors, artistic' },
  { id: 'oil',        label: 'Oil Paint',  suffix: ', oil painting, classical art, rich textures' },
  { id: 'sketch',     label: 'Sketch',     suffix: ', pencil sketch, hand drawn, detailed linework' },
  { id: 'cyberpunk',  label: 'Cyberpunk',  suffix: ', cyberpunk style, neon lights, futuristic city' },
  { id: 'fantasy',    label: 'Fantasy',    suffix: ', fantasy art, magical, ethereal, mystical lighting' },
  { id: 'horror',     label: 'Horror',     suffix: ', dark horror style, creepy, eerie atmosphere' },
  { id: 'vintage',    label: 'Vintage',    suffix: ', vintage photography, retro, film grain, 70s aesthetic' },
  { id: 'minimal',    label: 'Minimal',    suffix: ', minimalist, clean lines, simple, modern design' },
  { id: 'cinematic',  label: 'Cinematic',  suffix: ', cinematic shot, movie scene, dramatic lighting' },
  { id: 'popart',     label: 'Pop Art',    suffix: ', pop art style, Andy Warhol, bold colors, graphic' },
  { id: 'sticker',    label: 'Sticker',    suffix: ', sticker design, die-cut, white border, cute' },
  { id: 'logo',       label: 'Logo',       suffix: ', logo design, professional, vector style, clean' },
  { id: 'isometric',  label: 'Isometric',  suffix: ', isometric 3D, game asset, clean, detailed' },
  { id: 'neon',       label: 'Neon Glow',  suffix: ', neon glow effect, dark background, vibrant neon colors' },
]

const SIZES = [
  { label: '1:1',  w: 1024, h: 1024 },
  { label: '16:9', w: 1344, h: 768 },
  { label: '9:16', w: 768,  h: 1344 },
  { label: '4:3',  w: 1152, h: 896 },
  { label: '3:4',  w: 896,  h: 1152 },
]

const VOICES = ['alloy','echo','nova','shimmer','onyx','fable','coral','sage','rachel','bella','charlotte','sarah','adam','josh','daniel','james']

const RANDOM_PROMPTS = [
  'A cat wearing a tiny business suit in a board meeting',
  'A raccoon DJ at a neon underground rave',
  'A goldfish piloting a tiny spaceship through a galaxy',
  'A penguin surfing on a rainbow wave',
  'A hamster as a medieval knight fighting a dragon made of cheese',
  'A sloth running a coffee shop in a treehouse',
  'A frog playing electric guitar on stage at a rock concert',
  'An octopus as a sushi chef with a confused expression',
  'A dog astronaut planting a flag on the moon made of bones',
  'A bunny samurai in a cherry blossom forest',
]

const LOADING_MSGS = [
  'Cooking your image...', 'Teaching the AI to draw...', 'Summoning pixels from the void...',
  'The AI is having a creative moment...', 'Generating something potentially cursed...',
  'Brewing some digital art...', 'The hamsters are running the wheel...',
]

const ERR = {
  quota_exceeded: { emoji: '😭', title: 'Pollen depleted',         desc: "Server pollen is out. Add your own API key to keep generating." },
  invalid_key:    { emoji: '🫠', title: "That key ain't it",        desc: 'Double-check your API key and try again.' },
  rate_limit:     { emoji: '⏳', title: 'Rate limit hit',           desc: 'Too many requests. Wait a moment and try again.' },
  forbidden:      { emoji: '🚫', title: 'Access denied',            desc: "Your key might not have access to this model." },
  server_error:   { emoji: '💤', title: 'Server took a nap',        desc: 'Something went wrong on our end. Try again.' },
  api_error:      { emoji: '🫣', title: 'Something went sideways',  desc: 'Give it another shot.' },
}

function getUserKey()   { try { return localStorage.getItem(USER_KEY_STORAGE) || '' } catch { return '' } }
function saveUserKey(k) { try { localStorage.setItem(USER_KEY_STORAGE, k) } catch {} }
function clearUserKey() { try { localStorage.removeItem(USER_KEY_STORAGE) } catch {} }
function randomLoadingMsg() { return LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)] }

const tabs = [
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'video', label: 'Video', icon: Film },
]

export default function CreatePage() {
  const [tab, setTab] = useState('image')
  const [userKey, setUserKey] = useState('')
  const [balance, setBalance] = useState(null)
  const [showKeyPopup, setShowKeyPopup] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [keyReason, setKeyReason] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [errorPopup, setErrorPopup] = useState(null)
  const [readMoreText, setReadMoreText] = useState(null)
  const [confirmClearRecent, setConfirmClearRecent] = useState(false)
  const [showPollenPopup, setShowPollenPopup] = useState(false)

  // Image state
  const [imgPrompt, setImgPrompt] = useState('')
  const [imgModel, setImgModel] = useState('flux')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [imgSize, setImgSize] = useState(0)
  const [imgStyle, setImgStyle] = useState('none')
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgResult, setImgResult] = useState(null)
  const [imgError, setImgError] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [recent, setRecent] = useState([])
  const [isFav, setIsFav] = useState(false)

  // Enhance popup state
  const [showEnhancePopup, setShowEnhancePopup] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [originalPromptForEnhance, setOriginalPromptForEnhance] = useState('')

  // Audio state
  const [voiceMode, setVoiceMode] = useState('tts')
  const [voiceText, setVoiceText] = useState('')
  const [voiceVoice, setVoiceVoice] = useState('nova')
  const [voiceDuration, setVoiceDuration] = useState(30)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceResult, setVoiceResult] = useState(null)
  const [voiceError, setVoiceError] = useState(null)

  // Video state
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoDuration, setVideoDuration] = useState(6)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoResult, setVideoResult] = useState(null)
  const [videoError, setVideoError] = useState(null)

  useEffect(() => {
    const k = getUserKey(); setUserKey(k)
    fetchBalance(k)
    loadRecent()
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab'); if (t && ['image','audio','video'].includes(t)) setTab(t)
    const p = params.get('prompt'); if (p) { setImgPrompt(p); setTab('image') }
  }, [])

  async function fetchBalance(key) {
    try {
      const headers = {}
      const k = key !== undefined ? key : getUserKey()
      if (k) headers['x-user-key'] = k
      const res = await fetch('/api/balance', { headers })
      const data = await res.json()
      setBalance(data.balance ?? 0)
    } catch { setBalance(null) }
  }

  async function loadRecent() { setRecent(await getRecentImages(10)) }

  function hasKey() { return !!getUserKey() }

  function openKeyPopup(reason, action) {
    const k = getUserKey()
    if (k) { if (action) action(k); return }
    setKeyReason(reason); setPendingAction(() => action); setKeyInput(''); setShowKeyPopup(true)
  }

  function handleKeySave() {
    if (!keyInput.trim()) return
    saveUserKey(keyInput.trim()); setUserKey(keyInput.trim())
    setShowKeyPopup(false)
    if (pendingAction) pendingAction(keyInput.trim())
    setPendingAction(null)
    fetchBalance(keyInput.trim())
  }

  function handleKeyClear() { clearUserKey(); setUserKey(''); fetchBalance('') }

  function handleApiError(code) {
    if (code === 'quota_exceeded') { setKeyReason('quota'); setShowKeyPopup(true); return }
    setErrorPopup(ERR[code] || ERR.api_error)
  }

  const currentImgModel = IMAGE_MODELS.find(m => m.id === imgModel) || IMAGE_MODELS[0]
  const currentStyle = STYLES.find(s => s.id === imgStyle) || STYLES[0]

  function getModelTag(m) {
    if (m.tier === 'free') return ' · free'
    return hasKey() ? '' : ' · key'
  }

  function selectModel(m) {
    if (m.tier === 'byop' && !hasKey()) { openKeyPopup('byop_image', () => { setImgModel(m.id); setShowModelPicker(false) }); return }
    setImgModel(m.id); setShowModelPicker(false)
  }

  async function doEnhancePrompt(promptToEnhance) {
    setEnhanceLoading(true)
    setEnhancedPrompt('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI image prompt engineer. Rewrite the given prompt to be vivid, specific, and highly effective for AI image generation. Weave in details about: lighting, mood, composition, camera angle, color palette, textures, and atmosphere. Keep it under 120 words. Return ONLY the enhanced prompt — no preamble, no explanation, nothing else.'
            },
            { role: 'user', content: promptToEnhance }
          ],
          model: 'gemini-fast'
        })
      })
      const data = await res.json()
      setEnhancedPrompt(data.result?.trim() || '')
    } catch {
      setEnhancedPrompt('')
    }
    setEnhanceLoading(false)
  }

  async function handleEnhanceClick() {
    if (!imgPrompt.trim()) return
    const original = imgPrompt.trim()
    setOriginalPromptForEnhance(original)
    setShowEnhancePopup(true)
    await doEnhancePrompt(original)
  }

  async function handleReEnhance() {
    await doEnhancePrompt(originalPromptForEnhance)
  }

  function handleUseEnhanced() {
    if (enhancedPrompt) setImgPrompt(enhancedPrompt)
    setShowEnhancePopup(false)
    setEnhancedPrompt('')
  }

  async function handleGenerate(overrideSeed) {
    if (!imgPrompt.trim() || imgLoading) return
    if (currentImgModel.tier === 'byop' && !hasKey()) { openKeyPopup('byop_image', () => doGenerate(overrideSeed)); return }
    doGenerate(overrideSeed)
  }

  async function doGenerate(overrideSeed) {
    setImgLoading(true); setImgError(null); setImgResult(null); setIsFav(false)
    setLoadingMsg(randomLoadingMsg())
    const size = SIZES[imgSize]
    const seed = overrideSeed || Math.floor(Math.random() * 999999)
    const fullPrompt = imgPrompt.trim() + currentStyle.suffix
    const k = getUserKey()

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, model: imgModel, width: size.w, height: size.h, seed, ...(k && { userKey: k }) }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        handleApiError(err.error || 'api_error'); setImgLoading(false); return
      }

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const thumb = await compressImage(blobUrl, 100)
      const medium = await compressImageToSize(blobUrl, 512)
      const dbId = await saveImage({ prompt: imgPrompt, model: imgModel, size: size.label, seed, thumbnail: thumb, medium, style: imgStyle })
      setImgResult({ url: blobUrl, medium, prompt: imgPrompt, model: imgModel, size: size.label, seed, style: imgStyle, dbId })
      await loadRecent()
      toast('Image generated!')
      fetchBalance()
    } catch (err) { setImgError(err.message) }
    setImgLoading(false)
  }

  async function handleSaveToFav() {
    if (!imgResult?.dbId) return
    const result = await toggleFavorite(imgResult.dbId)
    setIsFav(result)
    toast(result ? 'Saved to favorites!' : 'Removed from favorites', '/favorites?tab=image')
  }

  function handleRegenerate() { if (imgResult) handleGenerate(imgResult.seed) }
  function handleDownload() { if (!imgResult) return; const a = document.createElement('a'); a.href = imgResult.url; a.download = `vibescape-${Date.now()}.png`; a.click() }

  function handleClickRecent(item) {
    setImgPrompt(item.prompt); if (item.style) setImgStyle(item.style)
    setImgResult({ url: item.medium || item.thumbnail, prompt: item.prompt, model: item.model, size: item.size, seed: item.seed, style: item.style, dbId: item.id, isThumb: true })
    setIsFav(item.favorite || false); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleClearRecent() { await clearRecentOnly(); await loadRecent(); setConfirmClearRecent(false); toast('Recent cleared!') }
  async function copyText(text) { try { await navigator.clipboard.writeText(text); toast('Copied!') } catch { toast('Failed to copy') } }

  async function handleVoiceGenerate() {
    if (!voiceText.trim() || voiceLoading) return
    const k = getUserKey(); if (!k) { openKeyPopup('voice', k2 => doVoice(k2)); return }
    doVoice(k)
  }
  async function doVoice(k) {
    setVoiceLoading(true); setVoiceError(null); setVoiceResult(null)
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        // FIX 3: TTS has no model param (undefined), music uses elevenmusic
        body: JSON.stringify({ action: 'audio', prompt: voiceText.trim(), model: voiceMode === 'music' ? 'elevenmusic' : undefined, voice: voiceMode === 'tts' ? voiceVoice : undefined, duration: voiceMode === 'music' ? voiceDuration : undefined, userKey: k }) })
      const data = await res.json()
      if (data.error) { handleApiError(data.error); setVoiceLoading(false); return }
      setVoiceResult(data.audio)
    } catch { setVoiceError('Failed. Try again?') }
    setVoiceLoading(false)
  }

  async function handleVideoGenerate() {
    if (!videoPrompt.trim() || videoLoading) return
    const k = getUserKey(); if (!k) { openKeyPopup('video', k2 => doVideo(k2)); return }
    doVideo(k)
  }
  async function doVideo(k) {
    setVideoLoading(true); setVideoError(null); setVideoResult(null)
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        // FIX 4: nova-reel (not grok-video), duration clamped to min 6
        body: JSON.stringify({ action: 'video', prompt: videoPrompt.trim(), model: 'nova-reel', duration: Math.max(videoDuration, 6), userKey: k }) })
      const data = await res.json()
      if (data.error) { handleApiError(data.error); setVideoLoading(false); return }
      setVideoResult(data.video)
    } catch { setVideoError('Failed. Try again?') }
    setVideoLoading(false)
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">AI <span className="vs-gradient-text">Playground</span></h1>
      <p className="text-xs vs-text-sub text-center mb-4">create unhinged stuff with artificial brainpower</p>

      {/* Balance bar */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full vs-card border vs-border text-[10px]">
          {balance !== null
            ? <button onClick={() => setShowPollenPopup(true)} className="vs-text-sub hover:underline">
                {balance > 0 ? `${balance.toFixed(3)} pollen` : 'pollen depleted'}
              </button>
            : <span className="vs-text-sub">Loading...</span>}
          {userKey ? (
            <button onClick={() => { setKeyReason('manage'); setShowKeyPopup(true) }}
              className="text-[10px] font-semibold vs-text border-l vs-border pl-2 ml-1">
              key active
            </button>
          ) : (
            <button onClick={() => setShowKeyPopup(true)}
              className="text-[10px] font-semibold vs-text border-l vs-border pl-2 ml-1">
              add key
            </button>
          )}
        </div>
        <a href="/ai/chat"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full vs-card border vs-border text-[10px] font-semibold vs-text hover:opacity-75 transition-opacity">
          Chat Tools <ArrowRight size={10} />
        </a>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 vs-card border vs-border rounded-xl p-1">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
              style={{ backgroundColor: tab === t.id ? 'var(--vs-accent)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--vs-text-sub)' }}>
              <Icon size={11} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* IMAGE */}
      {tab === 'image' && (
        <div>
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Model</p>
            <button onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl vs-card border vs-border text-xs font-semibold vs-text w-full">
              <span className="flex-1 text-left">{currentImgModel.label}{getModelTag(currentImgModel)}</span>
              <ChevronDown size={14} className="vs-text-sub" style={{ transform: showModelPicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showModelPicker && (
              <div className="vs-card border vs-border rounded-xl mt-1 max-h-56 overflow-y-auto">
                {IMAGE_MODELS.map(m => (
                  <button key={m.id} onClick={() => selectModel(m)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs vs-hover border-b vs-border last:border-b-0"
                    style={{ color: imgModel === m.id ? 'var(--vs-accent)' : 'var(--vs-text)' }}>
                    <span className="flex-1 text-left font-semibold">{m.label}</span>
                    <span className="vs-text-sub text-[10px]">{m.tier === 'free' ? 'free' : 'key'}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] vs-text-sub mt-1.5">free · no key needed &nbsp;|&nbsp; key · your own API key</p>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Size</p>
            <div className="flex gap-2">
              {SIZES.map((s, i) => (
                <button key={i} onClick={() => setImgSize(i)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ backgroundColor: imgSize === i ? 'var(--vs-accent)' : 'var(--vs-card)', color: imgSize === i ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${imgSize === i ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Prompt</p>
            <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}
              placeholder="Describe what you want to see..." rows={3}
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none resize-none"
              style={{ backgroundColor: 'var(--vs-card)' }} />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button onClick={() => setImgPrompt(RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)])}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub vs-hover">
                <Shuffle size={12} /> Random
              </button>
              <button
                onClick={handleEnhanceClick}
                disabled={!imgPrompt.trim()}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub vs-hover transition-all"
                style={{ opacity: imgPrompt.trim() ? 1 : 0.4 }}>
                <Wand2 size={12} /> Enhance
              </button>
              <div className="relative">
                <button onClick={() => setShowStylePicker(!showStylePicker)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold vs-card border vs-border vs-text-sub vs-hover">
                  Style: {currentStyle.label}
                  <ChevronDown size={12} style={{ transform: showStylePicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>
                {showStylePicker && (
                  <div className="absolute bottom-full mb-1 left-0 right-0 vs-card border vs-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                    {STYLES.map(s => (
                      <button key={s.id} onClick={() => { setImgStyle(s.id); setShowStylePicker(false) }}
                        className="w-full text-left px-3 py-2 text-xs vs-hover border-b vs-border last:border-b-0"
                        style={{ color: imgStyle === s.id ? 'var(--vs-accent)' : 'var(--vs-text)', fontWeight: imgStyle === s.id ? 700 : 500 }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button onClick={() => handleGenerate()} disabled={imgLoading || !imgPrompt.trim()}
            className="vs-btn w-full py-3 rounded-xl text-sm font-bold mb-6 gap-2 flex items-center justify-center"
            style={{ opacity: imgLoading || !imgPrompt.trim() ? 0.5 : 1 }}>
            {imgLoading ? (<><Loader2 size={16} className="animate-spin" /> {loadingMsg}</>) : (<><Sparkles size={16} /> Generate</>)}
          </button>

          {imgLoading && (
            <div className="vs-card border vs-border rounded-2xl overflow-hidden mb-6">
              <div className="skeleton aspect-square w-full" />
              <div className="p-4"><div className="skeleton h-3 w-3/4 mb-2" /><div className="skeleton h-3 w-1/2" /></div>
            </div>
          )}

          {imgError && (
            <div className="vs-card border vs-border rounded-xl p-4 text-center mb-6">
              <p className="text-xl mb-1">💀</p><p className="text-xs vs-text-sub">{imgError}</p>
            </div>
          )}

          {imgResult && !imgLoading && (
            <div className="vs-card border vs-border rounded-2xl overflow-hidden mb-6">
              <img src={imgResult.url} alt={imgResult.prompt} className="w-full" />
              {imgResult.isThumb && <p className="text-[10px] text-center vs-text-sub py-1">Preview — Regenerate for full size</p>}
              <div className="p-4">
                <p className="text-xs vs-text-sub mb-1 leading-relaxed line-clamp-2">{imgResult.prompt}</p>
                {imgResult.prompt.length > 80 && (
                  <button onClick={() => setReadMoreText(imgResult.prompt)} className="text-[10px] mb-2 underline" style={{ color: 'var(--vs-accent)' }}>Read more</button>
                )}
                {/* FIX 2: string concat instead of template literal to avoid Turbopack regex parse error */}
                <p className="text-[10px] vs-text-sub mb-3">{'Model: ' + imgResult.model + ' · Size: ' + imgResult.size + ' · Seed: ' + imgResult.seed + (imgResult.style && imgResult.style !== 'none' ? ' · ' + imgResult.style : '')}</p>
                <div className="flex gap-2">
                  <button onClick={handleDownload} className="flex-1 vs-btn py-2.5 rounded-xl text-xs font-semibold gap-1 flex items-center justify-center"><Download size={14} /> Download</button>
                  <button onClick={handleRegenerate} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-xs font-semibold gap-1 flex items-center justify-center"><RefreshCw size={14} /> Regen</button>
                  <button onClick={handleSaveToFav} className="vs-btn-outline py-2.5 px-3 rounded-xl text-xs font-semibold"
                    style={{ borderColor: isFav ? 'var(--vs-accent)' : undefined, color: isFav ? 'var(--vs-accent)' : undefined }}>
                    <Heart size={14} fill={isFav ? 'var(--vs-accent)' : 'none'} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold vs-text">Recent ({recent.length})</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setConfirmClearRecent(true)} className="text-[10px] vs-text-sub hover:underline flex items-center gap-1"><Trash2 size={10} /> Clear</button>
                  <a href="/favorites?tab=image" className="text-[10px] vs-text-sub hover:underline flex items-center gap-1">Favorites <ExternalLink size={10} /></a>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {recent.map((item, i) => (
                  <button key={item.id || i} onClick={() => handleClickRecent(item)}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border vs-border vs-hover relative">
                    {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full vs-bg2 flex items-center justify-center"><ImageIcon size={14} className="vs-text-sub" /></div>}
                    {item.favorite && <span className="absolute top-0.5 right-0.5 text-[8px]">♥</span>}
                  </button>
                ))}
              </div>
              <p className="text-[10px] vs-text-sub mt-2">Last 10 generations. Use ♥ to save permanently.</p>
            </div>
          )}
        </div>
      )}

      {/* AUDIO */}
      {tab === 'audio' && (
        <div>
          <div className="vs-card border vs-border rounded-xl p-3 mb-5 text-center">
            <p className="text-[10px] vs-text-sub">Powered by <strong className="vs-text">Assembly</strong> via Pollinations · API key required</p>
          </div>
          <div className="flex gap-2 mb-5">
            {[['tts', 'TTS'], ['music', 'Music']].map(([mode, label]) => (
              <button key={mode} onClick={() => setVoiceMode(mode)} className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: voiceMode === mode ? 'var(--vs-accent)' : 'var(--vs-card)', color: voiceMode === mode ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${voiceMode === mode ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
                {label}
              </button>
            ))}
          </div>
          {voiceMode === 'tts' && (
            <div className="mb-4">
              <p className="text-xs font-semibold vs-text mb-2">Voice</p>
              <div className="flex flex-wrap gap-1.5">
                {VOICES.map(v => (
                  <button key={v} onClick={() => setVoiceVoice(v)} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{ backgroundColor: voiceVoice === v ? 'var(--vs-accent)' : 'var(--vs-card)', color: voiceVoice === v ? '#fff' : 'var(--vs-text-sub)', border: `1px solid ${voiceVoice === v ? 'var(--vs-accent)' : 'var(--vs-border)'}` }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
          {voiceMode === 'music' && (
            <div className="mb-4">
              <p className="text-xs font-semibold vs-text mb-2">Duration: {voiceDuration}s</p>
              <input type="range" min="10" max="120" value={voiceDuration} onChange={e => setVoiceDuration(parseInt(e.target.value))} className="w-full" />
            </div>
          )}
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">{voiceMode === 'tts' ? 'Text to speak' : 'Describe the music'}</p>
            <textarea value={voiceText} onChange={e => setVoiceText(e.target.value)}
              placeholder={voiceMode === 'tts' ? 'Type what you want to hear...' : 'A chill lo-fi beat with rain sounds...'}
              rows={3} className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none resize-none"
              style={{ backgroundColor: 'var(--vs-card)' }} />
          </div>
          <button onClick={handleVoiceGenerate} disabled={voiceLoading || !voiceText.trim()}
            className="vs-btn w-full py-3 rounded-xl text-sm font-bold mb-6 gap-2 flex items-center justify-center"
            style={{ opacity: voiceLoading || !voiceText.trim() ? 0.5 : 1 }}>
            {voiceLoading ? (<><Loader2 size={16} className="animate-spin" /> Generating...</>) : (<><Play size={16} /> Generate</>)}
          </button>
          {voiceError && <div className="vs-card border vs-border rounded-xl p-4 text-center mb-4"><p className="text-xl mb-1">💀</p><p className="text-xs vs-text-sub">{voiceError}</p></div>}
          {voiceResult && (
            <div className="vs-card border vs-border rounded-2xl p-4 mb-4">
              <audio controls src={voiceResult} className="w-full" />
              <a href={voiceResult} download={`vibescape-${voiceMode}-${Date.now()}.mp3`}
                className="vs-btn-outline w-full py-2 rounded-xl text-xs font-semibold mt-3 gap-1 flex items-center justify-center">
                <Download size={14} /> Download
              </a>
              <p className="text-[10px] vs-text-sub text-center mt-2">Audio is not saved — download before leaving.</p>
            </div>
          )}
        </div>
      )}

      {/* VIDEO */}
      {tab === 'video' && (
        <div>
          <div className="vs-card border vs-border rounded-xl p-3 mb-4 text-center">
            <p className="text-[10px] vs-text-sub">Model: <strong className="vs-text">Nova Reel</strong> · API key required</p>
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Duration: {videoDuration}s (6-60s)</p>
            <input type="range" min="6" max="60" value={videoDuration} onChange={e => setVideoDuration(parseInt(e.target.value))} className="w-full" />
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold vs-text mb-2">Prompt</p>
            <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
              placeholder="A drone shot over a cyberpunk city at night..." rows={3}
              className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none resize-none"
              style={{ backgroundColor: 'var(--vs-card)' }} />
          </div>
          <button onClick={handleVideoGenerate} disabled={videoLoading || !videoPrompt.trim()}
            className="vs-btn w-full py-3 rounded-xl text-sm font-bold mb-6 gap-2 flex items-center justify-center"
            style={{ opacity: videoLoading || !videoPrompt.trim() ? 0.5 : 1 }}>
            {videoLoading ? (<><Loader2 size={16} className="animate-spin" /> Generating...</>) : (<><Film size={16} /> Generate</>)}
          </button>
          {videoError && <div className="vs-card border vs-border rounded-xl p-4 text-center mb-4"><p className="text-xl mb-1">💀</p><p className="text-xs vs-text-sub">{videoError}</p></div>}
          {videoResult && (
            <div className="vs-card border vs-border rounded-2xl overflow-hidden mb-4">
              <video controls src={videoResult} className="w-full" />
              <div className="p-3">
                <a href={videoResult} download={`vibescape-video-${Date.now()}.mp4`}
                  className="vs-btn w-full py-2 rounded-xl text-xs font-semibold gap-1 flex items-center justify-center">
                  <Download size={14} /> Download
                </a>
                <p className="text-[10px] vs-text-sub text-center mt-2">Video not saved — download before leaving.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENHANCE POPUP */}
      {showEnhancePopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-24" onClick={() => { if (!enhanceLoading) setShowEnhancePopup(false) }}>
          <div className="vs-card rounded-2xl border vs-border w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b vs-border">
              <div className="flex items-center gap-2">
                <Wand2 size={14} style={{ color: 'var(--vs-accent)' }} />
                <p className="text-sm font-bold vs-text">Prompt Enhanced</p>
              </div>
              {!enhanceLoading && (
                <button onClick={() => setShowEnhancePopup(false)} className="vs-text-sub p-1 rounded-lg vs-hover">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="p-4">
              {enhanceLoading ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 size={28} className="animate-spin vs-text-sub" />
                  <p className="text-xs vs-text-sub">cooking up something better...</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-[9px] font-bold vs-text-sub uppercase tracking-wider mb-1.5">Original</p>
                    <p className="text-[11px] vs-text-sub leading-relaxed line-clamp-2">{originalPromptForEnhance}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--vs-accent)' }}>Enhanced</p>
                    <div className="rounded-xl p-3 max-h-36 overflow-y-auto" style={{ background: 'var(--vs-bg)' }}>
                      <p className="text-[11px] vs-text leading-relaxed">
                        {enhancedPrompt || 'No result. Try re-enhancing.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleUseEnhanced} disabled={!enhancedPrompt}
                      className="flex-1 vs-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                      style={{ opacity: enhancedPrompt ? 1 : 0.4 }}>
                      <Check size={12} /> Use it
                    </button>
                    <button onClick={handleReEnhance}
                      className="flex-1 vs-btn-outline py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                      <RefreshCw size={12} /> Re-enhance
                    </button>
                    <button onClick={() => setShowEnhancePopup(false)}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold vs-text-sub border vs-border vs-hover">
                      Nope
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* READ MORE */}
      {readMoreText && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-24" onClick={() => setReadMoreText(null)}>
          <div className="vs-card rounded-2xl p-5 max-w-sm w-full border vs-border max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold vs-text">Full Prompt</p>
              <div className="flex items-center gap-2">
                <button onClick={() => copyText(readMoreText)} className="vs-text-sub vs-hover p-1.5 rounded-lg"><Copy size={14} /></button>
                <button onClick={() => setReadMoreText(null)} className="vs-text-sub vs-hover p-1.5 rounded-lg"><X size={14} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto"><p className="text-sm vs-text leading-relaxed">{readMoreText}</p></div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR RECENT */}
      {confirmClearRecent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setConfirmClearRecent(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="text-lg font-bold vs-text mb-2">Clear recent?</h3>
            <p className="text-sm vs-text-sub mb-5">Non-favorited images will be removed. Your ♥ favorites stay safe.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClearRecent(false)} className="flex-1 vs-btn-outline px-4 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleClearRecent} className="flex-1 vs-btn px-4 py-2.5 rounded-xl text-sm font-semibold">Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* POLLEN POPUP */}
      {showPollenPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowPollenPopup(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            {!userKey ? (
              <>
                <p className="text-4xl mb-3">🌼</p>
                <h3 className="text-lg font-bold vs-text mb-2">Your Pollen Situation</h3>
                <div className="vs-card border vs-border rounded-xl p-3 mb-4" style={{ background: 'var(--vs-bg)' }}>
                  <p className="text-2xl font-black vs-gradient-text">{balance !== null ? balance.toFixed(3) : '...'}</p>
                  <p className="text-[10px] vs-text-sub mt-1">pollen remaining</p>
                </div>
                <p className="text-xs vs-text-sub leading-relaxed mb-2">resets every hour whether you&apos;re ready or not 💀</p>
                <p className="text-xs vs-text-sub leading-relaxed mb-4">it&apos;s giving vending machine energy — insert prompt, get output, wait for refill. add your own key to skip the wait fr fr 🔑</p>
                <button onClick={() => { setShowPollenPopup(false); setShowKeyPopup(true) }}
                  className="vs-btn w-full py-2.5 rounded-xl text-sm font-semibold mb-3">
                  Add API Key — Skip the Queue
                </button>
                <button onClick={() => setShowPollenPopup(false)} className="w-full text-center text-[10px] vs-text-sub hover:underline">got it, i&apos;ll wait</button>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">✨</p>
                <h3 className="text-lg font-bold vs-text mb-2">you&apos;re built different</h3>
                <div className="vs-card border vs-border rounded-xl p-3 mb-4" style={{ background: 'var(--vs-bg)' }}>
                  <p className="text-2xl font-black vs-gradient-text">{balance !== null ? balance.toFixed(3) : '...'}</p>
                  <p className="text-[10px] vs-text-sub mt-1">pollen in your tank</p>
                </div>
                <p className="text-xs font-semibold vs-text-sub mb-1">key: {userKey.slice(0, 8)}...</p>
                <p className="text-xs vs-text-sub leading-relaxed mb-4">you brought your own key. respect. no hourly refreshes, no begging for pollen. while everyone else is waiting in line, you&apos;re just out here eating. 😤</p>
                <button onClick={() => { setShowPollenPopup(false); setKeyReason('manage'); setShowKeyPopup(true) }}
                  className="vs-btn-outline w-full py-2.5 rounded-xl text-sm font-semibold mb-3">
                  Manage Key
                </button>
                <button onClick={() => setShowPollenPopup(false)} className="w-full text-center text-[10px] vs-text-sub hover:underline">close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* KEY POPUP */}
      {showKeyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => { setShowKeyPopup(false); setPendingAction(null) }}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full border vs-border" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">{keyReason === 'quota' ? '😭' : '🔑'}</p>
              <h3 className="text-lg font-bold vs-text mb-1">
                {keyReason === 'quota' ? 'Pollen depleted' : userKey && keyReason === 'manage' ? 'Manage Key' : 'Add API Key'}
              </h3>
              <p className="text-xs vs-text-sub leading-relaxed">
                {keyReason === 'quota' ? 'Server pollen is out. Add your own key to keep generating.' : 'Your personal Pollinations API key.'}
              </p>
            </div>
            {(!userKey || keyReason !== 'manage') && (
              <>
                <input type="text" value={keyInput} onChange={e => setKeyInput(e.target.value)}
                  placeholder="Paste your API key..." onKeyDown={e => e.key === 'Enter' && handleKeySave()}
                  className="w-full py-3 px-4 rounded-xl vs-card border vs-border text-sm vs-text outline-none mb-4"
                  style={{ backgroundColor: 'var(--vs-bg)' }} />
                <button onClick={handleKeySave} disabled={!keyInput.trim()}
                  className="vs-btn w-full py-2.5 rounded-xl text-sm font-semibold mb-3"
                  style={{ opacity: keyInput.trim() ? 1 : 0.5 }}>
                  Save Key
                </button>
              </>
            )}
            <div className="text-center mb-3">
              <a href="https://enter.pollinations.ai/" target="_blank" rel="noopener noreferrer"
                className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">
                Get one at Pollinations <ExternalLink size={12} />
              </a>
            </div>
            {userKey && (
              <div className="pt-3 border-t vs-border text-center">
                <p className="text-[10px] vs-text-sub mb-1">Active key: {userKey.slice(0, 8)}...</p>
                <button onClick={() => { handleKeyClear(); setShowKeyPopup(false) }} className="text-[10px] vs-text-sub hover:underline">Remove key</button>
              </div>
            )}
            <button onClick={() => { setShowKeyPopup(false); setPendingAction(null) }}
              className="w-full text-center text-[10px] vs-text-sub hover:underline mt-3">Close</button>
          </div>
        </div>
      )}

      {/* ERROR POPUP */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setErrorPopup(null)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">{errorPopup.emoji}</p>
            <h3 className="text-lg font-bold vs-text mb-2">{errorPopup.title}</h3>
            <p className="text-sm vs-text-sub mb-5">{errorPopup.desc}</p>
            <button onClick={() => setErrorPopup(null)} className="vs-btn px-6 py-2.5 rounded-xl text-sm font-semibold">Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}
