import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'About | VibeScape',
}

export default function About() {
  return (
    <div className="px-6 py-10 max-w-lg mx-auto">
      <a href="/" className="inline-flex items-center gap-2 text-sm vs-text-sub mb-8 hover:underline">
        <ArrowLeft size={16} /> Back to home
      </a>

      <h1 className="text-3xl font-black vs-text mb-2">
        About <span className="vs-gradient-text">VibeScape</span>
      </h1>
      <p className="text-sm vs-text-sub mb-8">the lore nobody asked for</p>

      <div className="flex flex-col gap-6 text-sm vs-text leading-relaxed">
        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold mb-2">WTF is VibeScape?</h2>
          <p className="vs-text-sub">
            VibeScape is what happens when someone with zero budget, 
            way too much free time, and an unhealthy internet addiction 
            decides to build a website. It serves you the shortest, 
            most brain-rotting videos from YouTube and lets you generate 
            cursed AI images. You know, the essentials.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold mb-2">Why does this exist?</h2>
          <p className="vs-text-sub">
            Because scrolling through YouTube Shorts for 4 hours straight 
            wasn&apos;t efficient enough. We needed a faster way to destroy 
            our attention spans. Think of it as a speedrun for brain rot. 
            Any% no skips.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold mb-2">Who made this?</h2>
          <p className="vs-text-sub">
            Some anonymous person on the internet who probably should 
            be doing something more productive. Built from a phone. 
            Yes, a phone. No laptop. Just vibes, caffeine, and 
            questionable life decisions.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold mb-2">Tech stack (for the nerds)</h2>
          <p className="vs-text-sub">
            Next.js, Tailwind CSS, YouTube API, Pollinations AI, 
            deployed on Vercel. Coded in Termux on a phone like 
            a true chaotic neutral. The bugs are features. 
            The features are accidents. We don&apos;t do documentation here.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold mb-2">Contact</h2>
          <p className="vs-text-sub">
            Don&apos;t. Just kidding. But also not really. 
            If the site breaks, refresh. If it&apos;s still broken, 
            come back tomorrow. That&apos;s our support team.
          </p>
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-xs vs-text-sub">
          built different. fueled by chaos. deployed on vercel.
        </p>
      </div>
    </div>
  )
}
