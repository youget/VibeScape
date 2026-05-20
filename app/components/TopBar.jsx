'use client'

import { useState, useEffect } from 'react'
import {
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  Download,
  ChevronDown,
  Key,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

const USER_KEY_STORAGE = 'vs-user-polli-key'

// ─── Menu structure ───────────────────────────────────────────
const MENU_ITEMS = [
  {
    label: 'Videos',
    href: '/videos',
  },
  {
    label: 'AI',
    children: [
      { label: 'Fortune Teller', href: '/ai/chat?tab=peramal' },
      { label: 'Story Builder', href: '/ai/chat?tab=story' },
      { label: 'Blueprint Builder', href: '/ai/chat?tab=builder' },
      { label: 'Image', href: '/ai/create?tab=image' },
      { label: 'Audio', href: '/ai/create?tab=audio' },
      { label: 'Video', href: '/ai/create?tab=video' },
    ],
  },
  {
    label: 'Favourites',
    href: '/favorites',
  },
  {
    label: 'Games',
    children: [
      { label: 'Dopamine Miner', href: '/game/dopamine' },
      { label: 'Rabbit Run', href: '/game/rabbit' },
      { label: 'Digital Pet', href: '/game/pet' },
    ],
  },
  {
    label: 'Pollinations',
    href: 'https://pollinations.ai',
    external: true,
  },
]

export default function TopBar() {
  const pathname = usePathname()

  // ── Only show on landing page ──
  if (pathname !== '/') return null

  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setHasKey(!!localStorage.getItem(USER_KEY_STORAGE))

    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)

      const dismissed = localStorage.getItem('vs-install-dismissed')

      if (!dismissed) {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  // Re-check key whenever menu opens
  useEffect(() => {
    if (menuOpen) {
      setHasKey(!!localStorage.getItem(USER_KEY_STORAGE))
    }
  }, [menuOpen])

  async function handleInstall() {
    if (!installPrompt) return

    installPrompt.prompt()

    const result = await installPrompt.userChoice

    if (result.outcome === 'accepted') {
      setShowInstallBanner(false)
      setInstallPrompt(null)
    }
  }

  function dismissBanner() {
    setShowInstallBanner(false)
    localStorage.setItem('vs-install-dismissed', 'true')
  }

  function handleRemoveKey() {
    localStorage.removeItem(USER_KEY_STORAGE)
    setHasKey(false)
  }

  function toggleExpand(label) {
    setExpanded((prev) => (prev === label ? null : label))
  }

  function closeMenu() {
    setMenuOpen(false)
    setExpanded(null)
  }

  return (
    <>
      {/* ── Install Banner ── */}
      {showInstallBanner && (
        <div className="fixed top-14 left-0 right-0 z-50 px-4 py-2">
          <div className="vs-card border vs-border rounded-xl p-3 flex items-center gap-3 max-w-5xl mx-auto shadow-lg">
            <span className="text-xl">📲</span>

            <div className="flex-1">
              <p className="text-xs font-bold vs-text">
                Add VibeScape to home screen
              </p>

              <p className="text-[10px] vs-text-sub">
                Quick access, app-like experience
              </p>
            </div>

            <button
              onClick={handleInstall}
              className="vs-btn px-3 py-1.5 rounded-lg text-[10px] font-bold"
            >
              Install
            </button>

            <button
              onClick={dismissBanner}
              className="vs-text-sub p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 vs-glass border-b vs-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto">
          <a
            href="/"
            className="text-xl font-extrabold tracking-tight vs-gradient-text"
          >
            VibeScape
          </a>

          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl vs-hover transition-colors vs-text"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl vs-hover transition-colors vs-text"
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Side Menu ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeMenu}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Drawer */}
          <aside
            className="absolute right-0 top-14 w-72 h-[calc(100vh-56px)] vs-card border-l vs-border flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-0.5 p-3 flex-1">
              {MENU_ITEMS.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      {/* Expandable item */}
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold vs-text vs-hover transition-colors"
                      >
                        <span>{item.label}</span>

                        <ChevronDown
                          size={16}
                          className="vs-text-sub transition-transform duration-200"
                          style={{
                            transform:
                              expanded === item.label
                                ? 'rotate(180deg)'
                                : 'none',
                          }}
                        />
                      </button>

                      {/* Submenu */}
                      {expanded === item.label && (
                        <div
                          className="ml-3 mb-1 flex flex-col gap-0.5 border-l-2 pl-3"
                          style={{
                            borderColor: 'var(--vs-border)',
                          }}
                        >
                          {item.children.map((child) => (
                            <a
                              key={child.label}
                              href={child.href}
                              onClick={closeMenu}
                              className="flex items-center px-3 py-2.5 rounded-lg text-sm vs-text-sub vs-hover transition-colors"
                            >
                              {child.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Regular item */}
                      <a
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={
                          item.external
                            ? 'noopener noreferrer'
                            : undefined
                        }
                        onClick={closeMenu}
                        className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold vs-text vs-hover transition-colors"
                      >
                        <span>{item.label}</span>

                        {item.external && (
                          <ExternalLink
                            size={14}
                            className="vs-text-sub"
                          />
                        )}
                      </a>
                    </>
                  )}
                </div>
              ))}

              {/* Divider */}
              <div className="my-2 border-t vs-border" />

              {/* Install App */}
              {installPrompt && (
                <button
                  onClick={() => {
                    handleInstall()
                    closeMenu()
                  }}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold vs-text vs-hover transition-colors"
                >
                  <span>Install App</span>

                  <Download
                    size={14}
                    className="vs-text-sub"
                  />
                </button>
              )}

              {/* Key status */}
              <div className="px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key
                    size={14}
                    className="vs-text-sub"
                  />

                  <span className="text-sm font-semibold vs-text">
                    API Key
                  </span>
                </div>

                {hasKey ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: '#22c55e' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Active
                    </span>

                    <button
                      onClick={handleRemoveKey}
                      className="text-[10px] vs-text-sub hover:underline"
                    >
                      remove
                    </button>
                  </div>
                ) : (
                  <a
                    href="/ai/create"
                    onClick={closeMenu}
                    className="text-xs vs-text-sub hover:underline flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                    No key
                  </a>
                )}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
