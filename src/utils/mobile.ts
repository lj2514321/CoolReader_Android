/**
 * Mobile platform utilities — Screen Wake Lock, App Lifecycle, Haptics,
 * Screen Orientation, Screenshot Prevention, Share/PWA helpers.
 *
 * All functions are safe to call in web-only builds (no-op if APIs unavailable).
 */
import { App as CapacitorApp } from '@capacitor/app'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import type { OrientationLockType } from '@capacitor/screen-orientation'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'

// ─── Screen Wake Lock ────────────────────────────────────────────────────────
let wakeLockSentinel: WakeLockSentinel | null = null

/** Request screen wake lock (prevents screen from dimming/locking). */
export async function acquireWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await navigator.wakeLock.request('screen')
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null
      })
      return true
    }
  } catch (e) {
    console.warn('[mobile] wake lock request failed:', e)
  }
  return false
}

/** Release screen wake lock. */
export async function releaseWakeLock(): Promise<void> {
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release()
      wakeLockSentinel = null
    }
  } catch (e) {
    console.warn('[mobile] wake lock release failed:', e)
  }
}

/** Check if wake lock is currently active. */
export function isWakeLockActive(): boolean {
  return wakeLockSentinel !== null
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────
type AppStateCallback = (isActive: boolean) => void
const lifecycleListeners: AppStateCallback[] = []

let lifecycleInitialized = false

/** Register app state change listener (foreground/background). */
export function onAppStateChange(callback: AppStateCallback): () => void {
  lifecycleListeners.push(callback)

  if (!lifecycleInitialized) {
    lifecycleInitialized = true
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      lifecycleListeners.forEach(cb => cb(isActive))
    }).catch(e => console.warn('[mobile] appStateChange listener failed:', e))
  }

  return () => {
    const idx = lifecycleListeners.indexOf(callback)
    if (idx >= 0) lifecycleListeners.splice(idx, 1)
  }
}

/** Handle back button press. Returns cleanup function. */
export function onBackButton(callback: () => boolean): () => void {
  const handler = CapacitorApp.addListener('backButton', () => {
    const handled = callback()
    if (!handled) {
      CapacitorApp.exitApp()
    }
  })

  return () => {
    handler.then(h => h.remove()).catch(() => {})
  }
}

// ─── Haptics ─────────────────────────────────────────────────────────────────
/** Light impact feedback (e.g., button tap). */
export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {}
}

/** Medium impact feedback (e.g., page turn). */
export async function hapticMedium(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch {}
}

/** Heavy impact feedback (e.g., long press). */
export async function hapticHeavy(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } catch {}
}

/** Success notification feedback. */
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch {}
}

/** Error notification feedback. */
export async function hapticError(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Error })
  } catch {}
}

/** Vibrate for specified duration (fallback). */
export async function hapticVibrate(durationMs: number = 50): Promise<void> {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(durationMs)
    }
  } catch {}
}

// ─── Screen Orientation ──────────────────────────────────────────────────────
/** Lock screen to portrait orientation. */
export async function lockPortrait(): Promise<void> {
  try {
    await ScreenOrientation.lock({ orientation: 'portrait' as OrientationLockType })
  } catch (e) {
    console.warn('[mobile] lock portrait failed:', e)
  }
}

/** Lock screen to landscape orientation. */
export async function lockLandscape(): Promise<void> {
  try {
    await ScreenOrientation.lock({ orientation: 'landscape' as OrientationLockType })
  } catch (e) {
    console.warn('[mobile] lock landscape failed:', e)
  }
}

/** Unlock screen orientation (allow any). */
export async function unlockOrientation(): Promise<void> {
  try {
    await ScreenOrientation.unlock()
  } catch (e) {
    console.warn('[mobile] unlock orientation failed:', e)
  }
}

/** Get current screen orientation. */
export async function getOrientation(): Promise<string | null> {
  try {
    const info = await ScreenOrientation.orientation()
    return info.type
  } catch {
    return null
  }
}

// ─── Screenshot Prevention ───────────────────────────────────────────────────
// Uses custom native plugin ScreenshotPreventionPlugin.java

import { registerPlugin } from '@capacitor/core'

interface ScreenshotPreventionPlugin {
  enable(): Promise<{ enabled: boolean }>
  disable(): Promise<{ enabled: boolean }>
  isEnabled(): Promise<{ enabled: boolean }>
}

const ScreenshotPrevention = registerPlugin<ScreenshotPreventionPlugin>('ScreenshotPrevention')

/** Enable screenshot prevention (prevents screen capture). */
export async function enableScreenshotPrevention(): Promise<boolean> {
  try {
    const result = await ScreenshotPrevention.enable()
    return result.enabled
  } catch (e) {
    console.warn('[mobile] enable screenshot prevention failed:', e)
    return false
  }
}

/** Disable screenshot prevention. */
export async function disableScreenshotPrevention(): Promise<boolean> {
  try {
    const result = await ScreenshotPrevention.disable()
    return result.enabled
  } catch (e) {
    console.warn('[mobile] disable screenshot prevention failed:', e)
    return false
  }
}

/** Check if screenshot prevention is enabled. */
export async function isScreenshotPreventionEnabled(): Promise<boolean> {
  try {
    const result = await ScreenshotPrevention.isEnabled()
    return result.enabled
  } catch {
    return false
  }
}

// ─── Share ───────────────────────────────────────────────────────────────────
/** Share text content via system share sheet. */
export async function shareText(title: string, text: string, url?: string): Promise<boolean> {
  try {
    await Share.share({ title, text, url })
    return true
  } catch (e) {
    console.warn('[mobile] share failed:', e)
    return false
  }
}

/** Share a file (e.g., epub) via system share sheet. */
export async function shareFile(title: string, filePath: string, mimeType: string = 'application/epub+zip'): Promise<boolean> {
  try {
    await Share.share({
      title,
      files: [{ path: filePath, mimeType }],
    })
    return true
  } catch (e) {
    console.warn('[mobile] share file failed:', e)
    return false
  }
}

// ─── File Association Helpers ────────────────────────────────────────────────
/**
 * Check if app was opened with a file intent (Android).
 * Returns the file URI if available.
 */
export async function getOpenFileUri(): Promise<string | null> {
  try {
    // On Android, check if app was launched with an intent
    const info = await CapacitorApp.getLaunchUrl()
    if (info?.url) {
      return info.url
    }
  } catch {}
  return null
}

// ─── PWA / Install Prompt ────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null

/** Initialize PWA install prompt listener. */
export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e as BeforeInstallPromptEvent
  })
}

/** Check if PWA install prompt is available. */
export function canInstallPWA(): boolean {
  return deferredInstallPrompt !== null
}

/** Show PWA install prompt. Returns true if user accepted. */
export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false
  try {
    await deferredInstallPrompt.prompt()
    const result = await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    return result.outcome === 'accepted'
  } catch {
    return false
  }
}

// ─── Platform Detection ──────────────────────────────────────────────────────
/** Check if running on Android (Capacitor). */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent) || (window as any).Capacitor?.getPlatform() === 'android'
}

/** Check if running on iOS (Capacitor). */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (window as any).Capacitor?.getPlatform() === 'ios'
}

/** Check if running as a Capacitor native app. */
export function isNativeApp(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

/** Check if running as a PWA. */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}
