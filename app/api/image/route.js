export const maxDuration = 60

export async function POST(request) {
  const { prompt, model, width, height, seed, enhance, userKey } = await request.json()

  // User's own key takes priority, fall back to server key
  const key = userKey || process.env.POLLI_PK
  if (!key) return Response.json({ error: 'no_key' }, { status: 500 })

  const params = new URLSearchParams({
    model: model || 'flux',
    width: String(width || 1024),
    height: String(height || 1024),
    seed: String(seed || Math.floor(Math.random() * 999999)),
    safe: 'false',
    nologo: 'true',
  })
  if (enhance) params.set('enhance', 'true')

  const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params}`

  try {
    const res = await fetch(imageUrl, {
      headers: { 'Authorization': `Bearer ${key}` },
    })

    if (!res.ok) {
      if (res.status === 402) return Response.json({ error: 'quota_exceeded' }, { status: 402 })
      if (res.status === 401) return Response.json({ error: 'invalid_key' }, { status: 401 })
      if (res.status === 429) return Response.json({ error: 'rate_limit' }, { status: 429 })
      if (res.status === 403) return Response.json({ error: 'forbidden' }, { status: 403 })
      return Response.json({ error: 'api_error' }, { status: res.status })
    }

    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('image')) return Response.json({ error: 'not_image' }, { status: 500 })

    const buffer = await res.arrayBuffer()
    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': ct, 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('Image proxy error:', err.message)
    return Response.json({ error: 'server_error' }, { status: 500 })
  }
}
