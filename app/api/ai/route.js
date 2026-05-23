export const maxDuration = 60

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
        body: JSON.stringify({ model: model || 'nova-fast', messages: chatMessages }),
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

      const encoded = encodeURIComponent(prompt)
      const params = new URLSearchParams({ key: userKey })

      const isMusic = model === 'elevenmusic'
      if (isMusic) {
        params.set('model', 'elevenmusic')
        if (voice) params.set('voice', voice)
      } else {
        const ttsVoice = voice || 'nova'
        params.set('voice', ttsVoice)
      }

      if (isMusic && duration) params.set('duration', String(duration))

      const audioUrl = `https://gen.pollinations.ai/audio/${encoded}?${params}`
      return Response.json({ audio: audioUrl })
    }

    // ── VIDEO ───────────────────────────────────────────────────
    if (action === 'video') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })

      const videoModel = model || 'nova-reel'

      const minDuration = videoModel === 'nova-reel' ? 6 : 5
      const videoDuration = Math.max(parseInt(duration) || minDuration, minDuration)

      let refImageUrl = imageUrl || null

      if (imageBase64 && !refImageUrl) {
        try {
          const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '')
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
            refImageUrl = uploadData.url || uploadData.id
              ? `https://media.pollinations.ai/${uploadData.id}`
              : null
          }
        } catch (e) {
          console.log('Image upload failed:', e.message)
          }
      }

      const encoded = encodeURIComponent(prompt)
      const params = new URLSearchParams({
        model: videoModel,
        duration: String(videoDuration),
        key: userKey,
      })

      if (refImageUrl) params.set('image', refImageUrl)

      const videoUrl = `https://gen.pollinations.ai/video/${encoded}?${params}`
      return Response.json({ video: videoUrl })
    }

    return Response.json({ error: 'invalid_action' }, { status: 400 })

  } catch (error) {
    console.log('Server error:', error.message)
    return Response.json({ error: 'server_error', message: error.message }, { status: 500 })
  }
}

function handleErr(status, detail) {
  if (status === 402) return Response.json({ error: 'quota_exceeded', message: detail }, { status: 402 })
  if (status === 401) return Response.json({ error: 'invalid_key', message: detail }, { status: 401 })
  if (status === 403) return Response.json({ error: 'forbidden', message: detail }, { status: 403 })
  return Response.json({ error: 'api_error', message: detail || 'Unknown error' }, { status })
}
