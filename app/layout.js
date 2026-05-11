import './globals.css'
import ThemeProvider from './components/ThemeProvider'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import ScrollToTop from './components/ScrollToTop'
import ToastContainer from './components/Toast'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B1121' },
    { media: '(prefers-color-scheme: light)', color: '#F4F4F5' },
  ],
}

export const metadata = {
  title: 'VibeScape',
  description: 'Your brain called. It wants good vibes. AI tools + videos to derail your productivity. Completely free. No cap.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'VibeScape',
    description: 'Your brain called. It wants good vibes. AI tools, videos, games — built on a phone, running on free tiers.',
    siteName: 'VibeScape',
    type: 'website',
    url: 'https://vibeze.vercel.app',
  },
  twitter: {
    card: 'summary',
    title: 'VibeScape',
    description: 'Videos + AI tools. Completely free. No cap.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VibeScape',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vs-theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TopBar />
          <main>{children}</main>
          <ScrollToTop />
          <BottomNav />
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  )
}
