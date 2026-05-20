import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Disclaimer | VibeScape',
}

export default function Disclaimer() {
  return (
    <div className="px-6 py-10 max-w-lg mx-auto">
      <a href="/" className="inline-flex items-center gap-2 text-sm vs-text-sub mb-8 hover:underline">
        <ArrowLeft size={16} /> Back to home
      </a>

      <h1 className="text-3xl font-black vs-text mb-2">
        Disclaimer
      </h1>
      <p className="text-sm vs-text-sub mb-8">the boring but necessary stuff</p>

      <div className="flex flex-col gap-6 text-sm vs-text-sub leading-relaxed">
        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Third-Party Content</h2>
          <p>
            All videos displayed on VibeScape are sourced from YouTube 
            via the official YouTube Data API. We do not own, host, or 
            claim ownership of any video content. All rights belong to 
            their respective creators and copyright holders.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">AI Generated Content</h2>
          <p>
            AI-generated images and text are created using the 
            Pollinations.ai API. Results may be unpredictable, weird, 
            or occasionally cursed. We are not responsible for whatever 
            your imagination decides to generate. Use responsibly. 
            Or don&apos;t. We&apos;re not your parents.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">No Guarantees</h2>
          <p>
            This website is provided &quot;as is&quot; without any 
            warranties of any kind. We don&apos;t guarantee that the 
            site will be available 24/7, bug-free, or that it won&apos;t 
            consume your entire afternoon. Proceed at your own risk 
            and screen time.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">External Links</h2>
          <p>
            VibeScape may contain links to external websites 
            (YouTube, Pollinations.ai, etc). We are not responsible 
            for the content, privacy policies, or practices of these 
            third-party sites. Clicking external links means you&apos;re 
            on your own, adventurer.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Accuracy</h2>
          <p>
            Video trending data, search results, and AI outputs may 
            not always be accurate, up-to-date, or make any sense 
            whatsoever. If you&apos;re using this site for research 
            purposes... please reconsider your research methods.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Changes</h2>
          <p>
            We reserve the right to modify this disclaimer at any 
            time without notice. But let&apos;s be real, the chances of 
            us remembering to update this page are approximately zero.
          </p>
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-xs vs-text-sub">
          Last updated: {new Date().getFullYear()}. Probably.
        </p>
      </div>
    </div>
  )
}
