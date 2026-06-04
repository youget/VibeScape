import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: '404 | VibeScape',
}

export default function NotFound() {
  return (
    <div className="px-6 py-20 max-w-lg mx-auto text-center">
      <p className="text-6xl mb-4">🕳️</p>
      <h1 className="text-4xl font-black vs-text mb-2">404</h1>
      <p className="text-lg font-bold vs-text mb-3">
        This page <span className="vs-gradient-text">yeeted itself</span> out of existence
      </p>
      <p className="text-sm vs-text-sub mb-8 leading-relaxed max-w-xs mx-auto">
        Whatever you were looking for, it&apos;s not here. 
        It might have never been here. Maybe it was all a dream. 
        Who knows. We certainly don&apos;t.
      </p>

      <div className="flex flex-col gap-3 items-center">
        <a href="/" className="vs-btn px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Take me home
        </a>
        <a href="/videos" className="vs-btn-outline px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2">
          Watch videos instead
        </a>
      </div>

      <div className="mt-16">
        <p className="text-xs vs-text-sub">
          Fun fact: you just wasted 5 seconds reading a 404 page.
          <br />That&apos;s 5 seconds of your life you&apos;ll never get back.
          <br />You&apos;re welcome.
        </p>
      </div>
    </div>
  )
}
