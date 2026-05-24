export const maxDuration = 120 

export async function POST(request) {
  const body = await request.json()
  const { action, messages, prompt, model, userKey, voice, duration, imageUrl, imageBase64 } = body

  const hasUserKey = !!userKey
  const key = userKey || process.env.POLLI_PK

  if (!key) {
    return Response.json({ error: 'no_key', message: 'No API key found.' }, { status: 500 })
  }

  const auth = { 'Authorization': `Bearer ${key}` }

  try {
    // ── CHAT ────────────────────────────────────────────────────
    if (action === 'chat') {
      let chatMessages = messages || [{ role: 'user', content: prompt }]
      while (chatMessages.length > 0 && chatMessages[0].role === 'assistant') {
        chatMessages = chatMessages.slice(1)
      }
      if (chatMessages.length === 0) {
        return Response.json({ result: 'Yo send me a message first!' })
      }
      const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'openai', messages: chatMessages }),
      })
      const rawText = await res.text()
      if (!res.ok) return handleErr(res.status, rawText)
      try {
        const data = JSON.parse(rawText)
        return Response.json({ result: data.choices?.[0]?.message?.content || '' })
      } catch {
        return Response.json({ result: rawText })
      }
    }

    // ── AUDIO ───────────────────────────────────────────────────
    if (action === 'audio') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })

      const encoded = encodeURIComponent(prompt.trim())
      const params = new URLSearchParams()
      params.set('key', userKey)

      const isMusic = model === 'elevenmusic'
      if (isMusic) {
        params.set('model', 'elevenmusic')
        if (voice) params.set('style', voice)
      } else {
        params.set('voice', voice || 'nova')
      }
      if (isMusic && duration) params.set('duration', String(Math.min(Math.max(duration, 10), 120)))

      const audioUrl = `https://gen.pollinations.ai/audio/${encoded}?${params.toString()}`
      return Response.json({ audio: audioUrl })
    }

    // ── VIDEO ───────────────────────────────────────────────────
    if (action === 'video') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })

      const videoModel = model || 'nova-reel'
      const isNovaReel = videoModel === 'nova-reel'
      const minDur = isNovaReel ? 6 : 5
      const maxDur = isNovaReel ? 120 : 30
      const videoDuration = Math.min(Math.max(parseInt(duration) || minDur, minDur), maxDur)

      let refImageUrl = imageUrl || null
      if (imageBase64 && !refImageUrl) {
        try {
          const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
          const binaryStr = atob(base64Data)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
          const formData = new FormData()
          formData.append('file', new Blob([bytes], { type: 'image/jpeg' }), 'ref.jpg')
          const uploadRes = await fetch('https://media.pollinations.ai', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}` },
            body: formData,
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            refImageUrl = uploadData.url || (uploadData.id ? `https://media.pollinations.ai/${uploadData.id}` : null)
          }
        } catch (e) {
          console.warn('Image upload failed:', e.message)
        }
      }

      const encoded = encodeURIComponent(prompt.trim())
      const params = new URLSearchParams({
        model: videoModel,
        duration: String(videoDuration),
        key: userKey, 
      })
      if (refImageUrl) params.set('image', refImageUrl)

      const videoUrl = `https://gen.pollinations.ai/video/${encoded}?${params.toString()}`
      return Response.json({ video: videoUrl })
    }

    return Response.json({ error: 'invalid_action' }, { status: 400 })
  } catch (error) {
    console.error('Server error:', error)
    return Response.json({ error: 'server_error', message: error.message }, { status: 500 })
  }
}

function handleErr(status, detail) {
  const map = {
    402: { error: 'quota_exceeded', message: 'Pollen depleted' },
    401: { error: 'invalid_key', message: 'Invalid API key' },
    403: { error: 'forbidden', message: 'Access denied' },
  }
  const err = map[status] || { error: 'api_error', message: detail || 'Unknown error' }
  return Response.json(err, { status })
}
