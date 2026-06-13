import { NextResponse } from 'next/server'

export async function GET(req) {
  const type = new URL(req.url).searchParams.get('type') || 'text'

  const urlMap = {
    text:  'https://gen.pollinations.ai/text/models',
    image: 'https://gen.pollinations.ai/image/models',
    audio: 'https://gen.pollinations.ai/audio/models',
    video: 'https://gen.pollinations.ai/image/models',
  }

  const url = urlMap[type]
  if (!url) return NextResponse.json({ error: 'invalid type' }, { status: 400 })

  try {
    const res  = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return NextResponse.json({ error: 'upstream failed' }, { status: 502 })
    const data = await res.json()
    let list   = Array.isArray(data) ? data : (data.models || data.data || [])

    if (type === 'video') {
      list = list.filter(m => {
        const name = (m.name || m.id || '').toLowerCase()
        const desc = (m.description || '').toLowerCase()
        return name.includes('video') || desc.includes('video')
      })
    }

    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
