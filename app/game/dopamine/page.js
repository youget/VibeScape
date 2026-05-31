'use client'
import { useState, useEffect, useCallback } from 'react'
import { Sparkles, RotateCcw, Clock } from 'lucide-react'
import Link from 'next/link'

const GAME_STORAGE_KEY = 'vs-game-dopamine'
const AUTO_CLICKER_DURATION = 60 * 60 * 1000
const BASE_AUTO_CLICKER_COST = 50

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [clickPower, setClickPower] = useState(1)
  const [autoClickerActive, setAutoClickerActive] = useState(false)
  const [autoClickerEndTime, setAutoClickerEndTime] = useState(null)
  const [autoClickerCount, setAutoClickerCount] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [token, setToken] = useState(0)
  const [prestigeBonus, setPrestigeBonus] = useState(0)

  const [backupData, setBackupData] = useState(null)
  const [showResetMenu, setShowResetMenu] = useState(false)
  const [showHardResetConfirm, setShowHardResetConfirm] = useState(false)
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false)
  const [showBackupConfirm, setShowBackupConfirm] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [floats, setFloats] = useState([])

  // ===== Derived State: Prestige sebagai multiplier =====
  const effectiveClickPower = Math.max(1, Math.floor(clickPower * (1 + prestigeBonus / 100)))

  // ===== LOAD =====
  useEffect(() => {
    const saved = localStorage.getItem(GAME_STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      setScore(data.score || 0)
      setClickPower(data.clickPower || 1)
      setAutoClickerCount(data.autoClickerCount || 0)
      setTotalClicks(data.totalClicks || 0)
      setToken(data.token || 0)
      setPrestigeBonus(data.prestigeBonus || 0)

      // ✅ FIX: Validasi auto-clicker waktu saat load
      const now = Date.now()
      if (data.autoClickerEndTime && now < data.autoClickerEndTime) {
        setAutoClickerActive(true)
        setAutoClickerEndTime(data.autoClickerEndTime)
      } else {
        setAutoClickerActive(false)
        setAutoClickerEndTime(null)
      }
    }

    const backup = localStorage.getItem('vs-game-dopamine-backup')
    if (backup) {
      setBackupData(JSON.parse(backup))
    }
  }, [])

  // ===== SAVE =====
  useEffect(() => {
    localStorage.setItem(
      GAME_STORAGE_KEY,
      JSON.stringify({
        score,
        clickPower,
        autoClickerActive,
        autoClickerEndTime,
        autoClickerCount,
        totalClicks,
        token,
        prestigeBonus,
      })
    )
  }, [score, clickPower, autoClickerActive, autoClickerEndTime, autoClickerCount, totalClicks, token, prestigeBonus])

  // ===== Auto-clicker effect =====
  useEffect(() => {
    if (!autoClickerActive) return

    const interval = setInterval(() => {
      if (autoClickerEndTime && Date.now() > autoClickerEndTime) {
        setAutoClickerActive(false)
        setAutoClickerEndTime(null)
        return
      }
      setScore((prev) => prev + effectiveClickPower)
      setTotalClicks((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [autoClickerActive, autoClickerEndTime, effectiveClickPower])

  // ===== Click dengan floating feedback =====
  const handleClick = useCallback(
    (e) => {
      setScore((prev) => prev + effectiveClickPower)
      setTotalClicks((prev) => prev + 1)

      // Floating +number
      const id = Date.now() + Math.random()
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX || rect.left + rect.width / 2
      const y = e.clientY || rect.top
      setFloats((prev) => [...prev, { id, x, y, value: effectiveClickPower }])
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 900)
    },
    [effectiveClickPower]
  )

  const buyUpgrade = () => {
    const cost = 10 * clickPower
    if (score >= cost) {
      setScore((prev) => prev - cost)
      setClickPower((prev) => prev + 1)
    }
  }

  const buyAutoClicker = () => {
    const cost = BASE_AUTO_CLICKER_COST * (autoClickerCount + 1)
    if (score >= cost) {
      setScore((prev) => prev - cost)
      const now = Date.now()
      setAutoClickerEndTime(now + AUTO_CLICKER_DURATION)
      setAutoClickerActive(true)
      setAutoClickerCount((prev) => prev + 1)
    }
  }

  const convertToToken = () => {
    if (score >= 100) {
      const newTokens = Math.floor(score / 100)
      setToken((prev) => prev + newTokens)
      setScore((prev) => prev - newTokens * 100)
    }
  }

  // ===== RESET FUNCTIONS =====
  const hardReset = () => {
    setScore(0)
    setClickPower(1)
    setAutoClickerActive(false)
    setAutoClickerEndTime(null)
    setAutoClickerCount(0)
    setTotalClicks(0)
    setToken(0)
    setPrestigeBonus(0)

    localStorage.removeItem(GAME_STORAGE_KEY)
    setShowHardResetConfirm(false)
    setShowResetMenu(false)
  }

  const doPrestige = () => {
    const bonusIncrease = Math.floor(totalClicks / 10000)
    const newBonus = prestigeBonus + bonusIncrease

    // ✅ FIX: Reset clickPower ke base 1, prestige bonus terpisah sebagai multiplier
    setPrestigeBonus(newBonus)
    setScore(0)
    setClickPower(1)
    setAutoClickerActive(false)
    setAutoClickerEndTime(null)
    setAutoClickerCount(0)
    setTotalClicks(0)
    setToken(0)

    localStorage.setItem(
      GAME_STORAGE_KEY,
      JSON.stringify({
        score: 0,
        clickPower: 1,
        autoClickerActive: false,
        autoClickerEndTime: null,
        autoClickerCount: 0,
        totalClicks: 0,
        token: 0,
        prestigeBonus: newBonus,
      })
    )

    setShowPrestigeConfirm(false)
    setShowResetMenu(false)
  }

  const createBackup = () => {
    const currentData = {
      score,
      clickPower,
      autoClickerActive,
      autoClickerEndTime,
      autoClickerCount,
      totalClicks,
      token,
      prestigeBonus,
    }
    localStorage.setItem('vs-game-dopamine-backup', JSON.stringify(currentData))
    setBackupData(currentData)
    setShowBackupConfirm(false)
    setShowResetMenu(false)
  }

  const restoreBackup = () => {
    if (backupData) {
      setScore(backupData.score || 0)
      setClickPower(backupData.clickPower || 1)
      setAutoClickerCount(backupData.autoClickerCount || 0)
      setTotalClicks(backupData.totalClicks || 0)
      setToken(backupData.token || 0)
      setPrestigeBonus(backupData.prestigeBonus || 0)

      const now = Date.now()
      if (backupData.autoClickerEndTime && now < backupData.autoClickerEndTime) {
        setAutoClickerActive(true)
        setAutoClickerEndTime(backupData.autoClickerEndTime)
      } else {
        setAutoClickerActive(false)
        setAutoClickerEndTime(null)
      }

      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(backupData))
      setShowRestoreConfirm(false)
      setShowResetMenu(false)
    }
  }

  const getRemainingTime = () => {
    if (!autoClickerActive || !autoClickerEndTime) return 0
    return Math.max(0, Math.floor((autoClickerEndTime - Date.now()) / 1000))
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
  }

  const remaining = getRemainingTime()

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-black vs-text mb-1">
        Dopamine <span className="vs-gradient-text">Miner</span>
      </h1>
      <p className="text-xs vs-text-sub mb-6">tap tap — stack that dopamine</p>

      {/* ✅ Token & Pet Link */}
      <div className="flex justify-between items-center mb-4">
        <div className="vs-card border vs-border rounded-xl px-3 py-1.5 text-xs">
          🪙 Token: {token}
        </div>
        <div className="flex items-center gap-2">
          {prestigeBonus > 0 && (
            <div className="vs-card border vs-border rounded-xl px-3 py-1.5 text-xs">
              ⭐ +{prestigeBonus}%
            </div>
          )}
          <Link
            href="/game/pet"
            className="vs-card border vs-border rounded-xl px-3 py-1.5 text-xs vs-hover transition-all inline-flex items-center gap-1"
          >
            🐣 Pet
          </Link>
        </div>
      </div>

      {/* Convert Button */}
      <button
        onClick={convertToToken}
        className="vs-btn-outline w-full py-2 rounded-xl text-xs font-semibold mb-4"
        disabled={score < 100}
      >
        Convert 100 $DOPE → 1 🪙
      </button>

      {/* Score Display */}
      <div className="vs-card border vs-border rounded-2xl p-8 mb-4">
        <div className="text-5xl font-black vs-gradient-text mb-2">{score.toLocaleString()}</div>
        <div className="text-xs vs-text-sub">$DOPAMINE</div>
        {prestigeBonus > 0 && (
          <div className="text-[10px] vs-text-sub mt-1">
            Base {clickPower} × {prestigeBonus}% bonus = {effectiveClickPower} per click
          </div>
        )}
      </div>

      {/* Total Clicks */}
      <div className="vs-card border vs-border rounded-xl p-3 mb-4">
        <p className="text-[10px] vs-text-sub">Total Clicks (all time)</p>
        <p className="text-lg font-bold vs-accent">{totalClicks.toLocaleString()}</p>
      </div>

      {/* Auto-clicker Status */}
      {autoClickerActive && (
        <div className="flex items-center justify-center gap-2 mb-4 text-xs vs-text-sub">
          <Clock size={14} />
          <span>Auto-clicker: {formatTime(remaining)}</span>
        </div>
      )}

      {/* ✅ Main Click Button + floating feedback */}
      <div className="relative">
        <button
          onClick={handleClick}
          className="vs-btn w-40 h-40 rounded-full text-2xl font-bold mb-8 mx-auto flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{ background: 'var(--vs-accent)', color: '#fff' }}
        >
          <Sparkles size={48} />
        </button>

        {floats.map((f) => (
          <span
            key={f.id}
            className="fixed pointer-events-none text-lg font-bold z-50"
            style={{
              left: f.x,
              top: f.y,
              color: 'var(--vs-accent)',
              animation: 'floatUp 0.9s ease-out forwards',
            }}
          >
            +{f.value}
          </span>
        ))}
      </div>

      {/* Upgrade Area */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={buyUpgrade}
          className="vs-card border vs-border rounded-xl p-4 text-left vs-hover"
          disabled={score < 10 * clickPower}
        >
          <p className="text-xs font-semibold vs-text">Click Power</p>
          <p className="text-lg font-bold vs-accent">+{effectiveClickPower}</p>
          <p className="text-[10px] vs-text-sub">Price: {(10 * clickPower).toLocaleString()} $DOPE</p>
        </button>

        <button
          onClick={buyAutoClicker}
          className="vs-card border vs-border rounded-xl p-4 text-left vs-hover"
          disabled={score < BASE_AUTO_CLICKER_COST * (autoClickerCount + 1)}
        >
          <p className="text-xs font-semibold vs-text">Auto-Clicker</p>
          <p className="text-lg font-bold vs-accent">{autoClickerActive ? '⏳ Active' : '🔒'}</p>
          <p className="text-[10px] vs-text-sub">
            Price: {(BASE_AUTO_CLICKER_COST * (autoClickerCount + 1)).toLocaleString()} $DOPE
          </p>
          <p className="text-[8px] vs-text-sub">Lasts 1 hour • {autoClickerCount} bought</p>
        </button>
      </div>

      {/* Game Options Menu */}
      <div className="relative">
        <button
          onClick={() => setShowResetMenu(!showResetMenu)}
          className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
        >
          <RotateCcw size={14} /> Game Options
        </button>

        {showResetMenu && (
          <div className="absolute bottom-full mb-2 left-0 right-0 vs-card border vs-border rounded-xl p-2 shadow-lg z-10">
            <button
              onClick={() => { setShowHardResetConfirm(true); setShowResetMenu(false) }}
              className="w-full text-left px-3 py-2 text-xs vs-hover rounded-lg vs-text"
            >
              💀 Hard Reset (start over)
            </button>
            <button
              onClick={() => { setShowPrestigeConfirm(true); setShowResetMenu(false) }}
              className="w-full text-left px-3 py-2 text-xs vs-hover rounded-lg vs-text"
            >
              ⭐ Prestige (reset with bonus)
            </button>
            <button
              onClick={() => { setShowBackupConfirm(true); setShowResetMenu(false) }}
              className="w-full text-left px-3 py-2 text-xs vs-hover rounded-lg vs-text"
            >
              💾 Create Backup
            </button>
            {backupData && (
              <button
                onClick={() => { setShowRestoreConfirm(true); setShowResetMenu(false) }}
                className="w-full text-left px-3 py-2 text-xs vs-hover rounded-lg vs-text"
              >
                ↩️ Restore Backup
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] vs-text-sub mt-8">
        psst... soon you can flex these $DOPAMINE as real tokens
      </p>

      {/* ===== CONFIRMATION POPUPS ===== */}

      {showHardResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowHardResetConfirm(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">💀</p>
            <h3 className="text-lg font-bold vs-text mb-2">Hard Reset? fr fr?</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">
              All progress, tokens, clicks will vanish. Poof. Gone. No takebacks.
            </p>
            <div className="flex gap-3">
              <button onClick={hardReset} className="flex-1 vs-btn py-2.5 rounded-xl text-sm font-semibold">Yup, reset</button>
              <button onClick={() => setShowHardResetConfirm(false)} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-sm font-semibold">Nah, cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPrestigeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowPrestigeConfirm(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">⭐</p>
            <h3 className="text-lg font-bold vs-text mb-2">Prestige Time!</h3>
            <p className="text-sm vs-text-sub mb-2 leading-relaxed">
              You'll get <span className="vs-accent font-bold">+{Math.floor(totalClicks / 10000)}%</span> permanent click power multiplier.
            </p>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">
              Current bonus: {prestigeBonus}% → {prestigeBonus + Math.floor(totalClicks / 10000)}%. Everything else resets.
            </p>
            <div className="flex gap-3">
              <button onClick={doPrestige} className="flex-1 vs-btn py-2.5 rounded-xl text-sm font-semibold">Prestige!</button>
              <button onClick={() => setShowPrestigeConfirm(false)} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-sm font-semibold">Not yet</button>
            </div>
          </div>
        </div>
      )}

      {showBackupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowBackupConfirm(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">💾</p>
            <h3 className="text-lg font-bold vs-text mb-2">Save Backup?</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">
              Current progress will be saved. You can restore it anytime.
            </p>
            <div className="flex gap-3">
              <button onClick={createBackup} className="flex-1 vs-btn py-2.5 rounded-xl text-sm font-semibold">Backup now</button>
              <button onClick={() => setShowBackupConfirm(false)} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRestoreConfirm && backupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowRestoreConfirm(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-3">↩️</p>
            <h3 className="text-lg font-bold vs-text mb-2">Restore Backup?</h3>
            <p className="text-sm vs-text-sub mb-5 leading-relaxed">
              This will replace your current progress with the saved backup. Current progress will be lost!
            </p>
            <div className="flex gap-3">
              <button onClick={restoreBackup} className="flex-1 vs-btn py-2.5 rounded-xl text-sm font-semibold">Restore</button>
              <button onClick={() => setShowRestoreConfirm(false)} className="flex-1 vs-btn-outline py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
