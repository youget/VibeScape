# VibeScape 🧠⚡

> Your brain called. It wants dopamine. We delivered.

**VibeScape** is a free, mobile-first web app built from a phone (yes, really — Termux + no laptop, pure chaos energy) that combines viral short-form videos with a full AI playground. Built on [Pollinations.ai](https://pollinations.ai), deployed on Vercel, running on pure vibes and caffeine.

🌐 Live: [vibeze.vercel.app](https://vibeze.vercel.app)

---

## What even is this?

A speed-run for your attention span. VibeScape gives you:

- 📺 **YouTube Shorts** — trending + searchable, under 2 minutes, brain-rot certified
- 🤖 **AI Chat** — Fortune teller, story builder, prompt blueprint engine. Each tab is a different persona powered by a hand-picked Pollinations model
- 🎨 **AI Create** — Image, audio, and video generation with a hybrid free/BYOP model system
- 🎮 **Games** — Clicker game, endless runner, digital pet. Because why not
- ⭐ **Stash** — Save videos, AI generations, and chat history locally (IndexedDB, no server, your data stays with you)

---

## How we use Pollinations.ai

VibeScape is powered entirely by the [Pollinations.ai API](https://gen.pollinations.ai). Here's the breakdown:

### Text / Chat

We run a server-side proxy that uses our own Pollinations key (`POLLI_PK`) for the free tier. When users need more, they plug in their own key (BYOP mode). Chat tabs are assigned specific models based on the use case:

| Tab | Model | Why |
|-----|-------|-----|
| Fortune Teller | `nova-fast` | Fast, cheap, vibes-appropriate |
| Story Builder | `mistral` | Better creative writing, larger context |
| Blueprint Builder | `gemini-fast` (free) + BYOP models | Structured output, can use search |

### Image Generation

All image generation routes through a server-side `/api/image` proxy — server key never touches the browser. Free model: `flux`. BYOP unlocks: `klein`, `gptimage`, `qwen-image`, `wan-image`, `kontext`, `gptimage-large`, `zimage`.

### Audio & Video

TTS via `elevenlabs`, music via `elevenmusic`, video via `grok-video`. These require users to bring their own Pollinations key — we don't subsidize those (they're expensive lol).

### BYOP (Bring Your Own Pollen)

When server pollen runs out or user wants premium models, they enter their own `pk_...` key. We store it in `localStorage` — never in our backend. Their pollen, their control.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS v4
- **Storage:** IndexedDB (images, chat history) + localStorage (settings, keys)
- **Deployment:** Vercel
- **AI:** Pollinations.ai (chat, image, audio, video)
- **Video:** YouTube Data API v3
- **Icons:** lucide-react
- **Coded on:** A phone. In Termux. No laptop. Yes this is a flex.

---

## Environment Variables

```env
POLLI_PK=pk_your_pollinations_publishable_key  # Server-side image/chat free tier
YOUTUBE_API_KEY_1=your_yt_key                  # YouTube Data API (up to 5 keys with rotation)
YOUTUBE_API_KEY_2=...
```

**Security note:** `POLLI_PK` stays server-side only. Never use `NEXT_PUBLIC_` prefix for Pollinations keys — that ships your key to every user's browser.

---

## Run Locally

```bash
git clone https://github.com/youget/VibeScape.git
cd VibeScape
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- ✅ Dark/light mode
- ✅ PWA installable (Add to Home Screen)
- ✅ Mobile-first responsive design
- ✅ Hybrid free/BYOP AI model system
- ✅ Chat history saved locally (IndexedDB)
- ✅ AI image gallery with favorites
- ✅ YouTube trending by region
- ✅ Mini games (clicker, endless runner, digital pet)
- ✅ No user accounts, no tracking, no ads (yet)
- ✅ All data stays on your device

---

## Pollinations Model Usage

VibeScape currently uses the following Pollinations models in production:

**Text:** `nova-fast`, `mistral`, `gemini-fast`  
**Image:** `flux`, `zimage`, `klein`, `gptimage`, `qwen-image`, `wan-image`, `kontext`, `gptimage-large`  
**Audio:** `elevenlabs`, `elevenmusic`  
**Video:** `grok-video`

---

## About

Built by one person, on a phone, with no budget, an unhealthy internet addiction, and an unreasonable amount of Pollinations API calls. The bugs are features. The features are accidents.

> built different. fueled by chaos. deployed on vercel.

---

*VibeScape is not affiliated with YouTube or Pollinations.ai. All video content belongs to respective creators. AI content generated via Pollinations.ai API.*
