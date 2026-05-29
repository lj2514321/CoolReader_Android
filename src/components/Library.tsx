import { useState, useEffect, useRef } from 'react'
import type { BookRecord } from '../utils/db'
import type { WebDAVConfig, AIConfig } from '../types'
import { loadSetting } from '../utils/db'
import { bgPresets, defGrad } from '../utils/styles'
import { SidebarNav } from './SidebarNav'
import { BookShelf } from './BookShelf'
import { SettingsPage } from './SettingsPage'
import { StatsPage } from './StatsPage'

const TRANSITION_DURATION = 200

interface LibraryProps {
  books: BookRecord[]
  readingTime: number
  progressRecords: { filePath: string; progress: number; updatedAt: number }[]
  onOpenBook: (filePath: string) => void
  onImport: () => void
  onDelete: (filePath: string, deleteFile: boolean) => void
  onBgChange?: (g: string) => void
  webdavConfig?: WebDAVConfig | null
  onWebDAVConfigChange?: (config: WebDAVConfig | null) => void
  aiConfig?: AIConfig | null
  onAIConfigChange?: (config: AIConfig | null) => void
  startupBehavior?: 'library' | 'resume'
  onStartupBehaviorChange?: (v: 'library' | 'resume') => void
}

type LibPage = 'books' | 'stats' | 'settings'

export function Library({ books, readingTime, progressRecords, onOpenBook, onImport, onDelete, onBgChange, webdavConfig, onWebDAVConfigChange, aiConfig, onAIConfigChange, startupBehavior, onStartupBehaviorChange }: LibraryProps) {
  const [libPage, setLibPage] = useState<LibPage>('books')
  const [transition, setTransition] = useState<'idle' | 'out' | 'in'>('idle')
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const transRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [bgKey, setBgKey] = useState('deepPurple')
  const [settingsResetKey, setSettingsResetKey] = useState(0)
  const [readingGoal, setReadingGoal] = useState(0)

  useEffect(() => {
    Promise.all([
      loadSetting('bgPreset'),
      loadSetting('readingGoal'),
    ]).then(([bg, goal]) => {
      if (bg) {
        setBgKey(bg)
        const g = bgPresets.find((b) => b.key === bg)?.gradient || defGrad
        onBgChange?.(g)
      } else {
        onBgChange?.(defGrad)
      }
      if (goal) setReadingGoal(Number(goal))
    }).catch((e) => console.warn('[Library]', e))
  }, [onBgChange])

  useEffect(() => () => clearTimeout(transRef.current), [])

  const switchPage = (target: LibPage) => {
    if (target === libPage) return
    clearTimeout(transRef.current)
    if (target === 'settings' || libPage === 'settings') setSettingsResetKey(k => k + 1)
    const pageOrder: LibPage[] = ['books', 'stats', 'settings']
    const dir = pageOrder.indexOf(target) > pageOrder.indexOf(libPage) ? 'left' : 'right'
    setDirection(dir)
    setTransition('out')
    transRef.current = setTimeout(() => {
      setLibPage(target)
      setTransition('in')
      transRef.current = setTimeout(() => setTransition('idle'), TRANSITION_DURATION)
    }, 0)
  }

  const pageAnim = (page: LibPage): { opacity: number; transform: string } => {
    const active = libPage === page

    if (transition === 'idle') return { opacity: active ? 1 : 0, transform: 'translateX(0)' }
    if (transition === 'out') {
      // old page slides out, others stay hidden (preparing off-screen)
      const offset = direction === 'left' ? -28 : 28
      if (active) return { opacity: 0, transform: `translateX(${offset}px)` }
      return { opacity: 0, transform: `translateX(${-offset}px)` }
    }
    // transition === 'in': only the target (now active) page slides in
    if (active) return { opacity: 1, transform: 'translateX(0)' }
    return { opacity: 0, transform: `translateX(${direction === 'left' ? 28 : -28}px)` }
  }

  const handlePresetChange = (key: string, gradient: string) => {
    setBgKey(key)
    onBgChange?.(gradient)
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '0%', left: '20%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0%', right: '0%', width: '50%', height: '40%', background: 'radial-gradient(ellipse, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 1, overscrollBehavior: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0,
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: transition !== 'idle' || libPage !== 'books' ? 'none' : 'auto',
          ...pageAnim('books'),
        }}>
          <BookShelf books={books} readingTime={readingTime} readingGoal={readingGoal} progressRecords={progressRecords} onOpenBook={onOpenBook} onDelete={onDelete} onImport={onImport} />
        </div>

        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: transition !== 'idle' || libPage !== 'stats' ? 'none' : 'auto',
          ...pageAnim('stats'),
        }}>
          <StatsPage books={books} readingTime={readingTime} readingGoal={readingGoal} />
        </div>
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: transition !== 'idle' || libPage !== 'settings' ? 'none' : 'auto',
          ...pageAnim('settings'),
        }}>
          <SettingsPage bgKey={bgKey} onPresetChange={handlePresetChange} resetKey={settingsResetKey} visible={libPage === 'settings'} webdavConfig={webdavConfig ?? null} onWebDAVConfigChange={onWebDAVConfigChange} aiConfig={aiConfig ?? null} onAIConfigChange={onAIConfigChange} readingGoal={readingGoal} onReadingGoalChange={setReadingGoal} startupBehavior={startupBehavior} onStartupBehaviorChange={onStartupBehaviorChange} />
        </div>
      </div>

      <SidebarNav libPage={libPage} onSwitchPage={switchPage} />
    </div>
  )
}
