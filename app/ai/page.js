'use client'
import Link from 'next/link'
import { MessageCircle, Stars, Hammer, Image, Mic, Film } from 'lucide-react'

const chatTools = [
  {
    icon: Stars,
    label: 'Fortune',
    desc: 'Tarot readings, horoscopes, and all the mystical stuff that scares you but keeps you coming back.',
    href: '/ai/chat?tab=fortune',
  },
  {
    icon: MessageCircle,
    label: 'Story',
    desc: 'Build stories, characters, and worlds that make people forget to put the book down.',
    href: '/ai/chat?tab=story',
  },
  {
    icon: Hammer,
    label: 'Builder',
    desc: 'Blueprint Engine — turn raw ideas into execution-ready specs. Build apps, channels, or prompts.',
    href: '/ai/chat?tab=builder',
  },
]

const createTools = [
  {
    icon: Image,
    label: 'Image',
    desc: 'Generate AI images from text. From realistic to cursed art. No judgment whatsoever.',
    href: '/ai/create?tab=image',
  },
  {
    icon: Mic,
    label: 'Audio',
    desc: 'Text-to-speech or generate music. Make your content actually sound like something.',
    href: '/ai/create?tab=audio',
  },
  {
    icon: Film,
    label: 'Video',
    desc: 'Generate video from text. Still beta, but if it works you\'ll be screaming.',
    href: '/ai/create?tab=video',
  },
]

function ToolCard({ item }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className="vs-card border vs-border rounded-xl p-4 flex items-start gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--vs-bg2)' }}
      >
        <Icon size={20} style={{ color: 'var(--vs-text)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold vs-text mb-0.5">{item.label}</p>
        <p className="text-[11px] vs-text-sub leading-relaxed">{item.desc}</p>
      </div>
    </Link>
  )
}

export default function AIPage() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black vs-text text-center mb-1">
        AI <span className="vs-gradient-text">Toolbox</span>
      </h1>
      <p className="text-xs vs-text-sub text-center mb-8">
        everything you need to create world-class content. or just waste time productively.
      </p>

      <div className="mb-6">
        <p className="text-[10px] font-bold vs-text-sub uppercase tracking-wider mb-3">
          Chat Tools
        </p>
        <div className="flex flex-col gap-3">
          {chatTools.map((t) => <ToolCard key={t.href} item={t} />)}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold vs-text-sub uppercase tracking-wider mb-3">
          Create Tools
        </p>
        <div className="flex flex-col gap-3">
          {createTools.map((t) => <ToolCard key={t.href} item={t} />)}
        </div>
      </div>

      <p className="text-[9px] vs-text-sub text-center mt-8">
        powered by Pollinations.ai · api key optional for premium features
      </p>
    </div>
  )
}
