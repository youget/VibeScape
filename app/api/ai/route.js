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

    // ── AUDIO (Qwen-TTS & ACE-Step) ──────────────────────────────
    if (action === 'audio') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })
      if (!prompt) return Response.json({ error: 'missing_prompt' }, { status: 400 })

      const encoded = encodeURIComponent(prompt.trim())
      const params = new URLSearchParams({ key: userKey })

      const isMusic = model === 'acestep'

      if (isMusic) {
        // ACE-Step 1.5 Turbo (Music Generation)
        params.set('model', 'acestep')
        if (voice) params.set('style', voice) // style = genre/mood
        const d = Math.min(Math.max(Number(duration) || 15, 5), 120)
        params.set('duration', String(d))
      } else {
        // Qwen3-TTS Flash (Text-to-Speech)
        params.set('model', 'qwen-tts')
        params.set('voice', voice || 'alloy')
      }

      const audioUrl = `https://gen.pollinations.ai/audio/${encoded}?${params.toString()}`
      return Response.json({ audio: audioUrl })
    }

    // ── VIDEO (LTX-2.3 Default) ──────────────────────────────────
    if (action === 'video') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })
      if (!prompt) return Response.json({ error: 'missing_prompt' }, { status: 400 })

      const videoModel = model || 'ltx-2'
      const isLtx = videoModel === 'ltx-2'
      const minDur = isLtx ? 5 : 6
      const maxDur = isLtx ? 30 : 120
      const videoDuration = Math.min(Math.max(parseInt(duration) || minDur, minDur), maxDur)

      let refImageUrl = imageUrl || null
      if (imageBase64 && !refImageUrl) {
        try {
          const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '')
          const binaryData = Buffer.from(base64Data, 'base64')
          const formData = new FormData()
          formData.append('file', new Blob([binaryData], { type: 'image/jpeg' }), 'ref.jpg')

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
          console.warn('Reference image upload failed:', e.message)
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

    // ── STT / TRANSCRIPTION (Optional: Universal-2) ──────────────
    if (action === 'transcribe') {
      if (!hasUserKey) return Response.json({ error: 'user_key_required' }, { status: 401 })
      // Note: STT usually requires file upload to Pollinations. 
      // This is a placeholder for future audio-file upload handling.
      return Response.json({ error: 'stt_not_implemented_yet' }, { status: 501 })
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
