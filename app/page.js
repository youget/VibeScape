import { Flame, Zap, Heart, ArrowRight } from 'lucide-react'
import Mascot from './components/Mascot'

const features = [
  {
    icon: Flame,
    title: 'Viral Videos',
    desc: "Under 2 minutes. Because your attention span clocked out after the first sentence.",
  },
  {
    icon: Zap,
    title: 'AI Playground',
    desc: "Chat, generate images, build prompts — free tier included. You're welcome.",
  },
  {
    icon: Heart,
    title: 'Your Stash',
    desc: "Save videos, AI generations, chat history. No account needed. Your data stays with you.",
  },
]

const steps = [
  { num: '01', text: 'Open VibeScape' },
  { num: '02', text: 'Lose 3 hours of your life' },
  { num: '03', text: 'Question your life choices' },
]

export default function Home() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="vs-bg2 px-6 py-16 text-center overflow-hidden">
        <p className="text-sm font-semibold vs-accent uppercase tracking-widest mb-4">
          dopamine delivery service
        </p>

        <h1 className="text-4xl md:text-5xl font-black vs-text leading-tight max-w-md mx-auto mb-4">
          Your brain called.{' '}
          <span className="vs-gradient-text">It wants good vibes.</span>
        </h1>

        <p className="text-sm vs-text-sub max-w-xs mx-auto leading-relaxed mb-8">
          The shortest videos + AI tools on the internet. Completely free. No cap.
        </p>

        {/* Mascot */}
        <div className="flex flex-col items-center gap-6">
          <Mascot />

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/videos" className="vs-btn px-6 py-3 rounded-xl font-semibold text-sm gap-2">
              Watch Videos
            </a>
            <a href="/ai/chat" className="vs-btn-outline px-6 py-3 rounded-xl font-semibold text-sm gap-2">
              Try AI Chat
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <h2 className="text-center text-xs font-bold vs-text-sub uppercase tracking-widest mb-10">
          What&apos;s inside
        </h2>
        <div className="flex flex-col gap-4">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className="vs-card border vs-border rounded-2xl p-5 transition-transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: 'var(--vs-accent)' }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold vs-text">{f.title}</h3>
                </div>
                <p className="text-sm vs-text-sub leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="vs-bg2 px-6 py-16">
        <h2 className="text-center text-xs font-bold vs-text-sub uppercase tracking-widest mb-10">
          How it works
        </h2>
        <div className="flex flex-col gap-6 max-w-sm mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-3xl font-black vs-accent opacity-50">{s.num}</span>
              <p className="text-sm font-semibold vs-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl font-black vs-text mb-3">
          Ready to waste time{' '}
          <span className="vs-gradient-text">productively</span>?
        </h2>
        <p className="text-sm vs-text-sub mb-8">No signup. No ads. Just vibes.</p>
        <a
          href="/videos"
          className="vs-btn px-8 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
        >
          Get Started <ArrowRight size={16} />
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="text-center px-6 py-8 border-t vs-border">
        <div className="flex justify-center gap-5 mb-4">
          <a href="/about" className="text-xs vs-text-sub hover:underline">About</a>
          <a href="/disclaimer" className="text-xs vs-text-sub hover:underline">Disclaimer</a>
          <a href="/privacy" className="text-xs vs-text-sub hover:underline">Privacy</a>
        </div>
        <p className="text-xs vs-text-sub">
          built different. fueled by chaos. deployed on vercel.
        </p>
      </footer>
    </div>
  )
}
