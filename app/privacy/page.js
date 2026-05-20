import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | VibeScape',
}

export default function Privacy() {
  return (
    <div className="px-6 py-10 max-w-lg mx-auto">
      <a href="/" className="inline-flex items-center gap-2 text-sm vs-text-sub mb-8 hover:underline">
        <ArrowLeft size={16} /> Back to home
      </a>

      <h1 className="text-3xl font-black vs-text mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm vs-text-sub mb-8">tldr: we&apos;re not that creepy</p>

      <div className="flex flex-col gap-6 text-sm vs-text-sub leading-relaxed">
        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">What We Collect</h2>
          <p>
            Almost nothing. Seriously. We don&apos;t have a database. 
            We don&apos;t have user accounts. We don&apos;t even have 
            a budget for that kind of thing. The only data that exists 
            lives in YOUR browser via localStorage. That means:
          </p>
          <ul className="list-disc list-inside mt-3 flex flex-col gap-1">
            <li>Your theme preference (dark/light)</li>
            <li>Cached video search results (expires in 24 hours)</li>
            <li>Your favorite videos and AI generations</li>
            <li>Recent AI image prompts</li>
          </ul>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Where Is It Stored?</h2>
          <p>
            Everything is stored locally on YOUR device. In your browser. 
            We literally cannot see it even if we wanted to. 
            It&apos;s like writing in your diary — except the diary 
            is your browser&apos;s localStorage and nobody reads diaries 
            anymore anyway.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Cookies</h2>
          <p>
            We don&apos;t use cookies. Not the tracking kind, not the 
            chocolate chip kind. If your browser shows a cookie warning, 
            that&apos;s probably from an embedded YouTube player or 
            something. Blame Google, not us.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Third-Party Services</h2>
          <p>
            We use these external services that have their own 
            privacy policies:
          </p>
          <ul className="list-disc list-inside mt-3 flex flex-col gap-1">
            <li>
              <strong className="vs-text">YouTube API</strong> — 
              Subject to Google&apos;s Privacy Policy
            </li>
            <li>
              <strong className="vs-text">Pollinations.ai</strong> — 
              For AI image and text generation
            </li>
            <li>
              <strong className="vs-text">Vercel</strong> — 
              Our hosting provider
            </li>
          </ul>
          <p className="mt-3">
            When you watch a YouTube video or generate an AI image, 
            those services may collect their own data. We have no 
            control over that. Read their policies if you&apos;re 
            into that sort of thing.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Analytics</h2>
          <p>
            We currently don&apos;t use any analytics tools. 
            We have no idea how many people visit this site. 
            Could be 3 people. Could be 3 million. 
            We&apos;re vibing in the dark over here. 
            If we add analytics in the future, we&apos;ll update 
            this page. Probably.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Your Rights</h2>
          <p>
            Since all your data is stored locally in your browser, 
            you have full control:
          </p>
          <ul className="list-disc list-inside mt-3 flex flex-col gap-1">
            <li>Clear your browser data = everything gone</li>
            <li>Use incognito mode = nothing saved</li>
            <li>Switch browsers = fresh start</li>
          </ul>
          <p className="mt-3">
            You are your own data protection officer. 
            Congratulations on the promotion.
          </p>
        </div>

        <div className="vs-card border vs-border rounded-2xl p-5">
          <h2 className="font-bold vs-text mb-2">Changes</h2>
          <p>
            This policy may be updated whenever we remember it exists. 
            Which is rarely. But if something major changes, 
            we&apos;ll try our best to let you know. No promises though.
          </p>
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-xs vs-text-sub">
          Last updated: {new Date().getFullYear()}. We think.
        </p>
      </div>
    </div>
  )
}
